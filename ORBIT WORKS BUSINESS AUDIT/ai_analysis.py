import json
import os
import asyncio
from groq import AsyncGroq
from dotenv import load_dotenv

# Load env from project root and parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

async def generate_ai_analysis(combined_data: dict) -> dict:
    """
    Layer 5: AI Analysis
    Sends the combined data package to Anthropic Claude (or falls back to Groq) for deep analysis.
    """
    prompt = f"""You are an expert digital marketing analyst. Analyze the following business audit data and return a JSON object with this exact structure:
{{
    "section_insights": {{
        "aeo_geo": "insight here",
        "website_health": "insight here",
        "seo": "insight here",
        "reputation": "insight here",
        "competitors": "insight here",
        "social": "insight here"
    }},
    "critical_gaps": ["gap 1", "gap 2", "gap 3"],
    "overall_summary": "overall summary text"
}}

Keep the insights concise, actionable, and strictly logical based on the provided data.
CRITICAL: In your generated text (especially 'overall_summary' and 'section_insights'), you MUST reference the exact numeric values from the provided JSON data. Do NOT round, estimate, or use numbers that differ from the JSON data. For example:
- If overall_score is 29, you must write '29 out of 100' (do NOT write 30).
- If domain_authority under module3_seo is 1, you must write 'domain authority of 1' (do NOT write 0).
- If average competitor DA is 8, you must write 'competitor average of 8' (do NOT write 2 or 22).

You MUST follow these explicit rules when evaluating and comparing metrics in your insights:
1. For "aeo_geo": The business's perplexity visibility rate is "aeo_score" (under module1_aeo_geo). Compare it to the industry average AEO visibility rate of 15%. State the actual AEO score (e.g. 0% or 20%). Do not hallucinate fields.
2. For "website_health": Evaluate "mobile_score" (under module2_website_health) against the industry benchmark of 68. 
   - If the mobile_score is less than 68, state that it is below the benchmark of 68.
   - If the mobile_score is equal to or greater than 68, state that it meets or exceeds the benchmark of 68.
   - Never write contradictory statements (e.g. do not say a score of 81 is below the benchmark of 68).
3. For "seo": Compare "domain_authority" (under module3_seo) against the industry benchmark of 35. (Note: the domain_authority is normalized to a standard 0-100 scale).
4. For "reputation": Compare the Google "star_rating" (under module4_reputation) to the industry average rating of 4.2.
5. For "competitors": Compare the business's "domain_authority" to the competitors' "average_domain_authority" (under module5_competitors). State the business's score relative to the competitor benchmark.
6. For "social": Summarize the found profiles (under module6_social) and their activity level.

Audit Data: {json.dumps(combined_data)}

"""

    deep_analysis = None
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    
    # Try Anthropic Claude first
    if anthropic_key:
        try:
            from anthropic import AsyncAnthropic
            print("Connecting to Anthropic API...")
            client = AsyncAnthropic(api_key=anthropic_key)
            
            try:
                print("Trying model 'claude-sonnet-4-6'...")
                response = await client.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=4000,
                    temperature=0.5,
                    system="You are an expert digital marketing analyst. Always respond in raw JSON format matching the requested schema.",
                    messages=[{"role": "user", "content": prompt}]
                )
            except Exception as e0:
                print(f"Model 'claude-sonnet-4-6' failed: {e0}. Trying 'claude-3-5-sonnet-latest'...")
                try:
                    response = await client.messages.create(
                        model="claude-3-5-sonnet-latest",
                        max_tokens=4000,
                        temperature=0.5,
                        system="You are an expert digital marketing analyst. Always respond in raw JSON format matching the requested schema.",
                        messages=[{"role": "user", "content": prompt}]
                    )
                except Exception as e1:
                    print(f"Model 'claude-3-5-sonnet-latest' failed: {e1}. Trying 'claude-3-5-sonnet-20240620'...")
                    response = await client.messages.create(
                        model="claude-3-5-sonnet-20240620",
                        max_tokens=4000,
                        temperature=0.5,
                        system="You are an expert digital marketing analyst. Always respond in raw JSON format matching the requested schema.",
                        messages=[{"role": "user", "content": prompt}]
                    )
                
            text = response.content[0].text.strip()
            import re
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            if json_match:
                text = json_match.group(0)
            deep_analysis = json.loads(text)
            print("Successfully generated deep analysis using Anthropic Claude.")
        except Exception as e:
            print(f"Anthropic Claude API failed: {e}. Falling back to Groq...")

    # Fallback to Groq
    if not deep_analysis and groq_key:
        try:
            print("Connecting to Groq API...")
            client = AsyncGroq(api_key=groq_key)
            chat_completion = await client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="openai/gpt-oss-120b",
                response_format={"type": "json_object"},
                temperature=0.5
            )
            deep_analysis = json.loads(chat_completion.choices[0].message.content)
            print("Successfully generated deep analysis using Groq fallback.")
        except Exception as e:
            print(f"Groq API fallback failed: {e}")

    # Final mock fallback
    if not deep_analysis:
        print("Warning: Both Anthropic and Groq failed. Using static mock analysis.")
        deep_analysis = _mock_claude_response(combined_data)["deep_analysis"]

    # Short loading commentary (uses Groq or defaults)
    groq_commentary = await generate_groq_commentary(combined_data)

    return {
        "deep_analysis": deep_analysis,
        "loading_commentary": groq_commentary
    }

def _mock_claude_response(combined_data: dict) -> dict:
    da = combined_data.get("module3_seo", {}).get("domain_authority", 0)
    health = combined_data.get("module2_website_health", {}).get("website_score", 0)
    rep = combined_data.get("module4_reputation", {}).get("reputation_score", 0)
    aeo = combined_data.get("module1_aeo_geo", {}).get("combined_score", 0)
    
    missing_platforms = combined_data.get("module6_social", {}).get("platforms_missing", [])
    missing_str = f"missing {', '.join(missing_platforms)}" if missing_platforms else "no major social gaps"
    
    return {
        "deep_analysis": {
            "section_insights": {
                "aeo_geo": f"Your business has an AEO/GEO combined score of {aeo}%. More schema signals and optimization are needed to improve search engine visibility.",
                "website_health": f"Website health score is at {health}/100. Optimizing JavaScript and CSS assets can help improve performance and score.",
                "seo": f"With a domain authority of {da}, your search engine profile is being evaluated. Building high-quality backlinks is a priority.",
                "reputation": f"Your reputation score is {rep}/100 based on Google Business Profile completeness and ratings.",
                "competitors": "You are being compared with top competitors in your local category. Focus on closing authority gaps.",
                "social": f"Active social media profiles were scanned. Status: {missing_str}."
            },
            "critical_gaps": [
                f"Domain authority of {da} is below target benchmarks.",
                f"Website health score is at {health}/100, which has room for optimization.",
                "Schema signals (FAQ, Organization) can be strengthened for AEO."
            ],
            "overall_summary": f"Your business has a digital presence score with key optimization opportunities in SEO (DA: {da}), Website Performance ({health}/100), and AEO."
        }
    }

async def generate_groq_commentary(combined_data: dict) -> dict:
    """
    Generates shorter, faster commentary for the basic section labels shown on screen during loading.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"status": "Groq API key missing"}
        
    client = AsyncGroq(api_key=api_key)
    
    # We can ask Groq to generate a 1-sentence loading message based on the business name.
    # To keep it fast, we will just use a mock for now or a very simple prompt.
    prompt = f"Write 6 short (5 words max) loading messages for an AI audit of a business named {combined_data['business_name']} for these sections: AEO, Website, SEO, Reputation, Competitors, Social. Return JSON with keys: aeo, website, seo, reputation, competitors, social."
    
    try:
        chat_completion = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="openai/gpt-oss-120b",
            response_format={"type": "json_object"},
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq API error: {e}")
        return {
            "aeo": "Checking AI visibility...",
            "website": "Analysing website performance...",
            "seo": "Scanning SEO signals...",
            "reputation": "Reading Google Business Profile...",
            "competitors": "Mapping competitor landscape...",
            "social": "Measuring social media presence..."
        }
