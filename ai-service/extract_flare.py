
from pathlib import Path
import pymupdf

BASE_DIR = Path(__file__).resolve().parent

pdf_path = BASE_DIR / "data" / "pdfs" / "FLARE.pdf"
output_dir = BASE_DIR / "data" / "raw"
output_dir.mkdir(parents=True, exist_ok=True)

txt_path = output_dir / "FLARE.txt"

if not pdf_path.exists():
    print(f"PDF introuvable : {pdf_path}")
    raise SystemExit(1)

if txt_path.exists():
    print(f"Fichier déjà existant : {txt_path}")
    raise SystemExit(1)

with pymupdf.open(pdf_path) as pdf:
    with txt_path.open("w", encoding="utf-8") as output:
        for i, page in enumerate(pdf, start=1):
            texte = page.get_text("text")
            output.write(f"\n--- PAGE {i} ---\n")
            output.write(texte + "\n")

    print(f"Pages traitées : {len(pdf)}")

print(f"Extraction terminée : {txt_path}")
