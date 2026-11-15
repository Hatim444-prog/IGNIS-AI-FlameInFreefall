
from pathlib import Path
from collections import Counter
import shutil

# Bureau Windows (Desktop ou OneDrive)
desktop = Path.home() / "Desktop"

if not (desktop / "data_PSI").exists():
    desktop = Path.home() / "OneDrive" / "Desktop"

SOURCE = desktop / "data_PSI"
DEST = desktop / "IGNIS-AI-FlameInFreefall" / "ai-service" / "data" / "raw" / "nasa_psi"

categories = {
    "archives": [".zip", ".rar", ".7z"],
    "documents": [".pdf", ".docx", ".doc", ".pptx", ".ppt"],
    "structured": [".csv", ".xlsx", ".xls", ".json", ".txt"],
    "images": [".jpg", ".jpeg", ".png", ".tif", ".tiff"],
    "videos": [".mp4", ".avi", ".mov", ".mkv"],
}

if not SOURCE.is_dir():
    raise SystemExit(
        f"Dossier introuvable : {SOURCE}\n"
        "Copie son chemin depuis la barre d'adresse Windows."
    )

compteur = Counter()

for fichier in SOURCE.rglob("*"):
    if not fichier.is_file():
        continue

    categorie = "others"

    for nom, extensions in categories.items():
        if fichier.suffix.lower() in extensions:
            categorie = nom
            break

    destination = DEST / categorie / fichier.relative_to(SOURCE)
    destination.parent.mkdir(parents=True, exist_ok=True)

    shutil.copy2(fichier, destination)
    compteur[categorie] += 1

print("\n=== INVENTAIRE NASA PSI ===")

for categorie, nombre in compteur.items():
    print(f"{categorie}: {nombre} fichiers")

print(f"\nTotal : {sum(compteur.values())} fichiers")
print(f"Dossier de sortie : {DEST}")
