import os
import requests
import json
import google.generativeai as genai
from typing import Dict

def scrape_target_url(url: str) -> str:
    """
    Step 3.1 & 3.2: Scrape the sponsor URL using Firecrawl API, with a Safe Mode Fallback.
    """
    fallback_string = "Tech Sponsor CSR Focus: The company is highly committed to AI innovation, community building, supporting student hackathons, and fostering the next generation of software engineers through funding and mentorship."
    
    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        print("No Firecrawl API key found. Using fallback.")
        return fallback_string

    try:
        response = requests.post(
            "https://api.firecrawl.dev/v0/scrape",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={"url": url},
            timeout=15
        )
        response.raise_for_status()
        data = response.json()
        
        # Firecrawl returns markdown content by default
        content = data.get("data", {}).get("markdown", "")
        if not content:
            return fallback_string
        return content
    except Exception as e:
        print(f"Firecrawl scraping failed: {e}. Injecting safe mode fallback.")
        return fallback_string

def generate_replacements_with_gemini(presentation_text: str, sponsor_context: str) -> Dict[str, str]:
    """
    Step 3.3: Feed presentation and context to Gemini to get a strict JSON mapping.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("No Gemini API key found. Returning empty replacements.")
        return {}

    genai.configure(api_key=api_key)
    # Using the flash model for speed during hackathon MVP
    model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})

    prompt = f"""
    You are an expert copywriter. Your task is to rewrite specific text blocks from a master pitch deck to perfectly align with a target sponsor's goals and CSR initiatives.

    Here is the information scraped from the Target Sponsor's website:
    ---
    {sponsor_context}
    ---

    Here is the extracted text from the Master Pitch Deck:
    ---
    {presentation_text}
    ---

    Return a strict JSON object mapping the exact ORIGINAL text to your NEW rewritten text.
    Only replace text that needs personalization (like placeholders, goals, alignments). Do not replace generic text like 'Thank you' or 'Agenda'.
    Ensure the replacement text is roughly the same length as the original so it doesn't break the slide's visual design.
    The JSON keys MUST exactly match the text in the presentation.

    Format:
    {{
      "ORIGINAL EXACT TEXT STRING": "New rewritten text tailored to sponsor",
      "{{SPONSOR_NAME}}": "The Sponsor's Actual Name"
    }}
    """

    try:
        response = model.generate_content(prompt)
        # Parse the strict JSON output
        replacements = json.loads(response.text)
        return replacements
    except Exception as e:
        print(f"Gemini generation failed: {e}")
        return {}
