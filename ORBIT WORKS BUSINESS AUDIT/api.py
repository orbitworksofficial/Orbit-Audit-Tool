# --- Windows event loop policy ---------------------------------------------
# Must run before anything else creates an event loop.
#
# Playwright spawns a node subprocess to drive Chromium. On Windows only the
# Proactor loop supports subprocesses; under a Selector loop the spawn raises
# NotImplementedError. Uvicorn's --reload worker installs a Selector loop, so
# setting this inside pdf_report.py is too late — the loop already exists.
#
# No-op on Linux and macOS.
import sys
import asyncio
import warnings

if sys.platform == "win32":
    # set_event_loop_policy is deprecated in 3.14 but remains the only way to
    # influence a loop uvicorn creates on our behalf. Silence just this warning
    # rather than leaving it in the log on every start.
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
# ---------------------------------------------------------------------------

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid
import json
import traceback
import os

# Add backend dir to path so we can import our modules
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from orchestrator import run_audit_orchestrator
from ai_analysis import generate_ai_analysis
from supabase_client import save_audit_report
from pdf_report import generate_pdf
from config import OUTPUT_DIR

app = FastAPI(title="Business Audit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuditRequest(BaseModel):
    url: str
    full_name: str
    business_name: str
    city: str = ""
    country: str = ""
    category: str = ""
    email: str = ""
    whatsapp: str = ""


@app.post("/api/audit")
async def run_audit(request: AuditRequest):
    try:
        url = request.url.strip()
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        if not url.startswith("http"):
            url = "https://" + url

        result, ai_analysis = await _do_full_audit_async(
            url, request.full_name, request.business_name, request.city, request.country, request.category
        )

        # Save to Supabase (Layer 7)
        await save_audit_report(request.model_dump(), result, ai_analysis)

        # Fire and forget delivery
        asyncio.create_task(deliver_report(request.model_dump(), result, ai_analysis))

        return {"status": "success", "result": result, "ai_analysis": ai_analysis}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

async def _do_full_audit_async(url: str, full_name: str, business_name: str, city: str, country: str, category: str):
    # Layer 2 & 4
    orchestrator_result = await run_audit_orchestrator(business_name, url, city, country, category)
    
    # Layer 5
    ai_analysis = await generate_ai_analysis(orchestrator_result)
    
    return orchestrator_result, ai_analysis


async def deliver_report(lead: dict, result: dict, ai_analysis: dict):
    try:

        os.makedirs(OUTPUT_DIR, exist_ok=True)
        safe_name = lead["business_name"].replace(" ", "_")
        pdf_path = OUTPUT_DIR / f"report_{safe_name}.pdf"
        
        await generate_pdf(result, pdf_path, ai_analysis)

        # ─── MOCK DELIVERY ────────────────────────────────────────────────────
        # Replace these print blocks with real Twilio + SendGrid calls in prod.
        print("\n" + "="*60)
        print(f"[EMAIL]    To: {lead['email']}")
        print(f"[EMAIL]    Subject: Your Business Audit Report is Ready!")
        print(f"[EMAIL]    Attachment: {pdf_path}")
        print(f"[EMAIL]    Status: SENT (mock)")
        print("="*60)

        print(f"[WHATSAPP] To: {lead['whatsapp']}")
        print(f"[WHATSAPP] Message: Hi {lead['full_name']}! Your full digital audit report is ready.")
        print(f"[WHATSAPP] PDF: {pdf_path}")
        print(f"[WHATSAPP] Status: SENT (mock)")
        print("="*60 + "\n")

    except Exception as e:
        print(f"[DELIVERY ERROR] {e}")
        traceback.print_exc()


@app.get("/api/download-pdf/{row_id}")
async def download_pdf(row_id: str):
    try:
        from supabase_client import get_supabase_client
        client = get_supabase_client()
        
        # Fetch report from Supabase asynchronously using to_thread
        response = await asyncio.to_thread(
            client.table("audit_reports").select("*").eq("id", row_id).execute
        )
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Audit report not found")
            
        data = response.data[0]
        
        # Construct audit result from the DB row raw_data field
        result_data = data.get("raw_data") or {}
        
        # Reconstruct deep_analysis dictionary structure
        ai_analysis = {"deep_analysis": data.get("ai_insights")}
        
        # Generate the PDF file dynamically
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        pdf_path = OUTPUT_DIR / f"report_{row_id}.pdf"
        
        await generate_pdf(result_data, pdf_path, ai_analysis)
        
        return FileResponse(
            path=pdf_path,
            filename=f"Audit_Report_{result_data.get('business_name', 'Business')}.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Mount Frontend Static Build ─────────────────────────────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")


if __name__ == "__main__":

    import uvicorn

    # Hosting platforms assign the port via $PORT.
    port = int(os.getenv("PORT", 8000))
    is_dev = os.getenv("ENVIRONMENT", "development") == "development"

    # loop="asyncio" makes uvicorn build the loop from the policy set at the top
    # of this file. Its default ("auto") constructs a loop through its own path,
    # which ignores that policy in the --reload worker and yields a Selector
    # loop — the loop that cannot spawn the subprocess Playwright needs.
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=is_dev,
        loop="asyncio",
    )

