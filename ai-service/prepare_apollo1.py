
from pathlib import Path
import re
import json

BASE = Path(__file__).resolve().parent

input_file = BASE / "data" / "raw" / "Apollo1.txt"
output_dir = BASE / "data" / "processed"
output_dir.mkdir(parents=True, exist_ok=True)

output_file = output_dir / "Apollo1_chunks.jsonl"

SOURCE_URL = "https://sma.nasa.gov/sma-disciplines/accllp/apollo-1"

if not input_file.exists():
    raise SystemExit(f"Fichier introuvable : {input_file}")

if output_file.exists():
    raise SystemExit(f"Fichier déjà existant : {output_file}")

text = input_file.read_text(encoding="utf-8")

# Nettoyage léger
text = re.sub(r"[ \t]+", " ", text)
text = re.sub(r"\n{3,}", "\n\n", text).strip()

if not text:
    raise SystemExit("Le document est vide")

chunks = []
chunk_size = 1000
overlap = 150
step = chunk_size - overlap

for i, start in enumerate(range(0, len(text), step), start=1):
    chunk_text = text[start:start + chunk_size].strip()

    if not chunk_text:
        continue

    chunks.append({
        "id": f"APOLLO1_c{i}",
        "source": "Apollo1.html",
        "source_url": SOURCE_URL,
        "dataset": "NASA_Safety",
        "experiment": "APOLLO_1",
        "document_type": "NASA Safety Case Study",
        "page": None,
        "text": chunk_text
    })

# Écriture du JSONL
with output_file.open("w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

print("Préparation Apollo 1 terminée !")
print(f"Nombre de chunks : {len(chunks)}")
print(f"Fichier généré : {output_file}")
