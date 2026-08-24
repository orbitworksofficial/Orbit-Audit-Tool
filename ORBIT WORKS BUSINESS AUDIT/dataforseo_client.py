import os
import httpx
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def get_dataforseo_auth():
    login = os.getenv("DATAFORSEO_LOGIN")
    password = os.getenv("DATAFORSEO_PASSWORD")
    if not login or not password:
        return None
    return (login, password)

async def dataforseo_post(endpoint: str, payload: List[Dict]) -> dict:
    auth = get_dataforseo_auth()
    if not auth:
        raise Exception("DataForSEO credentials missing")
        
    url = f"https://api.dataforseo.com/v3/{endpoint}"
    async with httpx.AsyncClient(auth=auth, timeout=45.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        return response.json()
