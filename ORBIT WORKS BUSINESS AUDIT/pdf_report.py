import os
import sys
import asyncio
from jinja2 import Environment, FileSystemLoader

# PDFs are normally produced by the visitor's own browser (print-to-PDF from
# the report page), so Playwright is optional. It is only needed for
# server-side generation — e.g. if you later email reports automatically.
# Import it lazily so the service runs on hosts without Chromium installed.
try:
    from playwright.async_api import async_playwright

    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

# Playwright spawns a node subprocess to drive Chromium, and on Windows only
# the Proactor loop can spawn subprocesses. Uvicorn's --reload worker runs on a
# Selector loop and ignores any policy we set at import time, so rather than
# fight for the server's loop we render on our own thread with our own loop.
# See _render_pdf_sync below. No special handling needed on Linux or macOS.

async def generate_pdf(result_data: dict, output_path: str, ai_analysis: dict = None):
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError(
            "Server-side PDF generation needs Playwright, which is not installed. "
            "Visitors download PDFs from the report page instead (browser "
            "print-to-PDF). To enable this endpoint, run: "
            "pip install playwright && playwright install chromium"
        )

    if ai_analysis is None:
        ai_analysis = {}

    # Set up jinja2 template
    template_dir = os.path.join(os.path.dirname(__file__), "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("report_template.html")
    
    html_content = template.render(
        business_name=result_data.get("business_name", "Business"),
        website_url=result_data.get("website_url", ""),
        location=result_data.get("location", ""),
        overall_score=result_data.get("overall_score", 0),
        module1_aeo_geo=result_data.get("module1_aeo_geo", {}),
        module2_website_health=result_data.get("module2_website_health", {}),
        module3_seo=result_data.get("module3_seo", {}),
        module4_reputation=result_data.get("module4_reputation", {}),
        module5_competitors=result_data.get("module5_competitors", {}),
        module6_social=result_data.get("module6_social", {}),
        ai_analysis=ai_analysis
    )
    
    # Render off the server's event loop, on a thread we fully control.
    await asyncio.to_thread(_render_pdf_sync, html_content, str(output_path))


def _render_pdf_sync(html_content: str, output_path: str) -> None:
    """
    Render HTML to PDF on a private event loop.

    Runs in a worker thread via asyncio.to_thread, so it can create whichever
    loop Playwright needs regardless of what the server is using. On Windows
    that means an explicit ProactorEventLoop, which is the only kind that can
    spawn the node subprocess driving Chromium.
    """
    if sys.platform == "win32":
        loop = asyncio.ProactorEventLoop()
    else:
        loop = asyncio.new_event_loop()

    try:
        loop.run_until_complete(_render(html_content, output_path))
    finally:
        loop.close()


async def _render(html_content: str, output_path: str) -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            page = await browser.new_page()
            await page.set_content(html_content, wait_until="networkidle")
            await page.pdf(path=output_path, format="A4", print_background=True)
        finally:
            await browser.close()
