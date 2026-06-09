import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("FIRECRAWL_API_KEY")
print(f"FIRECRAWL_API_KEY: {api_key}")

try:
    response = requests.post(
        "https://api.firecrawl.dev/v1/scrape",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={"url": "https://telkomsel.com", "formats": ["markdown"]},
        timeout=15
    )
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
