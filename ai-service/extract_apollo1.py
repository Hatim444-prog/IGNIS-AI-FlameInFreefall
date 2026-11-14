
from pathlib import Path
from bs4 import BeautifulSoup
import re

BASE_DIR = Path(__file__).resolve().parent

# Fichier HTML déjà téléchargé
html_path = BASE_DIR / "data" / "raw" / "Apollo1.html"

# Fichier TXT à générer
txt_path = BASE_DIR / "data" / "raw" / "Apollo1.txt"

SOURCE_URL = "https://sma.nasa.gov/sma-disciplines/accllp/apollo-1"

if not html_path.exists():
    raise SystemExit(f"HTML introuvable : {html_path}")

if txt_path.exists():
    raise SystemExit(f"TXT existe déjà : {txt_path}")

# Lire le HTML
html = html_path.read_bytes()
soup = BeautifulSoup(html, "html.parser")

# Supprimer les éléments inutiles
for tag in soup.select(
    "script, style, nav, footer, header, aside, noscript, svg"
):
    tag.decompose()

# Récupérer le contenu principal
main = soup.select_one("main") or soup.select_one("article")

if main is None:
    main = soup.body or soup

text = main.get_text(separator="\n", strip=True)

# Nettoyage léger
text = re.sub(r"[ \t]+", " ", text)
text = re.sub(r"\n{3,}", "\n\n", text)

# Vérification du contenu
if len(text) < 500 or "Apollo" not in text:
    raise SystemExit(
        "Texte insuffisant : vérifier le HTML téléchargé."
    )

# Enregistrer avec la source
with txt_path.open("w", encoding="utf-8") as f:
    f.write("TITLE: Apollo 1 AS-204\n")
    f.write(f"SOURCE: {SOURCE_URL}\n")
    f.write("TYPE: NASA Safety Case Study\n\n")
    f.write(text)

print("Extraction Apollo 1 terminée !")
print(f"Caractères extraits : {len(text)}")
print(f"Fichier généré : {txt_path}")

