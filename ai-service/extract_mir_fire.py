
from pathlib import Path
from bs4 import BeautifulSoup
import re

# Dossier principal ai-service
BASE_DIR = Path(__file__).resolve().parent

# Fichiers source et destination
html_path = BASE_DIR / "data" / "raw" / "Mir_Fire.html"
txt_path = BASE_DIR / "data" / "raw" / "Mir_Fire.txt"

SOURCE_URL = (
    "https://www.nasa.gov/history/"
    "25-years-ago-fire-aboard-space-station-mir/"
)

# Vérifier le fichier HTML
if not html_path.exists():
    raise SystemExit(
        f"ERREUR : HTML introuvable : {html_path}"
    )

# Éviter d'écraser un fichier existant
if txt_path.exists():
    raise SystemExit(
        f"ERREUR : TXT existe déjà : {txt_path}"
    )

# Lire la page HTML
html = html_path.read_bytes()
soup = BeautifulSoup(html, "html.parser")

# Supprimer les éléments inutiles
for tag in soup.select(
    "script, style, nav, footer, header, aside, "
    "noscript, svg, form"
):
    tag.decompose()

# Récupérer le contenu de l'article
main = (
    soup.select_one("article")
    or soup.select_one("main")
    or soup.body
)

if main is None:
    raise SystemExit("Contenu HTML introuvable")

# Extraire le texte
text = main.get_text(separator="\n", strip=True)

# Nettoyage léger
text = re.sub(r"[ \t]+", " ", text)
text = re.sub(r"\n{3,}", "\n\n", text).strip()

# Vérifier le contenu extrait
if len(text) < 500 or not re.search(
    r"\bMir\b", text, re.IGNORECASE
):
    raise SystemExit(
        "Texte insuffisant ou contenu Mir absent."
    )

# Enregistrer les données
with txt_path.open("w", encoding="utf-8") as f:
    f.write(
        "TITLE: 25 Years Ago: Fire Aboard Space Station Mir\n"
    )
    f.write(f"SOURCE: {SOURCE_URL}\n")
    f.write("TYPE: NASA Space Fire Safety Case Study\n\n")
    f.write(text)

print("Extraction Mir Fire terminée !")
print(f"Caractères extraits : {len(text)}")
print(f"Fichier généré : {txt_path}")
