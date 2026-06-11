import os
import httpx
import json
import google.generativeai as genai
from typing import Dict, List

async def scrape_target_url(url: str) -> str:
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
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={"url": url, "formats": ["markdown"]}
            )
            if response.status_code == 404:
                # Fallback to V0
                response = await client.post(
                    "https://api.firecrawl.dev/v0/scrape",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={"url": url}
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

async def generate_replacements_with_gemini(
    presentation_paragraphs: List[str], 
    sponsor_context: str,
    tone_formal: int = 50,
    tone_technical: int = 50,
    custom_focus: str = ""
) -> Dict[str, str]:
    """
    Feed presentation paragraphs and scraped sponsor context to Gemini to get a strict JSON mapping,
    adhering to custom tone and focus configurations.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("No GEMINI_API_KEY found in environment. Returning empty replacements.")
        return {}

    genai.configure(api_key=api_key)

    # Formulate tone and priorities guidelines
    tone_instructions = []
    if tone_formal > 65:
        tone_instructions.append("- Adopt a highly formal, executive, and professional vocabulary suitable for corporate stakeholders.")
    elif tone_formal < 35:
        tone_instructions.append("- Adopt a warm, creative, and narrative-driven tone.")
        
    if tone_technical > 65:
        tone_instructions.append("- Emphasize technical robustness, technology stack integration, and developer outreach/benefits.")
    elif tone_technical < 35:
        tone_instructions.append("- Emphasize Corporate Social Responsibility (CSR), community impact, student mentorship, and public good.")
        
    if custom_focus:
        tone_instructions.append(f"- Prioritize custom alignment goals: '{custom_focus}'.")
        
    tone_str = "\n".join(tone_instructions)

    # Format the paragraphs list so Gemini can easily identify exact matches
    paragraphs_json = json.dumps(presentation_paragraphs, indent=2)

    system_instruction = f"""
    You are an expert copywriter. Your task is to personalize specific text segments (paragraphs or phrases) from a master pitch deck to align with a target sponsor's mission, CSR goals, and core values.

    Copywriting & Alignment Guidelines:
    ---
    {tone_str if tone_str else "Adapt the segments to align with the sponsor in a balanced, professional manner."}
    ---

    CRITICAL LENGTH & QUALITY CONSTRAINTS:
    - To prevent presentation layout breakages, the character count of each rewritten value (value) MUST NOT exceed 1.15x (115%) of the character count of its original paragraph (key).
    - Maintain a character count within 90% to 110% of the original text.
    - Avoid verbose introductions, extra sentences, or conversational explanations.
    - Keep the personalized version extremely concise and of similar visual length.
    - If you cannot customize a paragraph within this strict length constraint, do NOT include it in the returned JSON (omit the key entirely). Do not return keys mapped to unchanged text.

    You MUST return a JSON object mapping the EXACT original paragraph (keys) to your newly rewritten paragraph (values).
    The keys in the JSON object MUST exactly match a string from the Master Pitch Deck list provided by the user, character-for-character, including spacing and punctuation.

    Format:
    {{
      "Exact Original Paragraph From List": "Newly rewritten paragraph tailored to sponsor",
      "{{SPONSOR_NAME}}": "Actual Sponsor Name"
    }}
    """

    user_prompt = f"""
    Target Sponsor Context:
    ---
    {sponsor_context}
    ---

    Here is a list of exact text paragraphs extracted from the Master Pitch Deck:
    ---
    {paragraphs_json}
    ---

    Identify which of these paragraphs can be customized to appeal to the sponsor, and return the JSON mapping.
    """

    # Models list prioritizing available stable Gemini options
    models_to_try = [
        'gemini-3.5-flash',
        'gemini-2.5-flash',
        'gemini-flash-latest',
    ]
    
    last_error = None
    for model_name in models_to_try:
        try:
            print(f"Attempting content generation with {model_name}...")
            model = genai.GenerativeModel(
                model_name, 
                generation_config={"response_mime_type": "application/json"},
                system_instruction=system_instruction
            )
            # Make the API call asynchronous if the SDK supports it, or wrap in a thread block
            import asyncio
            # For genai, generate_content_async is supported
            response = await asyncio.wait_for(
                model.generate_content_async(user_prompt),
                timeout=180.0 # Increased from 30s to 180s to allow Gemini to process entire pitch decks
            )
            
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
                
            replacements = json.loads(raw_text.strip())
            print(f"Gemini {model_name} successfully generated {len(replacements)} replacements.")
            return replacements
        except Exception as e:
            last_error = e
            print(f"Model {model_name} failed or timed out: {e}. Trying fallback...")

    raise RuntimeError(
        f"API Error: {repr(last_error)}. Please check your API key, project rate limits, or quota details in Google AI Studio."
    )
