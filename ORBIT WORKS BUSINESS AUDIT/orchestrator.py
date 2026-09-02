import asyncio
import os
import httpx
from bs4 import BeautifulSoup
from groq import AsyncGroq
from typing import Dict, Any
import urllib.parse

from modules.module1_aeo_geo import analyze_aeo_geo
from modules.module2_website_health import analyze_website_health
from modules.module3_seo import analyze_seo
from modules.module4_reputation import analyze_reputation
from modules.module5_competitors import analyze_competitors
from modules.module6_social import analyze_social

async def detect_category(url: str, fallback: str) -> str:
    """Helper to auto-detect business category from website meta tags using Groq and DataForSEO fallback."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return fallback
        
    title = ""
    desc_text = ""
    
    # 1. Try crawling with standard httpx
    try:
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
            resp = await client.get(url, headers=headers, follow_redirects=True)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                title = soup.title.string if soup.title else ""
                desc = soup.find("meta", attrs={"name": "description"})
                desc_text = desc["content"] if desc else ""
    except Exception as e:
        print(f"Category direct scrape failed: {e}")
        
    # 2. If blocked by Cloudflare or both title and description are empty, try DataForSEO On-Page API
    is_blocked = "checking your browser" in title.lower() or "cloudflare" in title.lower()
    has_no_metadata = not title.strip() and not desc_text.strip()
    
    if is_blocked or has_no_metadata:
        try:
            print("Direct scrape blocked or empty metadata. Using DataForSEO On-Page API...")
            from dataforseo_client import dataforseo_post
            payload = [{"url": url}]
            resp = await dataforseo_post("on_page/instant_pages", payload)
            if resp.get("tasks") and resp["tasks"][0].get("result") and resp["tasks"][0]["result"][0].get("items"):
                item = resp["tasks"][0]["result"][0]["items"][0]
                meta = item.get("meta", {})
                title = meta.get("title") or title
                desc_text = meta.get("description") or desc_text
        except Exception as e:
            print(f"Category DataForSEO scrape failed: {e}")
            
    # 3. If we got the metadata, run LLM classification
    if title or desc_text:
        try:
            content_snippet = f"Title: {title}\nDescription: {desc_text}"
            groq_client = AsyncGroq(api_key=api_key)
            prompt = f"Based on this website's title and description, what is the primary business category/industry? Answer in 1-3 words only (e.g. 'Software Development', 'Dental Clinic', 'Digital Marketing').\n\n{content_snippet}"
            
            chat_completion = await groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="openai/gpt-oss-120b",
                temperature=0.0
            )
            detected = chat_completion.choices[0].message.content.strip().strip('"').strip("'")
            if len(detected.split()) <= 4:
                return detected.lower()
        except Exception as e:
            print(f"Category Groq classification failed: {e}")
            
    return fallback

async def run_audit_orchestrator(business_name: str, url: str, city: str, country: str, category: str) -> Dict[str, Any]:
    """
    Layer 4: Master Orchestrator
    Runs all 6 modules simultaneously using asyncio.gather().
    """
    
    # Normalize category to check if it matches a default
    category_check = (category or "").lower().strip().replace("-", " ")
    if not category or category_check in ["auto detect", "digital marketing", "business"]:
        print(f"Auto-detecting category for {url}...")
        detected_category = await detect_category(url, "business")
        if not detected_category or detected_category == "auto-detect":
            print("Detection failed. Falling back to category: 'business'")
            category = "business"
        else:
            print(f"Detected Category: {detected_category}")
            category = detected_category
    else:
        print(f"Using provided category: {category}")
    
    
    # Layer 2: Parallel Collection
    target_domain = urllib.parse.urlparse(url).netloc or url
    if target_domain.lower().startswith("www."):
        target_domain = target_domain[4:]
    target_domain = target_domain.lower().strip().rstrip("/")

    results = await asyncio.gather(
        analyze_aeo_geo(url, business_name, category, city),
        analyze_website_health(url),
        analyze_seo(url),
        analyze_reputation(business_name, city, country, url=url),
        analyze_competitors(category, city, target_domain=target_domain, business_name=business_name),
        analyze_social(url, business_name, city, category=category)
    )
    
    aeo_geo_data = results[0]
    website_health_data = results[1]
    seo_data = results[2]
    reputation_data = results[3]
    competitors_data_raw = results[4]
    social_data = results[5]

    # Calculate competitor scores based on real SEO data
    business_domain_authority = seo_data.get("domain_authority", 0)
    business_traffic = seo_data.get("organic_traffic_estimate", 0)
    business_backlinks = seo_data.get("backlink_count", 0)
    
    # Calculate median to avoid outlier skew (traffic and backlinks vary by orders of magnitude)
    def calculate_median(values):
        if not values:
            return 0
        sorted_vals = sorted(values)
        n = len(sorted_vals)
        if n % 2 == 1:
            return sorted_vals[n // 2]
        else:
            return (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2.0
            
    comp_metrics = competitors_data_raw.get("competitor_metrics", {})
    da_list = [mets.get("domain_authority", 0) for mets in comp_metrics.values()]
    traffic_list = [mets.get("traffic", 0) for mets in comp_metrics.values()]
    bls_list = [mets.get("backlinks", 0) for mets in comp_metrics.values()]
    
    avg_da = round(calculate_median(da_list)) if da_list else 30
    avg_traffic = round(calculate_median(traffic_list)) if traffic_list else 0
    avg_bls = round(calculate_median(bls_list)) if bls_list else 0
    
    where_ahead = []
    where_behind = []
    
    # Overwrite the target business's metrics in the competitor dict if they exist (with domain normalization)
    def normalize_dom(d):
        d = d.lower().strip()
        if d.startswith("www."):
            d = d[4:]
        return d.rstrip("/")

    target_domain = normalize_dom(urllib.parse.urlparse(url).netloc or url)
    
    normalized_comp_metrics = {}
    for comp, mets in comp_metrics.items():
        norm_comp = normalize_dom(comp)
        normalized_comp_metrics[norm_comp] = mets

    if target_domain in normalized_comp_metrics:
        normalized_comp_metrics[target_domain]["domain_authority"] = business_domain_authority
        normalized_comp_metrics[target_domain]["traffic"] = business_traffic
        normalized_comp_metrics[target_domain]["backlinks"] = business_backlinks
        
    comp_metrics = normalized_comp_metrics
        
    for comp, mets in comp_metrics.items():
        wins = 0
        if business_domain_authority >= mets["domain_authority"]: wins += 1
        if business_traffic >= mets["traffic"]: wins += 1
        if business_backlinks >= mets["backlinks"]: wins += 1
        
        if wins >= 2:
            where_ahead.append(comp)
        else:
            where_behind.append(comp)
            
    # Blended scoring formula based on DA (40%), Traffic (30%), and Backlinks (30%)
    def calculate_sub_score(business_val, avg_val):
        if avg_val == 0:
            return 100 if business_val > 0 else 50
        ratio = business_val / avg_val
        if ratio >= 1.0:
            return int(75 + min((ratio - 1.0) * 25, 25))
        else:
            return int(ratio * 75)

    s_da = calculate_sub_score(business_domain_authority, avg_da)
    s_traffic = calculate_sub_score(business_traffic, avg_traffic)
    s_bls = calculate_sub_score(business_backlinks, avg_bls)
    
    competitor_score = round(0.40 * s_da + 0.30 * s_traffic + 0.30 * s_bls)
    
    competitors_data = {
        "competitor_score": competitor_score,
        "competitor_names": list(comp_metrics.keys()),
        "competitor_metrics": comp_metrics,
        "metrics_comparison": {
            "average_domain_authority": avg_da,
            "business_domain_authority": business_domain_authority,
            "average_traffic": avg_traffic,
            "business_traffic": business_traffic,
            "average_backlinks": avg_bls,
            "business_backlinks": business_backlinks
        },
        "where_ahead": where_ahead,
        "where_behind": where_behind,
        "data_source": competitors_data_raw.get("data_source", "fallback")
    }

    # Score weighting: AEO/GEO 50%, remaining 5 are 10% each
    overall_score = (
        (aeo_geo_data.get("combined_score", 0) * 0.50) +
        (website_health_data.get("website_score", 0) * 0.10) +
        (seo_data.get("seo_score", 0) * 0.10) +
        (reputation_data.get("reputation_score", 0) * 0.10) +
        (competitors_data.get("competitor_score", 0) * 0.10) +
        (social_data.get("social_score", 0) * 0.10)
    )
    
    return {
        "business_name": business_name,
        "website_url": url,
        "location": f"{city}, {country}",
        "overall_score": round(overall_score),
        "module1_aeo_geo": aeo_geo_data,
        "module2_website_health": website_health_data,
        "module3_seo": seo_data,
        "module4_reputation": reputation_data,
        "module5_competitors": competitors_data,
        "module6_social": social_data,
    }
