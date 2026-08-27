import asyncio
import os
import httpx

async def analyze_website_health(url: str) -> dict:
    """
    Module 2: Website Health (10% weight)
    Calls Google PageSpeed Insights API with the website URL.
    Benchmark: Industry average website performance score for B2B services is 68 on mobile.
    """
    api_key = os.getenv("GOOGLE_PAGESPEED_API_KEY")
    if not api_key:
        # Fallback to mock if key is unexpectedly missing
        await asyncio.sleep(2.0)
        return _mock_response()

    import urllib.parse
    encoded_url = urllib.parse.quote(url, safe='')
    api_url_mobile = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={encoded_url}&key={api_key}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo"
    api_url_desktop = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={encoded_url}&key={api_key}&strategy=desktop&category=performance"
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            mobile_task = asyncio.create_task(client.get(api_url_mobile))
            desktop_task = asyncio.create_task(client.get(api_url_desktop))
            
            mobile_response, desktop_response = await asyncio.gather(mobile_task, desktop_task)
            mobile_response.raise_for_status()
            desktop_response.raise_for_status()
            
            data = mobile_response.json()
            desktop_data = desktop_response.json()
            
            lighthouse = data.get("lighthouseResult", {})
            categories = lighthouse.get("categories", {})
            audits = lighthouse.get("audits", {})
            
            # Scores (0-1) converted to 0-100, safely handling null/None values
            perf_val = categories.get("performance", {}).get("score")
            perf_score = int(perf_val * 100) if perf_val is not None else 0
            
            acc_val = categories.get("accessibility", {}).get("score")
            acc_score = int(acc_val * 100) if acc_val is not None else 0
            
            bp_val = categories.get("best-practices", {}).get("score")
            bp_score = int(bp_val * 100) if bp_val is not None else 0
            
            seo_val = categories.get("seo", {}).get("score")
            seo_score = int(seo_val * 100) if seo_val is not None else 0
            
            # Core Web Vitals (from lab data / audits)
            lcp = audits.get("largest-contentful-paint", {}).get("displayValue", "N/A")
            cls = audits.get("cumulative-layout-shift", {}).get("displayValue", "N/A")
            # Note: Using max-potential-fid (a lab metric) as a stand-in for real-user FID since real-user field data is not always available.
            fid = audits.get("max-potential-fid", {}).get("displayValue", "N/A") 
            
            # Find top issues (audits with low score and high weight)
            issues = []
            for audit_id, audit in audits.items():
                if audit.get("score") is not None and audit.get("score") < 0.9 and audit.get("details", {}).get("type") == "opportunity":
                    issues.append((audit.get("title", ""), audit.get("score", 1.0)))
            
            # Sort by score ascending (lowest score = biggest issue)
            issues.sort(key=lambda x: x[1])
            top_3_issues = [issue[0] for issue in issues[:3]]
            
            if not top_3_issues:
                top_3_issues = ["No major performance issues detected."]
                
            # Average score logic based on available categories
            website_score = int((perf_score + acc_score + bp_score + seo_score) / 4)
            
            # Incorporate 68 mobile benchmark
            if perf_score < 68:
                website_score = max(0, website_score - 10)  # Penalize overall score
                top_3_issues.insert(0, f"Mobile performance is {perf_score}, below the B2B average of 68.")
                top_3_issues = top_3_issues[:3]
                
            desktop_lighthouse = desktop_data.get("lighthouseResult", {})
            desktop_perf_val = desktop_lighthouse.get("categories", {}).get("performance", {}).get("score")
            desktop_perf = int(desktop_perf_val * 100) if desktop_perf_val is not None else 0

            return {
                "website_score": website_score,
                "performance": perf_score,
                "accessibility": acc_score,
                "best_practices": bp_score,
                "seo": seo_score,
                "lcp": lcp,
                "fid": fid,
                "cls": cls,
                "mobile_score": perf_score,
                "desktop_score": desktop_perf,
                "top_3_issues": top_3_issues,
                "data_source": "live"
            }

    except Exception as e:
        print(f"PageSpeed API Error: {repr(e)}")
        return _mock_response()

def _mock_response() -> dict:
    return {
        "website_score": 0,
        "performance": 0,
        "accessibility": 0,
        "best_practices": 0,
        "seo": 0,
        "lcp": "N/A",
        "fid": "N/A",
        "cls": "N/A",
        "mobile_score": 0,
        "desktop_score": 0,
        "top_3_issues": [
            "Data fetch failed: Google PageSpeed API blocked the request or timed out."
        ],
        "data_source": "fallback"
    }
