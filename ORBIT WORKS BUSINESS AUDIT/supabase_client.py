import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        print("Warning: Supabase credentials not found. Mocking Supabase client.")
        return MockSupabaseClient()
    return create_client(url, key)

class MockSupabaseClient:
    def table(self, name: str):
        self.current_table = name
        return self
    
    def insert(self, data: dict):
        self.data_to_insert = data
        return self
        
    def execute(self):
        print(f"MOCK: Inserted record into {self.current_table}")
        return type('obj', (object,), {'data': [self.data_to_insert]})

async def save_audit_report(lead_data: dict, audit_data: dict, ai_analysis: dict) -> dict:
    """
    Layer 7: Storage
    Writes all data to Supabase immediately after analysis completes.
    """
    client = get_supabase_client()
    
    # Extract scores
    scores = {
        "aeo_geo_score": audit_data["module1_aeo_geo"].get("combined_score", 0),
        "website_health_score": audit_data["module2_website_health"].get("website_score", 0),
        "seo_score": audit_data["module3_seo"].get("seo_score", 0),
        "reputation_score": audit_data["module4_reputation"].get("reputation_score", 0),
        "competitor_score": audit_data["module5_competitors"].get("competitor_score", 0),
        "social_score": audit_data["module6_social"].get("social_score", 0),
        "overall_score": audit_data.get("overall_score", 0)
    }
    
    row = {
        "full_name": lead_data.get("full_name", ""),
        "email": lead_data.get("email", ""),
        "whatsapp": lead_data.get("whatsapp", ""),
        "business_name": audit_data.get("business_name", ""),
        "website_url": audit_data.get("website_url", ""),
        "city": lead_data.get("city", ""),
        "country": lead_data.get("country", ""),
        **scores,
        "ai_insights": ai_analysis.get("deep_analysis", {}),
        "raw_data": audit_data
    }
    
    import asyncio
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Wrap the synchronous Supabase execution in a thread to prevent event loop blocking
            response = await asyncio.to_thread(client.table("audit_reports").insert(row).execute)
            if response.data:
                return response.data[0]
            else:
                raise Exception("Empty response from Supabase")
        except Exception as e:
            print(f"Error saving to Supabase (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(1.5)
            else:
                return None
