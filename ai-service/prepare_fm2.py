
from pathlib import Path
import re
import json

# Dossier principal ai-service
BASE = Path(__file__).resolve().parent

# Fichier texte extrait du PDF
input_file = BASE / "data" / "raw" / "FM2.txt"

# Dossier des données préparées
output_dir = BASE / "data" / "processed"
output_dir.mkdir(parents=True, exist_ok=True)

# Fichier JSONL final
output_file = output_dir / "FM2_chunks.jsonl"

# Vérification des fichiers
if not input_file.exists():
    raise SystemExit("ERREUR : FM2.txt introuvable")

if output_file.exists():
    raise SystemExit("ERREUR : FM2_chunks.jsonl existe déjà")

# Lecture du texte
raw = input_file.read_text(encoding="utf-8")

# Identifier les numéros de pages
matches = list(re.finditer(
    r"(?m)^--- PAGE (\d+) ---[ \t]*$",
    raw
))

if not matches:
    raise SystemExit("ERREUR : Aucun numéro de page trouvé")

chunks = []

# Traitement page par page
for i, match in enumerate(matches):
    page_number = int(match.group(1))

    start = match.end()
    end = (
        matches[i + 1].start()
        if i + 1 < len(matches)
        else len(raw)
    )

    text = raw[start:end].strip()

    # Nettoyage léger
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    if not text:
        continue

    # Chunking : 1000 caractères, overlap 150
    position = 0
    chunk_number = 1

    while position < len(text):
        end_chunk = min(position + 1000, len(text))
        chunk_text = text[position:end_chunk].strip()

        if chunk_text:
            chunks.append({
                "id": f"FM2_p{page_number}_c{chunk_number}",
                "source": "FM2.pdf",
                "dataset": "NASA_Glenn",
                "experiment": "FM2",
                "page": page_number,
                "text": chunk_text
            })

            chunk_number += 1

        if end_chunk == len(text):
            break

        position = end_chunk - 150

# Écriture au format JSONL
with output_file.open("w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(
            json.dumps(chunk, ensure_ascii=False) + "\n"
        )

print("Préparation FM2 terminée !")
print(f"Nombre de chunks : {len(chunks)}")
print(f"Fichier généré : {output_file}")
