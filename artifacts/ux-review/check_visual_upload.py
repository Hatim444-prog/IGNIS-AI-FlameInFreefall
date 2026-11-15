"""Save the selected existing flame image, then verify its actual search result."""
from pathlib import Path
import json
import httpx

path = Path("C:/IGNIS_AI/ai-service/data/visual/599e5af0b3f27281315afef2895e7d24e60d5fee2d74001f32ede310b9010edf.jpg")
with httpx.Client(timeout=300) as client:
    with path.open("rb") as file:
        response = client.post(
            "http://127.0.0.1:5174/ai/vision/store-image",
            headers={"x-ignis-mode": "ollama"},
            files={"file": ("blue-orange-flames.jpg", file, "image/jpeg")},
        )
    print("Save status:", response.status_code, flush=True)
    print(json.dumps(response.json(), ensure_ascii=False), flush=True)
    if response.is_success:
        result = client.get("http://127.0.0.1:5174/ai/vision/search", params={"q": "Blue and orange flames against a black background.", "limit": 10}, headers={"x-ignis-mode": "ollama"})
        print("Search status:", result.status_code, flush=True)
        print(json.dumps(result.json(), ensure_ascii=False), flush=True)
