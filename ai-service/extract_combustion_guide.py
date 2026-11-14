
from pathlib import Path
import pymupdf

# Dossier principal ai-service
BASE_DIR = Path(__file__).resolve().parent

# Chemin du PDF
pdf_path = BASE_DIR / "data" / "pdfs" / "NASA_Combustion_Guide.pdf"

# Dossier de destination
output_dir = BASE_DIR / "data" / "raw"
output_dir.mkdir(parents=True, exist_ok=True)

# Fichier TXT final
txt_path = output_dir / "NASA_Combustion_Guide.txt"

# Vérifier le PDF
if not pdf_path.exists():
    raise SystemExit(f"ERREUR : PDF introuvable : {pdf_path}")

# Éviter d'écraser les données existantes
if txt_path.exists():
    raise SystemExit(f"ERREUR : Fichier déjà existant : {txt_path}")

# Extraction du texte
with pymupdf.open(pdf_path) as pdf:
    pages_vides = 0

    with txt_path.open("w", encoding="utf-8") as output:
        for i, page in enumerate(pdf, start=1):
            texte = page.get_text("text", sort=True)

            if not texte.strip():
                pages_vides += 1

            output.write(f"\n--- PAGE {i} ---\n")
            output.write(texte + "\n")

    print(f"Pages traitées : {len(pdf)}")
    print(f"Pages sans texte : {pages_vides}")

print("Extraction terminée avec succès !")
print(f"Fichier généré : {txt_path}")
