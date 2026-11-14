
from pathlib import Path
import re
import json

# Dossier principal ai-service
BASE = Path(__file__).resolve().parent

# Fichier source
input_file = BASE / "data" / "raw" / "Firemans_Air_Tanks.txt"

# Dossier de destination
output_dir = BASE / "data" / "processed"
output_dir.mkdir(parents=True, exist_ok=True)

# Fichier JSONL final
output_file = output_dir / "Firemans_Air_Tanks_chunks.jsonl"

SOURCE_URL = "https://spinoff.nasa.gov/node/9582"

# Vérifier l'existence des fichiers
if not input_file.exists():
    raise SystemExit(f"ERREUR : Fichier introuvable : {input_file}")

if output_file.exists():
    raise SystemExit(f"ERREUR : Fichier déjà existant : {output_file}")

# Lire le texte extrait
raw = input_file.read_text(encoding="utf-8")

# Identifier les pages
matches = list(re.finditer(
    r"(?m)^--- PAGE (\d+) ---[ \t]*$",
    raw
))

if not matches:
    raise SystemExit("ERREUR : Aucun numéro de page trouvé")

chunks = []
chunk_size = 1000
overlap = 150

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

    position = 0
    chunk_number = 1

    while position < len(text):
        end_chunk = min(position + chunk_size, len(text))
        chunk_text = text[position:end_chunk].strip()

        if chunk_text:
            chunks.append({
                "id": f"FIREMANS_p{page_number}_c{chunk_number}",
                "source": "Firemans_Air_Tanks.pdf",
                "source_url": SOURCE_URL,
                "dataset": "NASA_Technology",
                "topic": "FIREMANS_AIR_TANKS",
                "document_type": "NASA Spinoff Technology",
                "page": page_number,
                "text": chunk_text
            })

            chunk_number += 1

        if end_chunk == len(text):
            break

        # Chevauchement de 150 caractères
        position = end_chunk - overlap

if not chunks:
    raise SystemExit("ERREUR : Aucun texte exploitable")

# Enregistrer le JSONL
with output_file.open("w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

print("Préparation Fireman's Air Tanks terminée !")
print(f"Nombre de chunks : {len(chunks)}")
print(f"Fichier généré : {output_file}")

