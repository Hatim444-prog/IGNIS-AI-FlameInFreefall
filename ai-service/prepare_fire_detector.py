
from pathlib import Path
from bs4 import BeautifulSoup
import json
import re

# Dossier principal ai-service
BASE = Path(__file__).resolve().parent

# Fichier HTML déjà téléchargé
html_path = BASE / "data" / "raw" / "Fire_Detector.html"

# Fichier texte
txt_path = BASE / "data" / "raw" / "Fire_Detector.txt"

# Dossier des chunks
output_dir = BASE / "data" / "processed"
output_file = output_dir / "Fire_Detector_chunks.jsonl"

SOURCE_URL = "https://spinoff.nasa.gov/node/9407"

# Vérifier le HTML
if not html_path.exists():
    raise SystemExit(f"HTML introuvable : {html_path}")

# Protéger les fichiers existants
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

# Chercher le contenu principal
main = (
    soup.select_one("article")
    or soup.select_one("main")
    or soup.body
)

if main is None:
    raise SystemExit("Contenu HTML introuvable")

# Extraire les paragraphes pertinents
keywords = (
    "fire detector",
    "combustion",
    "sensor",
    "smoke",
    "false alarm",
    "brunswick",
    "fire watch"
)

paragraphs = []
seen = set()

for p in main.find_all("p"):
    text = p.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text).strip()

    # Ignorer les paragraphes trop courts
    if len(text) < 60:
        continue

    # Garder le contenu lié au sujet
    if not any(k in text.lower() for k in keywords):
        continue

    # Supprimer les doublons
    normalized = text.casefold()

    if normalized in seen:
        continue

    seen.add(normalized)
    paragraphs.append(text)

if not paragraphs:
    raise SystemExit(
        "Aucun paragraphe scientifique trouvé"
    )

text = "\n\n".join(paragraphs)

# Vérifier la qualité
if "brunswick" not in text.lower():
    raise SystemExit(
        "Contenu Fire Detector non identifié"
    )

# Paramètres du chunking
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
        "id": f"FIRE_DETECTOR_c{i}",
        "source": "Fire_Detector.html",
        "source_url": SOURCE_URL,
        "dataset": "NASA_Technology",
        "topic": "FIRE_DETECTION",
        "document_type": "NASA Spinoff Technology",
        "page": None,
        "text": chunk_text
    })

    if start + chunk_size >= len(text):
        break

# Enregistrer le texte
txt_path.write_text(
    "TITLE: Fire Detector\n"
    f"SOURCE: {SOURCE_URL}\n"
    "TYPE: NASA Spinoff Technology\n\n"
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

print("Préparation Fire Detector terminée !")
print(f"Caractères extraits : {len(text)}")
print(f"Nombre de chunks : {len(chunks)}")
print(f"TXT généré : {txt_path}")
print(f"JSONL généré : {output_file}")
