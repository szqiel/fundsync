import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
print(f"Loaded API Key: {api_key}")
genai.configure(api_key=api_key)

models_to_test = [
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash"
]

for model_name in models_to_test:
    try:
        model = genai.GenerativeModel(model_name)
        print(f"Attempting to generate text with {model_name}...")
        response = model.generate_content("Hello, respond in one word.")
        print(f"Success! Model {model_name} response: {response.text}")
        break
    except Exception as e:
        print(f"Model {model_name} failed: {e}\n")
