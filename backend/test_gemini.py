import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()
gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

if not gemini_key:
    print("ERROR: GEMINI_API_KEY is not set in your backend/.env file!")
    exit(1)

models_to_test = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite"
]

payload = {
    "contents": [{"parts": [{"text": "Hello, output JSON: {'status': 'ok'}"}]}]
}
headers = {"Content-Type": "application/json"}

for m in models_to_test:
    url = f"https://generativelanguage.googleapis.com/v1/models/{m}:generateContent?key={gemini_key}"
    print(f"\n--- Testing {m} ---")
    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=10.0)
        print(f"Status: {response.status_code}")
        print(response.text[:200])
    except Exception as e:
        print(f"Error: {e}")
