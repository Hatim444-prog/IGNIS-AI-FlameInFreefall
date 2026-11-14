
from pathlib import Path
import re
import json

# Dossier principal ai-service
BASE = Path(__file__).resolve().parent

# Fichiers source et destination
input_file = BASE / "data" / "raw" / "Mir_Fire.txt"

output_dir = BASE / "data" / "processed"
output_dir.mkdir(parents=True, exist_ok=True)

output_file = output_dir / "Mir_Fire_chunks.jsonl"

SOURCE_URL = (
    "https://www.nasa.gov/history/"
    "25-years-ago-fire-aboard-space-station-mir/"
)

# Vérifier les fichiers
if not input_file.exists():
    raise SystemExit(f"Fichier introuvable : {input_file}")

if output_file.exists():
    raise SystemExit(f"Fichier déjà existant : {output_file}")

# Lire et nettoyer le texte
text = input_file.read_text(encoding="utf-8")
text = re.sub(r"[ \t]+", " ", text)
text = re.sub(r"\n{3,}", "\n\n", text).strip()

if not text:
    raise SystemExit("ERREUR : Mir_Fire.txt est vide")

# Paramètres du chunking
chunk_size = 1000
overlap = 150
step = chunk_size - overlap

chunks = []

for i, start in enumerate(range(0, len(text), step), start=1):
    chunk_text = text[start:start + chunk_size].strip()

    if not chunk_text:
        continue

    chunks.append({
        "id": f"MIR_FIRE_c{i}",
        "source": "Mir_Fire.html",
        "source_url": SOURCE_URL,
        "dataset": "NASA_Safety",
        "experiment": "MIR_FIRE",
        "document_type": "NASA Space Fire Safety Case Study",
        "page": None,
        "text": chunk_text
    })

    if start + chunk_size >= len(text):
        break

# Sauvegarder au format JSONL
with output_file.open("w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

print("Préparation Mir Fire terminée !")
print(f"Nombre de chunks : {len(chunks)}")
print(f"Fichier généré : {output_file}")
