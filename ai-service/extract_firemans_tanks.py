
from pathlib import Path
import pymupdf

# Dossier principal ai-service
BASE_DIR = Path(__file__).resolve().parent

# Fichier PDF source
pdf_path = BASE_DIR / "data" / "pdfs" / "Firemans_Air_Tanks.pdf"

# Dossier de destination
output_dir = BASE_DIR / "data" / "raw"
output_dir.mkdir(parents=True, exist_ok=True)

# Fichier texte final
txt_path = output_dir / "Firemans_Air_Tanks.txt"

# Vérifier l'existence du PDF
if not pdf_path.exists():
    raise SystemExit(f"ERREUR : PDF introuvable : {pdf_path}")

# Éviter d'écraser un fichier existant
if txt_path.exists():
    raise SystemExit(f"ERREUR : Fichier déjà existant : {txt_path}")

# Extraction du texte page par page
with pymupdf.open(pdf_path) as pdf:
    pages_vides = 0
    total_caracteres = 0

    with txt_path.open("w", encoding="utf-8") as output:
        for i, page in enumerate(pdf, start=1):
            texte = page.get_text("text", sort=True)

            if not texte.strip():
                pages_vides += 1

            total_caracteres += len(texte)

            output.write(f"\n--- PAGE {i} ---\n")
            output.write(texte + "\n")

    print(f"Pages traitées : {len(pdf)}")
    print(f"Pages sans texte : {pages_vides}")
    print(f"Caractères extraits : {total_caracteres}")

print("Extraction Fireman's Air Tanks terminée !")
print(f"Fichier généré : {txt_path}")
