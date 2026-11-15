
from pathlib import Path
import zipfile
import csv

ROOT = Path(__file__).resolve().parent
ARCHIVES = ROOT / "ai-service" / "data" / "raw" / "nasa_psi" / "archives"
OUTPUT = ROOT / "ai-service" / "data" / "nasa_zip_inventory.csv"

rows = []

for archive in ARCHIVES.rglob("*.zip"):
    print(f"\nInspection : {archive.name}")

    try:
        with zipfile.ZipFile(archive, "r") as z:
            files = [f for f in z.infolist() if not f.is_dir()]

            size_mb = sum(f.file_size for f in files) / (1024 ** 2)

            rows.append({
                "archive": archive.name,
                "file_count": len(files),
                "uncompressed_mb": round(size_mb, 2),
                "status": "OK"
            })

            print(f"  Fichiers : {len(files)}")
            print(f"  Taille décompressée : {size_mb:.2f} Mo")

    except (zipfile.BadZipFile, OSError) as e:
        rows.append({
            "archive": archive.name,
            "file_count": 0,
            "uncompressed_mb": 0,
            "status": str(e)
        })
        print(f"  Erreur : {e}")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT.open("w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=["archive", "file_count", "uncompressed_mb", "status"]
    )
    writer.writeheader()
    writer.writerows(rows)

print("\n=== RÉSUMÉ ===")
print(f"Archives inspectées : {len(rows)}")
print(f"Inventaire enregistré : {OUTPUT}")
