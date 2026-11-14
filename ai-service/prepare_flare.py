
from pathlib import Path
import re
import json

BASE = Path(__file__).resolve().parent

input_file = BASE / "data" / "raw" / "FLARE.txt"
output_dir = BASE / "data" / "processed"
output_dir.mkdir(parents=True, exist_ok=True)

output_file = output_dir / "FLARE_chunks.jsonl"

raw = input_file.read_text(encoding="utf-8")

# Séparer le document par pages
matches = list(re.finditer(
    r"(?m)^--- PAGE (\d+) ---[ \t]*$",
    raw
))

chunks = []

for i, match in enumerate(matches):
    page_number = int(match.group(1))

    start = match.end()
    end = (
        matches[i + 1].start()
        if i + 1 < len(matches)
        else len(raw)
    )

    text = raw[start:end].strip()

    # Nettoyage léger sans supprimer les données
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    if not text:
        continue

    # Découper en passages de 1000 caractères
    position = 0

    while position < len(text):
        end_chunk = min(position + 1000, len(text))

        chunk_text = text[position:end_chunk].strip()

        if chunk_text:
            chunks.append({
                "id": f"FLARE_p{page_number}_c{len(chunks)+1}",
                "source": "FLARE.pdf",
                "dataset": "NASA_Glenn",
                "experiment": "FLARE",
                "page": page_number,
                "text": chunk_text
            })

        if end_chunk == len(text):
            break

        # Chevauchement pour conserver le contexte
        position = end_chunk - 150

# Sauvegarder en JSONL
with output_file.open("w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

print("Préparation terminée !")
print(f"Nombre de chunks : {len(chunks)}")
print(f"Fichier généré : {output_file}")
