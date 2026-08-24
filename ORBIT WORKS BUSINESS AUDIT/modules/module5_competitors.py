import asyncio
import urllib.parse
import os
import json
import httpx
from dataforseo_client import dataforseo_post

async def get_perplexity_competitors(business_name: str, target_domain: str, business_category: str, city: str) -> list:
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        return []
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # We ask Perplexity for direct B2B/B2C competitors in the target location/industry
    q = (f"What are the top 5 direct business competitors (commercial companies, not directories, portals, or job sites) "
         f"of '{business_name}' ({target_domain}) that are in the '{business_category}' industry and operate in or near '{city}'? "
         f"Please return ONLY a JSON array of their official website domains (e.g. ['competitor1.com', 'competitor2.com']).")
    
    payload = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant. Output exactly JSON and nothing else."},
            {"role": "user", "content": q}
        ]
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post("https://api.perplexity.ai/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                answer = resp.json()["choices"][0]["message"]["content"]
                answer = answer.strip().removeprefix("```json").removesuffix("```").strip()
                domains = json.loads(answer)
                if isinstance(domains, list):
                    return [d.lower().strip() for d in domains if isinstance(d, str) and len(d) > 3]
    except Exception as e:
        print(f"Perplexity Competitor Discovery Error: {repr(e)}")
        
    return []

async def analyze_competitors(business_category: str, city: str, target_domain: str = None, business_name: str = None) -> dict:
    """
    Module 5: Competitor Snapshot
    Attempts to discover competitors via Perplexity first, falling back to DataForSEO SERP organic search.
    Return competitor metrics and average domain authority.
    """
    def is_valid_competitor(domain: str) -> bool:
        import re
        domain = domain.lower().strip()
        # Verify it matches a valid domain format structure
        if not re.match(r"^[a-z0-9.-]+\.[a-z]{2,5}$", domain):
            return False
        # Exclude government, edu, and non-profit orgs
        if ".edu" in domain or ".gov" in domain or ".org" in domain:
            return False
        # Exclude major directories, platforms, social media, databases, and job boards
        exclude_keywords = [
            "indeed", "upwork", "glassdoor", "clutch", "g2", "fiverr", "yelp", 
            "yellowpages", "tripadvisor", "facebook", "twitter", "instagram", "youtube", 
            "pinterest", "reddit", "medium", "github", "quora", "behance", "dribbble", 
            "crunchbase", "zoominfo", "rozee", "mustakbil", "linkedin", "wikipedia",
            "job", "career", "directory", "listing", "techbehemoths", "crossover",
            "designrush", "scribd", "bebee", "olx", "f6s", "themanifest", "tracxn",
            "gallup", "journal", "research", "association", "network", "portal",
            "forum", "database", "wiki", "classified", "startup", "dakhlay",
            "blog", "news", "press", "magazine", "ziprecruiter", "builtin",
            "wellfound", "angellist", "dice", "monster", "careerbuilder",
            "simplyhired", "lensa", "jooble", "salary", "payscale", "levels.fyi",
            "owler", "apollo", "pitchbook", "dealroom"
        ]
        for kw in exclude_keywords:
            if kw in domain:
                return False
        
        # Exclude target business itself
        if target_domain:
            td = target_domain.lower().replace("www.", "").strip()
            norm_domain = domain.replace("www.", "").strip()
            if td in norm_domain or norm_domain in td:
                return False
                
        return True

    competitors = []
    
    # 1. Primary discovery: Perplexity
    if business_name and target_domain:
        perplexity_domains = await get_perplexity_competitors(business_name, target_domain, business_category, city)
        for domain in perplexity_domains:
            if is_valid_competitor(domain) and domain not in competitors:
                competitors.append(domain)
                
    # 2. Secondary discovery (Fallback): DataForSEO SERP Organic Search
    if len(competitors) < 3:
        query = f"{business_category} in {city}"
        serp_payload = [{"keyword": query, "location_code": 2840, "language_code": "en", "depth": 30}]
        try:
            serp_response = await dataforseo_post("serp/google/organic/live/advanced", serp_payload)
            tasks = serp_response.get("tasks", [])
            if tasks and tasks[0].get("result") and tasks[0]["result"][0]:
                items = tasks[0]["result"][0].get("items") or []
                for item in items:
                    if item.get("type") == "organic" and item.get("domain"):
                        domain = item.get("domain")
                        if is_valid_competitor(domain) and domain not in competitors:
                            competitors.append(domain)
                    if len(competitors) >= 5:
                        break
        except Exception as e:
            print(f"Competitor DataForSEO SERP Fallback Error: {repr(e)}")

    # Trim to top 5
    competitors = competitors[:5]
    
    if not competitors:
        return _mock_response()
        
    # Helper to fetch individual competitor metrics in parallel (since DataForSEO live APIs do not support bulk arrays)
    async def fetch_competitor_data(comp: str) -> tuple[str, int, int, int]:
        da, bls, traffic = 0, 0, 0
        
        # 1. Backlinks summary call
        try:
            metrics_res = await dataforseo_post("backlinks/summary/live", [{"target": comp}])
            m_tasks = metrics_res.get("tasks", [])
            if m_tasks and m_tasks[0].get("result") and m_tasks[0]["result"][0]:
                res = m_tasks[0]["result"][0]
                # DataForSEO rank is on a 0-1000 scale. We divide by 10 to normalize to standard 0-100 scale.
                da = res.get("rank", 0) // 10
                bls = res.get("backlinks", 0)
                if da == 0 and bls > 0:
                    import math
                    da = min(5, round(math.log10(bls + 1) * 2))
        except Exception as e:
            print(f"Failed to fetch backlinks for competitor {comp}: {e}")
            
        # 2. Organic traffic call
        try:
            traffic_res = await dataforseo_post("dataforseo_labs/google/domain_rank_overview/live", [{"target": comp, "location_code": 2840, "language_code": "en"}])
            t_tasks = traffic_res.get("tasks", [])
            if t_tasks and t_tasks[0].get("result") and t_tasks[0]["result"][0]:
                items = t_tasks[0]["result"][0].get("items") or []
                if items and items[0].get("metrics"):
                    metrics = items[0]["metrics"].get("organic", {})
                    traffic = metrics.get("etv", 0)
        except Exception as e:
            print(f"Failed to fetch traffic for competitor {comp}: {e}")
            
        return comp, da, bls, traffic

    # Execute all fetches concurrently
    fetch_tasks = [fetch_competitor_data(comp) for comp in competitors]
    results = await asyncio.gather(*fetch_tasks)
    
    competitor_metrics = {}
    total_da = 0
    
    for comp, da, bls, traffic in results:
        total_da += da
        competitor_metrics[comp] = {
            "domain_authority": da,
            "traffic": traffic,
            "backlinks": bls
        }
    
    avg_da = total_da // len(competitor_metrics) if competitor_metrics else 35
    
    return {
        "competitor_names": list(competitor_metrics.keys()),
        "competitor_metrics": competitor_metrics,
        "average_domain_authority": avg_da,
        "data_source": "live"
    }

def _mock_response() -> dict:
    return {
        "competitor_names": [],
        "competitor_metrics": {},
        "average_domain_authority": 35,
        "data_source": "fallback"
    }
