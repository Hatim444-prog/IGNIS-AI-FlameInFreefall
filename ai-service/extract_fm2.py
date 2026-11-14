
from pathlib import Path
import pymupdf

BASE_DIR = Path(__file__).resolve().parent

pdf_path = BASE_DIR / "data" / "pdfs" / "FM2.pdf"
txt_path = BASE_DIR / "data" / "raw" / "FM2.txt"

if not pdf_path.exists():
    raise SystemExit(f"PDF introuvable : {pdf_path}")

if txt_path.exists():
    raise SystemExit(f"Fichier déjà existant : {txt_path}")

with pymupdf.open(pdf_path) as pdf:
    with txt_path.open("w", encoding="utf-8") as output:
        for i, page in enumerate(pdf, start=1):
            texte = page.get_text("text", sort=True)
            output.write(f"\n--- PAGE {i} ---\n")
            output.write(texte + "\n")

    print(f"Pages traitées : {len(pdf)}")

print(f"Extraction terminée : {txt_path}")
