import os

import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
model = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")

if not api_key:
    raise SystemExit("OPENROUTER_API_KEY is missing in environment.")

response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    },
    json={
        "model": model,
        "messages": [{"role": "user", "content": "Say hello in one short sentence."}],
    },
    timeout=30,
)

print("Status:", response.status_code)
print(response.text[:500])
