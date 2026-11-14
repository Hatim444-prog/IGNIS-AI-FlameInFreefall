
from pathlib import Path
from bs4 import BeautifulSoup
import json
import re

BASE = Path(__file__).resolve().parent

html_path = BASE / "data" / "raw" / "Firemans_Air_Tanks.html"
txt_path = BASE / "data" / "raw" / "Firemans_Air_Tanks_Web.txt"

output_dir = BASE / "data" / "processed"
output_file = output_dir / "Firemans_Air_Tanks_chunks.jsonl"

SOURCE_URL = "https://spinoff.nasa.gov/node/9582"

# Vérifier les fichiers
if not html_path.exists():
    raise SystemExit(f"HTML introuvable : {html_path}")

if txt_path.exists() or output_file.exists():
    raise SystemExit("Fichier de sortie déjà existant")

# Lire le HTML
soup = BeautifulSoup(html_path.read_bytes(), "html.parser")

for tag in soup.select(
    "script, style, nav, footer, header, aside, noscript"
):
    tag.decompose()

# Extraire les paragraphes scientifiques
paragraphs = []
seen = set()

keywords = (
    "firefighter", "fireman", "air tanks",
    "air supply", "4,500 psi",
    "warning device", "scott aviation"
)

for p in soup.find_all("p"):
    text = p.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        continue

    if not any(k in text.lower() for k in keywords):
        continue

    if text in seen:
        continue

    seen.add(text)
    paragraphs.append(text)

if not paragraphs:
    raise SystemExit(
        "Aucun paragraphe scientifique trouvé. "
        "Vérifier le fichier HTML."
    )

text = "\n\n".join(paragraphs)

if "scott aviation" not in text.lower():
    raise SystemExit(
        "Le contenu extrait ne correspond pas au document attendu."
    )

# Préparer les chunks en mémoire
chunk_size = 1000
overlap = 150
step = chunk_size - overlap

chunks = []

for i, start in enumerate(range(0, len(text), step), start=1):
    chunk_text = text[start:start + chunk_size].strip()

    if not chunk_text:
        continue

    chunks.append({
        "id": f"FIREMANS_c{i}",
        "source": "Firemans_Air_Tanks.html",
        "source_url": SOURCE_URL,
        "dataset": "NASA_Technology",
        "topic": "FIREMANS_AIR_TANKS",
        "document_type": "NASA Spinoff Technology",
        "page": None,
        "text": chunk_text
    })

    if start + chunk_size >= len(text):
        break

# Sauvegarder uniquement après validation
output_dir.mkdir(parents=True, exist_ok=True)

txt_path.write_text(
    f"TITLE: Fireman's Air Tanks\n"
    f"SOURCE: {SOURCE_URL}\n\n{text}",
    encoding="utf-8"
)

with output_file.open("w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

print("Préparation Fireman's Air Tanks terminée !")
print(f"Caractères extraits : {len(text)}")
print(f"Nombre de chunks : {len(chunks)}")
print(f"TXT généré : {txt_path}")
print(f"JSONL généré : {output_file}")
