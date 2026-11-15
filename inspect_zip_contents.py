
from pathlib import Path
from collections import Counter
import zipfile
import csv

ROOT = Path(__file__).resolve().parent
ARCHIVES = ROOT / "ai-service/data/raw/nasa_psi/archives"
OUTPUT = ROOT / "ai-service/data/nasa_zip_filetypes.csv"

results = []

for archive in sorted(ARCHIVES.rglob("*.zip")):
    print(f"\n=== {archive.name} ===")

    with zipfile.ZipFile(archive) as z:
        files = [f for f in z.infolist() if not f.is_dir()]

        counts = Counter(
            Path(f.filename).suffix.lower() or "[sans extension]"
            for f in files
        )

        for ext, count in counts.most_common():
            print(f"  {ext}: {count}")

            results.append({
                "archive": archive.name,
                "extension": ext,
                "count": count
            })

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT.open("w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=["archive", "extension", "count"]
    )
    writer.writeheader()
    writer.writerows(results)

print("\n=== INVENTAIRE TERMINÉ ===")
print(f"Résultat : {OUTPUT}")
