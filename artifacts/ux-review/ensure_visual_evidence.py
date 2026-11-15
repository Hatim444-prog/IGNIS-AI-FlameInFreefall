import hashlib
import json
from pathlib import Path
import sys
import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "ai-service"))
from db_config import connect_db

path = Path("C:/Users/STRIX/AppData/Local/Temp/codex-clipboard-b0fec586-1325-47ff-801b-708dafafddf1.jpg")
digest = hashlib.sha256(path.read_bytes()).hexdigest()
with connect_db() as conn:
    existing = conn.execute(
        "SELECT v.id AS observation_id, s.filename FROM visual_observations v JOIN sources s ON s.id=v.source_id WHERE s.sha256=%s",
        (digest,),
    ).fetchone()
with httpx.Client(timeout=300) as client:
    if existing:
        print("Attached image already saved:", json.dumps(existing), flush=True)
        observation_id = existing["observation_id"]
    else:
        with path.open("rb") as file:
            saved = client.post("http://127.0.0.1:5174/ai/vision/store-image", headers={"x-ignis-mode": "ollama"}, files={"file": ("blue-orange-flames.jpg", file, "image/jpeg")})
        saved.raise_for_status()
        observation_id = saved.json()["observation_id"]
        print("Saved attached image:", observation_id, flush=True)
    result = client.get("http://127.0.0.1:5174/ai/vision/search", params={"q": "Blue and orange flames against a black background.", "limit": 10}, headers={"x-ignis-mode": "ollama"})
    result.raise_for_status()
    data = result.json()
    match = next(row for row in data["results"] if row["observation_id"] == observation_id)
    print(json.dumps({"search_mode": data["search_mode"], "filename": match["filename"], "observation_id": observation_id, "review_status": match["review_status"], "similarity": match["similarity"]}), flush=True)
