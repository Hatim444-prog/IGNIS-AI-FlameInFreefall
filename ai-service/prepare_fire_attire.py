
from pathlib import Path
from bs4 import BeautifulSoup
import json
import re

# Dossier principal ai-service
BASE = Path(__file__).resolve().parent

# Fichier HTML téléchargé
html_path = BASE / "data" / "raw" / "Fire_Attire.html"

# Fichier TXT
txt_path = BASE / "data" / "raw" / "Fire_Attire.txt"

# Fichier JSONL
output_dir = BASE / "data" / "processed"
output_file = output_dir / "Fire_Attire_chunks.jsonl"

SOURCE_URL = "https://spinoff.nasa.gov/node/9918"

# Vérifications
if not html_path.exists():
    raise SystemExit(f"HTML introuvable : {html_path}")

if txt_path.exists() or output_file.exists():
    raise SystemExit("Fichier de sortie déjà existant")

# Lire le HTML
soup = BeautifulSoup(
    html_path.read_bytes(),
    "html.parser"
)

# Supprimer les éléments inutiles
for tag in soup.select(
    "script, style, nav, footer, header, "
    "aside, noscript, svg, form"
):
    tag.decompose()

# Chercher le contenu de l'article
main = (
    soup.select_one("article")
    or soup.select_one("main")
    or soup.body
)

if main is None:
    raise SystemExit("Contenu HTML introuvable")

# Extraire les paragraphes sans doublons
paragraphs = []
seen = set()

for p in main.find_all("p"):
    text = p.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text).strip()

    if len(text) < 50:
        continue

    normalized = text.casefold()

    if normalized in seen:
        continue

    seen.add(normalized)
    paragraphs.append(text)

if not paragraphs:
    raise SystemExit("Aucun paragraphe trouvé")

text = "\n\n".join(paragraphs)

# Vérifier que le contenu correspond au sujet
if "project fires" not in text.lower():
    raise SystemExit(
        "Contenu Project FIRES non identifié"
    )

# Chunking
chunk_size = 1000
overlap = 150
step = chunk_size - overlap

chunks = []

for i, start in enumerate(
    range(0, len(text), step),
    start=1
):
    chunk_text = text[start:start + chunk_size].strip()

    if not chunk_text:
        continue

    chunks.append({
        "id": f"FIRE_ATTIRE_c{i}",
        "source": "Fire_Attire.html",
        "source_url": SOURCE_URL,
        "dataset": "NASA_Technology",
        "topic": "FIREFIGHTER_PROTECTION",
        "document_type": "NASA Spinoff Technology",
        "publication_year": 1982,
        "page": None,
        "text": chunk_text
    })

    if start + chunk_size >= len(text):
        break

# Enregistrer le TXT
txt_path.write_text(
    "TITLE: New Technology for the Fire Attire\n"
    f"SOURCE: {SOURCE_URL}\n"
    "TYPE: NASA Spinoff Technology\n"
    "YEAR: 1982\n\n"
    + text,
    encoding="utf-8"
)

# Enregistrer les chunks JSONL
output_dir.mkdir(parents=True, exist_ok=True)

with output_file.open("w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(
            json.dumps(chunk, ensure_ascii=False) + "\n"
        )

print("Préparation Fire Attire terminée !")
print(f"Caractères extraits : {len(text)}")
print(f"Nombre de chunks : {len(chunks)}")
print(f"TXT généré : {txt_path}")
print(f"JSONL généré : {output_file}")
