
from pathlib import Path
import re
import json

# Dossier principal ai-service
BASE = Path(__file__).resolve().parent

# Fichier source
input_file = BASE / "data" / "raw" / "Apollo13.txt"

# Dossier de sortie
output_dir = BASE / "data" / "processed"
output_dir.mkdir(parents=True, exist_ok=True)

output_file = output_dir / "Apollo13_chunks.jsonl"

SOURCE_URL = "https://sma.nasa.gov/sma-disciplines/accllp/apollo-13"

# Vérifier le fichier source
if not input_file.exists():
    raise SystemExit(f"Fichier introuvable : {input_file}")

# Protéger les fichiers existants
if output_file.exists():
    raise SystemExit(f"Fichier déjà existant : {output_file}")

# Lire le texte
text = input_file.read_text(encoding="utf-8")

# Nettoyage léger
text = re.sub(r"[ \t]+", " ", text)
text = re.sub(r"\n{3,}", "\n\n", text).strip()

if not text:
    raise SystemExit("ERREUR : Apollo13.txt est vide")

# Paramètres du chunking
chunk_size = 1000
overlap = 150
step = chunk_size - overlap

chunks = []

# Découper le texte
for i, start in enumerate(range(0, len(text), step), start=1):

    chunk_text = text[start:start + chunk_size].strip()

    if not chunk_text:
        continue

    chunks.append({
        "id": f"APOLLO13_c{i}",
        "source": "Apollo13.html",
        "source_url": SOURCE_URL,
        "dataset": "NASA_Safety",
        "experiment": "APOLLO_13",
        "document_type": "NASA Safety Case Study",
        "page": None,
        "text": chunk_text
    })

    if start + chunk_size >= len(text):
        break

# Sauvegarder les chunks au format JSONL
with output_file.open("w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(
            json.dumps(chunk, ensure_ascii=False) + "\n"
        )

print("Préparation Apollo 13 terminée !")
print(f"Nombre de chunks : {len(chunks)}")
print(f"Fichier généré : {output_file}")
