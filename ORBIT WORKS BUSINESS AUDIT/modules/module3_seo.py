import asyncio
from dataforseo_client import dataforseo_post
import urllib.parse

async def analyze_seo(url: str) -> dict:
    """
    Module 3: SEO and Search Visibility (10% weight)
    Call DataForSEO On-Page API to crawl the website. Call DataForSEO Domain Overview API for domain authority, backlinks, and traffic estimate.
    Benchmark: For B2B service companies, healthy domain authority is 30 plus. Under 20 is weak. Under 10 is very poor.
    """
    domain = urllib.parse.urlparse(url).netloc
    if domain.startswith("www."):
        domain = domain[4:]
        
    payload = [{"target": domain}]
    
    try:
        async def fetch_bl():
            try:
                return await dataforseo_post("backlinks/summary/live", [{"target": domain}])
            except Exception as e:
                print(f"SEO backlinks call failed: {e}")
                return {}
                
        async def fetch_traffic():
            try:
                return await dataforseo_post("dataforseo_labs/google/domain_rank_overview/live", [{"target": domain, "location_code": 2840, "language_code": "en"}])
            except Exception as e:
                print(f"SEO traffic call failed: {e}")
                return {}
                
        async def fetch_kw():
            try:
                return await dataforseo_post("dataforseo_labs/google/ranked_keywords/live", [{"target": domain, "location_code": 2840, "language_code": "en", "limit": 3}])
            except Exception as e:
                print(f"SEO keywords call failed: {e}")
                return {}
                
        async def fetch_onpage():
            try:
                return await dataforseo_post("on_page/instant_pages", [{"url": url}])
            except Exception as e:
                print(f"SEO onpage call failed: {e}")
                return {}
        
        bl_response, traffic_response, kw_response, onpage_response = await asyncio.gather(
            fetch_bl(), fetch_traffic(), fetch_kw(), fetch_onpage()
        )
        
        domain_authority = 0
        organic_traffic = 0
        backlink_count = 0
        top_keywords = []
                
        # Parse Backlinks
        if bl_response.get("tasks") and bl_response["tasks"][0].get("result") and bl_response["tasks"][0]["result"][0]:
            res = bl_response["tasks"][0]["result"][0]
            backlink_count = res.get("backlinks", 0)
            # DataForSEO rank is on a 0-1000 scale. We divide by 10 to normalize to standard 0-100 scale.
            domain_authority = res.get("rank", 0) // 10
            if domain_authority == 0 and backlink_count > 0:
                import math
                # Compute a fractional authority log-scaled to backlinks to prevent low-end flat-zeroing
                domain_authority = min(5, round(math.log10(backlink_count + 1) * 2))
            
        # Parse Traffic
        if traffic_response.get("tasks") and traffic_response["tasks"][0].get("result") and traffic_response["tasks"][0]["result"][0]:
            items = traffic_response["tasks"][0]["result"][0].get("items") or []
            if items and items[0].get("metrics"):
                metrics = items[0]["metrics"].get("organic", {})
                organic_traffic = metrics.get("etv", 0)
            
        # Parse Keywords
        if kw_response.get("tasks") and kw_response["tasks"][0].get("result") and kw_response["tasks"][0]["result"][0]:
            items = kw_response["tasks"][0]["result"][0].get("items") or []
            for item in items:
                kw = item.get("keyword_data", {}).get("keyword")
                if kw:
                    top_keywords.append(kw)
        
        if not top_keywords:
            top_keywords = []
        seo_score = int(min((domain_authority / 30) * 100, 100))
        
        top_3_seo_gaps = []
        
        # Parse On-Page
        if onpage_response.get("tasks") and onpage_response["tasks"][0].get("result") and onpage_response["tasks"][0]["result"][0].get("items"):
            item = onpage_response["tasks"][0]["result"][0]["items"][0]
            meta = item.get("meta", {})
            if not meta.get("title"):
                top_3_seo_gaps.append("Homepage is missing a meta title tag.")
            if not meta.get("description"):
                top_3_seo_gaps.append("Homepage is missing a meta description.")
            if item.get("internal_links_count", 0) == 0:
                top_3_seo_gaps.append("No internal links found on the homepage.")
                
        if domain_authority < 30:
            top_3_seo_gaps.append(f"Domain authority is {domain_authority}, below the healthy benchmark of 30.")
        if backlink_count < 50:
            top_3_seo_gaps.append(f"Low backlink count ({backlink_count}) limits search visibility.")
        if organic_traffic < 500:
            top_3_seo_gaps.append(f"Organic traffic estimate is low ({organic_traffic}/mo).")
            
        if not top_3_seo_gaps:
            top_3_seo_gaps = ["No major SEO gaps detected."]
            
        return {
            "seo_score": seo_score,
            "domain_authority": domain_authority,
            "organic_traffic_estimate": organic_traffic,
            "backlink_count": backlink_count,
            "top_keywords": top_keywords,
            "top_3_seo_gaps": top_3_seo_gaps[:3],
            "data_source": "live"
        }
        
    except Exception as e:
        print(f"SEO DataForSEO Error: {repr(e)}")
        return _mock_response()

def _mock_response() -> dict:
    return {
        "seo_score": 0,
        "domain_authority": 0,
        "organic_traffic_estimate": 0,
        "backlink_count": 0,
        "top_keywords": [],
        "top_3_seo_gaps": [
            "Data fetch failed."
        ],
        "data_source": "fallback"
    }
