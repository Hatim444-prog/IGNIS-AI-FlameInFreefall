
from pathlib import Path
import re
import json

BASE = Path(__file__).resolve().parent

input_file = BASE / "data" / "raw" / "SOFIE.txt"
output_dir = BASE / "data" / "processed"
output_dir.mkdir(parents=True, exist_ok=True)

output_file = output_dir / "SOFIE_chunks.jsonl"

if not input_file.exists():
    raise SystemExit("SOFIE.txt introuvable")

if output_file.exists():
    raise SystemExit("SOFIE_chunks.jsonl existe déjà")

raw = input_file.read_text(encoding="utf-8")

matches = list(re.finditer(
    r"(?m)^--- PAGE (\d+) ---[ \t]*$",
    raw
))

if not matches:
    raise SystemExit("Aucun numéro de page trouvé")

chunks = []

for i, match in enumerate(matches):
    page_number = int(match.group(1))
    start = match.end()
    end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)

    text = raw[start:end].strip()
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    if not text:
        continue

    position = 0
    chunk_number = 1

    while position < len(text):
        end_chunk = min(position + 1000, len(text))
        chunk_text = text[position:end_chunk].strip()

        if chunk_text:
            chunks.append({
                "id": f"SOFIE_p{page_number}_c{chunk_number}",
                "source": "SOFIE.pdf",
                "dataset": "NASA_Glenn",
                "experiment": "SOFIE",
                "page": page_number,
                "text": chunk_text
            })
            chunk_number += 1

        if end_chunk == len(text):
            break

        position = end_chunk - 150

with output_file.open("w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

print("Préparation SoFIE terminée !")
print(f"Nombre de chunks : {len(chunks)}")
print(f"Fichier généré : {output_file}")
