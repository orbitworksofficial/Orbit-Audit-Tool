import asyncio
import argparse
import sys
import os
import json
from dotenv import load_dotenv

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

# Load env from current directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from api import _do_full_audit_async
from supabase_client import save_audit_report
from pdf_report import generate_pdf

async def run_manual_audit(url: str, business_name: str, city: str, country: str, category: str, email: str):
    if not url.startswith("http"):
        url = "https://" + url
        
    lead_data = {
        "full_name": f"{business_name} Owner",
        "email": email,
        "url": url,
        "business_name": business_name,
        "category": category,
        "city": city,
        "country": country,
        "whatsapp": ""
    }
    
    print("\n" + "="*80)
    print(f"RUNNING MANUAL AUDIT FOR: {business_name}")
    print(f"URL: {url} | City: {city} | Country: {country} | Category: {category}")
    print("="*80)
    print("Please wait, executing all modules (this takes 30-45 seconds due to live PageSpeed scans)...")
    
    try:
        # Run orchestrator and AI analysis
        result, ai_analysis = await _do_full_audit_async(
            url,
            lead_data["full_name"],
            business_name,
            city,
            country,
            category
        )
        
        # Save to Supabase
        print("\nSaving results to Supabase...")
        saved_row = await save_audit_report(lead_data, result, ai_analysis)
        row_id = saved_row.get('id') if saved_row else 'None'
        print(f"Saved successfully! Supabase Row ID: {row_id}")
        
        # Generate the PDF report
        safe_name = business_name.replace(" ", "_")
        pdf_path = os.path.join(os.path.dirname(__file__), f"report_{safe_name}.pdf")
        print(f"Generating PDF report at: {pdf_path} ...")
        await generate_pdf(result, pdf_path, ai_analysis)
        print("PDF generated successfully!")
        
        # Construct the exact structured JSON mapping the frontend contract
        output_json = {
            "id": row_id,
            "business_name": business_name,
            "website_url": url,
            "city": city,
            "country": country,
            "overall_score": result.get('overall_score', 0),
            "scores": {
                "aeo_geo_score": result.get("module1_aeo_geo", {}).get("combined_score", 0),
                "website_health_score": result.get("module2_website_health", {}).get("website_score", 0),
                "seo_score": result.get("module3_seo", {}).get("seo_score", 0),
                "reputation_score": result.get("module4_reputation", {}).get("reputation_score", 0),
                "competitor_score": result.get("module5_competitors", {}).get("competitor_score", 0),
                "social_score": result.get("module6_social", {}).get("social_score", 0)
            },
            "ai_insights": ai_analysis.get("deep_analysis", {}),
            "raw_module_data": result
        }
        
        print("\n" + "="*80)
        print("STRUCTURED JSON OUTPUT (FOR BENTO GRID VISUAL LAYER CONTRACT)")
        print("="*80)
        print(json.dumps(output_json, indent=2))
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n[ERROR] Audit failed: {e}")
        import traceback
        traceback.print_exc()

def main():
    parser = argparse.ArgumentParser(description="AI Business Audit Tool CLI Test Utility")
    parser.add_argument("--url", required=True, help="Website URL to audit (e.g. https://arbisoft.com/)")
    parser.add_argument("--name", required=True, help="Business name (e.g. Arbisoft)")
    parser.add_argument("--city", default="Lahore", help="City location (default: Lahore)")
    parser.add_argument("--country", default="PK", help="2-letter Country code or Name (default: PK)")
    parser.add_argument("--category", default="auto-detect", help="Business Category or 'auto-detect' (default: auto-detect)")
    parser.add_argument("--email", default="manual-test@example.com", help="Email for the lead (default: manual-test@example.com)")
    
    args = parser.parse_args()
    
    asyncio.run(run_manual_audit(
        url=args.url,
        business_name=args.name,
        city=args.city,
        country=args.country,
        category=args.category,
        email=args.email
    ))

if __name__ == "__main__":
    main()
