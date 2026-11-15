
from pathlib import Path
from collections import defaultdict
import hashlib
import csv

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "ai-service" / "data"

SOURCES = [
    DATA / "raw" / "nasa_psi",
    DATA / "extracted" / "nasa_psi"
]

OUTPUT = DATA / "nasa_duplicates.csv"

def sha256_file(path):
    digest = hashlib.sha256()

    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()

groups = defaultdict(list)

for source in SOURCES:
    if not source.exists():
        continue

    for file in source.rglob("*"):
        if not file.is_file():
            continue

        # Ignore les téléchargements incomplets
        if file.suffix.lower() == ".crdownload":
            continue

        fingerprint = sha256_file(file)
        groups[fingerprint].append(file)

duplicates = []

for hash_value, files in groups.items():
    if len(files) > 1:
        for file in files:
            duplicates.append({
                "sha256": hash_value,
                "filename": file.name,
                "path": str(file.relative_to(DATA)),
                "size_mb": round(
                    file.stat().st_size / (1024 ** 2), 3
                )
            })

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT.open("w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=["sha256", "filename", "path", "size_mb"]
    )
    writer.writeheader()
    writer.writerows(duplicates)

duplicate_groups = sum(
    len(files) > 1 for files in groups.values()
)

print("\n=== VÉRIFICATION DES DOUBLONS ===")
print(f"Groupes de doublons : {duplicate_groups}")
print(f"Fichiers dans ces groupes : {len(duplicates)}")
print(f"Rapport : {OUTPUT}")
