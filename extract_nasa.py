
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent

ARCHIVES = ROOT / "ai-service/data/raw/nasa_psi/archives"
DEST = ROOT / "ai-service/data/extracted/nasa_psi"

ALLOWED = {".csv", ".xlsx", ".xls", ".pdf", ".txt", ".json"}

total = 0

for archive in sorted(ARCHIVES.rglob("*.zip")):
    with zipfile.ZipFile(archive) as z:
        for info in z.infolist():

            if info.is_dir():
                continue

            file_path = Path(info.filename)

            if file_path.suffix.lower() not in ALLOWED:
                continue

            # Empêche les chemins ZIP dangereux
            safe_parts = [
                p for p in file_path.parts
                if p not in ("..", ".", "/", "\\")
            ]

            if not safe_parts:
                continue

            destination = DEST / archive.stem / Path(*safe_parts)
            destination.parent.mkdir(parents=True, exist_ok=True)

            with z.open(info) as src:
                with destination.open("wb") as dst:
                    while chunk := src.read(1024 * 1024):
                        dst.write(chunk)

            total += 1

print("\n=== EXTRACTION TERMINÉE ===")
print(f"Fichiers extraits : {total}")
print(f"Dossier : {DEST}")
