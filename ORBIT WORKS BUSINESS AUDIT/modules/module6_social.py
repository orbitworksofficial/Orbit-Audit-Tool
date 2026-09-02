import asyncio
import httpx
from bs4 import BeautifulSoup
import urllib.parse
import os
import json
from dataforseo_client import dataforseo_post

async def discover_social_profiles_via_perplexity(business_name: str, url: str, city: str) -> dict:
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        return {}
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    q = (f"Search the web to find the official social media profile URLs (LinkedIn, Facebook, Instagram, Twitter/X, YouTube) "
         f"for the business '{business_name}' with website '{url}' located in '{city}'. "
         f"Ignore similarly named businesses in other cities or industries. "
         f"Return a JSON object with keys: LinkedIn, Facebook, Instagram, Twitter/X, YouTube. "
         f"The values should be the profile URLs, or null if not found.")
         
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
                return json.loads(answer)
    except Exception as e:
        print(f"Perplexity Social Discovery Error: {repr(e)}")
    return {}

async def check_perplexity_social_activity(business_name: str, url: str, profile_urls: dict, business_category: str) -> dict:
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        return {"active_in_last_90_days": False, "recent_post_summary": "API Key missing."}
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    urls_str = ", ".join([f"{k}: {v}" for k, v in profile_urls.items()])
    category_desc = business_category or "IT services & AI automation"
    
    # We explicitly instruct Perplexity to focus on the target business domain and ignore space/aerospace topics
    platforms_list = list(profile_urls.keys())
    q = (f"Does the business '{business_name}' ({url}) have active social media profiles? "
         f"The business is in the '{category_desc}' sector. "
         f"Here are the profile URLs found on their website: {urls_str}. "
         f"Have they posted anything on these specific profiles in the last 90 days? "
         f"CRITICAL: Do NOT confuse this business with any other similarly-named but different company (e.g. do NOT return activity for a space, satellite, or aerospace company named '{business_name}'). "
         f"If the profiles or posts are about space, satellites, or aerospace engineering, treat them as belonging to a different company, and return them as inactive for this '{category_desc}' business. "
         f"Return a JSON object with: 'active_platforms' (a list of platform names from {platforms_list} that have had posts in the last 90 days), and 'recent_post_summary' (string summarizing what they posted and when, or explaining that no posts were found for this '{category_desc}' business).")
    
    payload = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant. Output exactly JSON and nothing else."},
            {"role": "user", "content": q}
        ]
    }
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post("https://api.perplexity.ai/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                answer = resp.json()["choices"][0]["message"]["content"]
                # Strip markdown code blocks if present
                answer = answer.strip().removeprefix("```json").removesuffix("```").strip()
                return json.loads(answer)
    except Exception as e:
        print(f"Perplexity Social Error: {repr(e)}")
        
    return {"active_platforms": [], "recent_post_summary": "Failed to check activity."}

async def analyze_social(url: str, business_name: str, city: str, category: str = None) -> dict:
    """
    Module 6: Social Media Presence (10% weight)
    Custom scraper checks the business website for links to social profiles.
    """
    platforms_found = set()
    profile_urls = {}
    all_platforms = {
        "LinkedIn": ["linkedin.com"],
        "Facebook": ["facebook.com"],
        "Instagram": ["instagram.com"],
        "Twitter/X": ["twitter.com", "x.com"],
        "YouTube": ["youtube.com"]
    }
    
    try:
        async with httpx.AsyncClient(timeout=45.0, verify=False) as client:
            # Add a user agent to avoid basic blocks
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
            response = await client.get(url, headers=headers, follow_redirects=True)
            
            if response.status_code == 200:
                # 1. Parse standard <a> tags
                soup = BeautifulSoup(response.text, "html.parser")
                for a_tag in soup.find_all("a", href=True):
                    href = a_tag["href"].strip()
                    href_lower = href.lower()
                    
                    # Skip sharing links
                    if "share" in href_lower or "tweet?" in href_lower:
                        continue
                        
                    for platform_name, domains in all_platforms.items():
                        if any(domain in href_lower for domain in domains):
                            platforms_found.add(platform_name)
                            if platform_name not in profile_urls:
                                if href.startswith("//"):
                                    href = "https:" + href
                                profile_urls[platform_name] = href
                            
                # 2. Parse raw HTML body
                html_lower = response.text.lower()
                for platform_name, domains in all_platforms.items():
                    for domain in domains:
                        if f"{domain}/" in html_lower or f"{domain}\"" in html_lower or f"{domain}'" in html_lower:
                            platforms_found.add(platform_name)
    except Exception as e:
        print(f"Social Scraper Error for {url}: {repr(e)}")

    # Fallback 1: If direct homepage crawling failed, ask Perplexity to discover the profiles via web search
    if not platforms_found:
        print(f"Direct crawl failed or returned empty. Querying Perplexity to discover social profiles for {business_name}...")
        discovered = await discover_social_profiles_via_perplexity(business_name, url, city)
        if discovered:
            for platform, p_url in discovered.items():
                if p_url and platform in all_platforms:
                    if any(domain in p_url.lower() for domain in all_platforms[platform]):
                        platforms_found.add(platform)
                        profile_urls[platform] = p_url

    # Cross-check with DataForSEO Business Data
    try:
        payload = [{"keyword": business_name, "location_name": city, "language_code": "en"}]
        response = await dataforseo_post("business_data/google/my_business_info/live", payload)
        tasks = response.get("tasks", [])
        if tasks and tasks[0].get("result"):
            items = tasks[0]["result"][0].get("items", [])
            if items:
                profile = items[0]
                social_profiles = profile.get("social_profiles", [])
                for sp in social_profiles:
                    sp_url = sp.strip()
                    for platform_name, domains in all_platforms.items():
                        if any(domain in sp_url.lower() for domain in domains):
                            platforms_found.add(platform_name)
                            if platform_name not in profile_urls:
                                profile_urls[platform_name] = sp_url
    except Exception as e:
        print(f"DataForSEO Social Cross-check Error: {repr(e)}")
        
    platforms_found = list(platforms_found)
    platforms_missing = [p for p in all_platforms.keys() if p not in platforms_found]
    
    # 90-day activity detection via Perplexity (passing the category parameter)
    activity_data = await check_perplexity_social_activity(business_name, url, profile_urls, category)
    active_platforms = activity_data.get("active_platforms") or []
    recent_summary = activity_data.get("recent_post_summary", "")
    
    # Calculate score based on found platforms:
    # 50% Presence (10 pts per profile), 50% Activity (10 pts per active profile)
    if not platforms_found:
        social_score = 0
        activity_level = "No social media links detected on the website."
    else:
        if recent_summary in ["Failed to check activity.", "API Key missing.", ""]:
            # Fall back to presence-only score (20 points per platform) if check is unavailable
            social_score = len(platforms_found) * 20
            activity_level = f"Found {len(platforms_found)} social profiles. Social media activity check is temporarily unavailable."
        else:
            # 10 pts per profile found (max 50)
            presence_score = len(platforms_found) * 10
            # 10 pts per profile active in 90 days (max 50)
            # Match active_platforms back to platforms_found using loose case-insensitive comparison
            active_count = 0
            for p in platforms_found:
                if any(ap.lower() in p.lower() or p.lower() in ap.lower() for ap in active_platforms):
                    active_count += 1
            
            activity_score = active_count * 10
            social_score = min(100, presence_score + activity_score)
            activity_level = f"Found {len(platforms_found)} social profiles ({active_count} active in last 90 days). {recent_summary}"
        
    return {
        "social_score": social_score,
        "platforms_found": platforms_found,
        "platforms_missing": platforms_missing,
        "activity_level": activity_level,
        "data_source": "live"
    }
