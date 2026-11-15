
from pathlib import Path
from collections import Counter
import csv

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "ai-service" / "data"

SOURCES = [
    DATA / "raw" / "nasa_psi",
    DATA / "extracted" / "nasa_psi"
]

OUTPUT = DATA / "nasa_catalog.csv"
rows = []

for source in SOURCES:
    if not source.exists():
        print(f"Dossier absent : {source}")
        continue

    for f in source.rglob("*"):
        if not f.is_file():
            continue

        rows.append({
            "source": source.parent.name,
            "filename": f.name,
            "extension": f.suffix.lower(),
            "size_mb": round(f.stat().st_size / (1024 ** 2), 3),
            "relative_path": str(f.relative_to(DATA))
        })

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT.open("w", newline="", encoding="utf-8-sig") as file:
    writer = csv.DictWriter(
        file,
        fieldnames=[
            "source",
            "filename",
            "extension",
            "size_mb",
            "relative_path"
        ]
    )
    writer.writeheader()
    writer.writerows(rows)

counts = Counter(row["extension"] for row in rows)

print("\n=== CATALOGUE NASA PSI ===")
print(f"Total fichiers : {len(rows)}")

for ext, count in counts.most_common():
    print(f"{ext or '[sans extension]'} : {count}")

print(f"\nCatalogue enregistré : {OUTPUT}")
