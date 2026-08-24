import asyncio
import os
import httpx
from bs4 import BeautifulSoup
from dataforseo_client import dataforseo_post

import re

async def check_single_perplexity(client, q: str, business_name: str, headers: dict) -> tuple[bool, list]:
    payload = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant. Keep answers brief. At the very end of your response, you MUST output a comma-separated list of all other company/business names mentioned in your response (excluding the target company), enclosed in <companies>...</companies> tags. Example: <companies>Company A, Company B</companies>."},
            {"role": "user", "content": q}
        ]
    }
    competitors = []
    appears = False
    try:
        resp = await client.post("https://api.perplexity.ai/chat/completions", headers=headers, json=payload)
        if resp.status_code == 200:
            answer = resp.json()["choices"][0]["message"]["content"]
            if business_name.lower() in answer.lower():
                appears = True
            
            # Extract competitor names mentioned in the response
            match = re.search(r"<companies>(.*?)</companies>", answer, flags=re.IGNORECASE|re.DOTALL)
            if match:
                competitors = [c.strip() for c in match.group(1).split(",") if c.strip() and len(c.strip()) > 3]
            
            if not competitors:
                # Robust regex fallback for bullet points or lists if <companies> tags are missing or malformed
                candidates = []
                for line in answer.split("\n"):
                    line = line.strip()
                    m = re.match(r"^(?:\d+\.|\*|-)\s*([A-Za-z0-9\s.&'-]+?)(?:\s*[-:|–(].*)?$", line)
                    if m:
                        name = m.group(1).strip()
                        # Exclude self, locations, and generic category headers
                        if (name.lower() not in ["lahore", "pakistan", "baltimore", "software", "development", "it services", "the following", "here is", "best software"]
                                and business_name.lower() not in name.lower()):
                            candidates.append(name)
                competitors = [c for c in candidates if len(c) > 3]
    except Exception as e:
        print(f"Perplexity Error on query '{q}': {repr(e)}")
    return appears, competitors

async def check_perplexity(queries: list, business_name: str, city: str) -> tuple[int, list]:
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        return 0, []
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    competitors_instead = set()
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [check_single_perplexity(client, q, business_name, headers) for q in queries]
        results = await asyncio.gather(*tasks)
        
    appearances = sum(1 for appears, _ in results if appears)
    for _, competitors in results:
        for c in competitors:
            competitors_instead.add(c)
            
    return appearances, list(competitors_instead)[:5]

async def check_single_ai_overview(q: str, business_name: str) -> bool:
    payload = [{"keyword": q, "location_code": 2840, "language_code": "en", "depth": 10, "load_async_ai_overview": True}]
    try:
        resp = await dataforseo_post("serp/google/organic/live/advanced", payload)
        tasks = resp.get("tasks", [])
        if tasks and tasks[0].get("result") and tasks[0]["result"][0]:
            items = tasks[0]["result"][0].get("items") or []
            for item in items:
                if item.get("type") == "ai_overview":
                    ai_text = str(item).lower()
                    if business_name.lower() in ai_text:
                        return True
    except Exception as e:
        print(f"DataForSEO AI Error on query '{q}': {repr(e)}")
    return False

async def check_dataforseo_ai_overview(queries: list, business_name: str) -> int:
    tasks = [check_single_ai_overview(q, business_name) for q in queries]
    results = await asyncio.gather(*tasks)
    return sum(1 for found in results if found)

async def check_schema(url: str) -> dict:
    # Check metadata, schema, and structural tags requested by spec
    schema_signals = {
        "has_organization": False,
        "has_faq": False,
        "has_local_business": False,
        "meta_tags_quality": "Poor",
        "has_og_tags": False,
        "h1_quality": "Poor",
        "has_canonical": False
    }
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.get(url, follow_redirects=True)
            if resp.status_code == 200:
                html = resp.text
                soup = BeautifulSoup(html, "html.parser")
                
                # Check JSON-LD schema
                for script in soup.find_all("script", type="application/ld+json"):
                    content = script.string.lower() if script.string else ""
                    if "organization" in content:
                        schema_signals["has_organization"] = True
                    if "faqpage" in content:
                        schema_signals["has_faq"] = True
                    if "localbusiness" in content:
                        schema_signals["has_local_business"] = True
                        
                # Check description meta tags
                desc = soup.find("meta", attrs={"name": "description"})
                if desc and len(desc.get("content", "")) > 50:
                    schema_signals["meta_tags_quality"] = "Good"
                    
                # Check Open Graph tags
                if soup.find("meta", property=re.compile(r"^og:")):
                    schema_signals["has_og_tags"] = True
                    
                # Check H1 description quality
                h1s = soup.find_all("h1")
                if h1s:
                    h1_text = h1s[0].get_text().strip()
                    if len(h1_text) > 3:
                        schema_signals["h1_quality"] = "Good"
                        
                # Check Canonical link
                if soup.find("link", rel="canonical"):
                    schema_signals["has_canonical"] = True
    except Exception:
        pass
        
    return schema_signals

async def analyze_aeo_geo(url: str, business_name: str, category: str, city: str) -> dict:
    """
    Module 1: AEO and GEO (50% weight)
    Checks schema markup, calls Perplexity Sonar API, calls DataForSEO AI Search API.
    """
    cat_lower = category.lower().strip()
    term = cat_lower
    
    # Avoid word repetitions (e.g. "it services services")
    service_term = term
    if "service" not in cat_lower:
        service_term = f"{term} services"
        
    agency_term = term
    if "agency" not in cat_lower and "agencies" not in cat_lower and "company" not in cat_lower and "firm" not in cat_lower:
        agency_term = f"{term} agencies"

    queries = [
        f"best {term} in {city}",
        f"top rated {term} near {city}",
        f"who are the best {term} in {city}",
        f"leading {agency_term} in {city}",
        f"highly recommended {service_term} {city}"
    ]
    
    # Run all checks concurrently
    schema_task = asyncio.create_task(check_schema(url))
    perplex_task = asyncio.create_task(check_perplexity(queries, business_name, city))
    dataforseo_task = asyncio.create_task(check_dataforseo_ai_overview(queries, business_name))
    
    schema_signals, perplexity_res, google_ai_overview_appearances = await asyncio.gather(
        schema_task, perplex_task, dataforseo_task
    )
    perplexity_appearances, competitor_names_appearing_instead = perplexity_res
    
    # Calculate scores based on weights across all 7 signals
    total_signals = len(schema_signals)
    schema_score = sum(1 for v in schema_signals.values() if v is True or v == "Good") / total_signals * 100
    
    aeo_score = int((perplexity_appearances / len(queries)) * 100)
    geo_score = int((google_ai_overview_appearances / len(queries)) * 100)
    
    # If the business appeared in Google AI Overviews (GEO) but not Perplexity, grant fractional AEO score credit
    if aeo_score == 0 and google_ai_overview_appearances > 0:
        aeo_score = int((google_ai_overview_appearances / (2 * len(queries))) * 100)
        
    combined_score = int((schema_score * 0.4) + (aeo_score * 0.3) + (geo_score * 0.3))
    
    return {
        "schema_score": int(schema_score),
        "aeo_score": aeo_score,
        "geo_score": geo_score,
        "combined_score": combined_score,
        "schema_signals": schema_signals,
        "perplexity_appearances": perplexity_appearances,
        "google_ai_overview_appearances": google_ai_overview_appearances,
        "competitor_names_appearing_instead": competitor_names_appearing_instead,
        "queries_tested": queries
    }
