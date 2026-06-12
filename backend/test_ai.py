import asyncio
from dotenv import load_dotenv
load_dotenv()
from ai_engine import generate_replacements_with_gemini

async def main():
    try:
        res = await generate_replacements_with_gemini(["test paragraph"], "target context", 50, 50, "")
        print(res)
    except Exception as e:
        print(f"ERROR CAUGHT: {e}")

asyncio.run(main())
