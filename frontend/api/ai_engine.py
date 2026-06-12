import os
import httpx
import json
import asyncio
import google.generativeai as genai
from typing import Dict, List

# Global flag to track Gemini SDK configuration
_gemini_configured = False

def configure_gemini():
    """
    Ensures Gemini SDK is configured exactly once, avoiding configuration overhead on every request.
    """
    global _gemini_configured
    if not _gemini_configured:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured in the environment variables.")
        genai.configure(api_key=api_key)
        _gemini_configured = True
        print("Gemini SDK configured successfully.")

async def scrape_target_url(url: str, client: httpx.AsyncClient = None) -> str:
    """
    Scrape the sponsor URL using Firecrawl API, with a Safe Mode Fallback.
    Reuses the provided httpx.AsyncClient to avoid connection setup overhead.
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

    # Use the provided client, or create a temporary one if none is provided
    created_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=10.0)
        created_client = True

    try:
        # Support V1 endpoint directly (V0 is deprecated/inactive)
        # Optimized with 'onlyMainContent' to speed up scraping and reduce prompt bloat
        response = await client.post(
            "https://api.firecrawl.dev/v1/scrape",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "url": url, 
                "formats": ["markdown"],
                "onlyMainContent": True
            }
        )
        response.raise_for_status()
        data = response.json()
        
        # Parse based on V1 response structure
        content = ""
        if "data" in data:
            content = data["data"].get("markdown", "") or data["data"].get("content", "")
            
        if not content:
            print("Firecrawl returned empty content. Using fallback.")
            return fallback_string
            
        return content[:8000]  # Limit context size to prevent prompt bloating
    except Exception as e:
        print(f"Firecrawl scraping failed: {e}. Injecting safe mode fallback.")
        return fallback_string
    finally:
        if created_client:
            await client.aclose()

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
    Optimized with Structured Outputs (JSON Schema) to guarantee structural integrity and accelerate generation.
    """
    # Configure Gemini once globally
    configure_gemini()

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
    - If you cannot customize a paragraph within this strict length constraint, do NOT include it in the replacements array. Do not return items mapped to unchanged text.
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

    # Define Structured Output JSON Schema to guarantee schema enforcement and speed up generation
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "replacements": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "original_text": {
                            "type": "STRING",
                            "description": "The exact original paragraph from the master pitch deck list."
                        },
                        "personalized_text": {
                            "type": "STRING",
                            "description": "The newly rewritten paragraph tailored to the sponsor."
                        }
                    },
                    "required": ["original_text", "personalized_text"]
                },
                "description": "List of personalization mappings for pitch deck paragraphs."
            },
            "sponsor_name": {
                "type": "STRING",
                "description": "The resolved/actual name of the sponsor company."
            }
        },
        "required": ["replacements", "sponsor_name"]
    }

    # Primary model is gemini-2.0-flash (fast, high-quality). Fallback to gemini-1.5-flash.
    models_to_try = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
    ]
    
    last_error = None
    for model_name in models_to_try:
        try:
            print(f"Attempting content generation with {model_name}...")
            model = genai.GenerativeModel(
                model_name, 
                generation_config={
                    "response_mime_type": "application/json",
                    "response_schema": response_schema
                },
                system_instruction=system_instruction
            )
            
            # Request timeout optimized to 30s to prevent API hangs and fit serverless platform limits
            response = await asyncio.wait_for(
                model.generate_content_async(user_prompt),
                timeout=30.0
            )
            
            raw_text = response.text.strip()
            data = json.loads(raw_text)
            
            replacements_list = data.get("replacements", [])
            sponsor_name = data.get("sponsor_name", "")
            
            # Map back to flat structure for 100% backward compatibility
            flat_replacements = {}
            if isinstance(replacements_list, list):
                for item in replacements_list:
                    if isinstance(item, dict):
                        orig = item.get("original_text")
                        pers = item.get("personalized_text")
                        if orig is not None and pers is not None:
                            flat_replacements[orig] = pers
            elif isinstance(replacements_list, dict):
                for k, v in replacements_list.items():
                    flat_replacements[k] = v
            
            if sponsor_name:
                flat_replacements["{{SPONSOR_NAME}}"] = sponsor_name
                
            print(f"Gemini {model_name} successfully generated {len(flat_replacements)} replacements (including sponsor name).")
            return flat_replacements
        except Exception as e:
            last_error = e
            print(f"Model {model_name} failed or timed out: {e}. Trying fallback...")

    raise RuntimeError(
        f"API Error: {repr(last_error)}. Please check your API key, project rate limits, or quota details in Google AI Studio."
    )
