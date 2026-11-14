
from pathlib import Path
from bs4 import BeautifulSoup
import re

# Dossier principal ai-service
BASE_DIR = Path(__file__).resolve().parent

# Fichiers source et destination
html_path = BASE_DIR / "data" / "raw" / "Apollo13.html"
txt_path = BASE_DIR / "data" / "raw" / "Apollo13.txt"

SOURCE_URL = "https://sma.nasa.gov/sma-disciplines/accllp/apollo-13"

# Vérifier le fichier HTML
if not html_path.exists():
    raise SystemExit(f"ERREUR : HTML introuvable : {html_path}")

# Éviter l'écrasement
if txt_path.exists():
    raise SystemExit(f"ERREUR : TXT existe déjà : {txt_path}")

# Lire la page HTML
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

# Nettoyage du texte
text = re.sub(r"[ \t]+", " ", text)
text = re.sub(r"\n{3,}", "\n\n", text).strip()

# Vérification du contenu
if len(text) < 500 or not re.search(
    r"Apollo[\s-]*13", text, re.IGNORECASE
):
    raise SystemExit(
        "Texte insuffisant ou Apollo 13 absent. "
        "Vérifier le HTML téléchargé."
    )

# Sauvegarder le texte scientifique
with txt_path.open("w", encoding="utf-8") as f:
    f.write("TITLE: Apollo 13\n")
    f.write(f"SOURCE: {SOURCE_URL}\n")
    f.write("TYPE: NASA Safety Case Study\n\n")
    f.write(text)

print("Extraction Apollo 13 terminée !")
print(f"Caractères extraits : {len(text)}")
print(f"Fichier généré : {txt_path}")
