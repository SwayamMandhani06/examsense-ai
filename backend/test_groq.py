import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

if not api_key or "your_" in api_key:
    raise SystemExit("GROQ_API_KEY is missing in backend/.env. Please add your key from https://console.groq.com/keys")

print(f"Testing Groq API with model: {model}...")

try:
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [{"role": "user", "content": "Say hello from ExamSense AI in one short sentence."}],
        },
        timeout=15,
    )

    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        print("Success! Response from Groq:")
        print(f"-> {content}")
    else:
        print(f"Failed with response: {response.text}")
except Exception as exc:
    print(f"Connection error: {exc}")
