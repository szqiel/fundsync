import os
import requests
import json
import google.generativeai as genai
from typing import Dict, List

def scrape_target_url(url: str) -> str:
    """
    Scrape the sponsor URL using Firecrawl API, with a Safe Mode Fallback.
    """
    fallback_string = (
        "Tech Sponsor CSR Focus: The company is highly committed to AI innovation, "
        "sponsoring student hackathons, community building, and supporting open-source "
        "software development through funding and mentorship."
    )
    
    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        print("No FIRECRAWL_API_KEY found in environment. Using fallback.")
        return fallback_string

    try:
        # Support V1 endpoint as primary, fallback to V0 if needed
        response = requests.post(
            "https://api.firecrawl.dev/v1/scrape",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={"url": url, "formats": ["markdown"]},
            timeout=15
        )
        if response.status_code == 404:
            # Fallback to V0
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
        
        # Parse based on V1 or V0 response structure
        content = ""
        if "data" in data:
            content = data["data"].get("markdown", "") or data["data"].get("content", "")
        elif "markdown" in data:
            content = data["markdown"]
            
        if not content:
            print("Firecrawl returned empty content. Using fallback.")
            return fallback_string
            
        return content[:8000]  # Limit context size to prevent prompt bloating
    except Exception as e:
        print(f"Firecrawl scraping failed: {e}. Injecting safe mode fallback.")
        return fallback_string

def generate_replacements_with_gemini(presentation_paragraphs: List[str], sponsor_context: str) -> Dict[str, str]:
    """
    Feed presentation paragraphs and scraped sponsor context to Gemini to get a strict JSON mapping.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("No GEMINI_API_KEY found in environment. Returning empty replacements.")
        return {}

    genai.configure(api_key=api_key)

    # Format the paragraphs list so Gemini can easily identify exact matches
    paragraphs_json = json.dumps(presentation_paragraphs, indent=2)

    prompt = f"""
    You are an expert copywriter. Your task is to personalize specific text segments (paragraphs or phrases) from a master pitch deck to align with a target sponsor's mission, CSR goals, and core values.

    Target Sponsor Context:
    ---
    {sponsor_context}
    ---

    Here is a list of exact text paragraphs extracted from the Master Pitch Deck:
    ---
    {paragraphs_json}
    ---

    Identify which of these paragraphs can be customized to appeal to the sponsor. 
    Examples of what to personalize:
    - Replace placeholder text like "{{SPONSOR_NAME}}", "[Sponsor Name]", or any obvious placeholders.
    - Rewrite descriptions of the event or partnership opportunities to align with the sponsor's tech stack or social causes.
    - Keep the rewritten version approximately the same length as the original to prevent layout breakages in the slide.

    You MUST return a JSON object mapping the EXACT original paragraph (keys) to your newly rewritten paragraph (values).
    The keys in the JSON object MUST exactly match a string from the Master Pitch Deck list above, character-for-character, including spacing and punctuation.

    Format:
    {{
      "Exact Original Paragraph From List": "Newly rewritten paragraph tailored to sponsor",
      "{{SPONSOR_NAME}}": "Actual Sponsor Name"
    }}
    """

    # Models list prioritizing available Gemini 2.5 and 2.0 options
    models_to_try = [
        'gemini-2.5-flash',
        'gemini-2.0-flash', 
        'gemini-2.0-flash-lite', 
        'gemini-2.5-pro',
        'gemini-2.0-pro-exp-02-05'
    ]
    
    last_error = None
    for model_name in models_to_try:
        try:
            print(f"Attempting content generation with {model_name}...")
            model = genai.GenerativeModel(
                model_name, 
                generation_config={"response_mime_type": "application/json"}
            )
            response = model.generate_content(prompt)
            replacements = json.loads(response.text)
            print(f"Gemini {model_name} successfully generated {len(replacements)} replacements.")
            return replacements
        except Exception as e:
            last_error = e
            print(f"Model {model_name} failed or timed out: {e}. Trying fallback...")

    raise RuntimeError(
        f"All Gemini models failed to generate content. Last error: {last_error}. "
        "Please check your API key, project rate limits, or quota details in Google AI Studio."
    )
