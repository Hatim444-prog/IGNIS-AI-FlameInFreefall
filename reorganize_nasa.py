
from pathlib import Path
import re
import shutil
import hashlib
from collections import Counter

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "ai-service" / "data"

SOURCES = [
    DATA / "raw" / "nasa_psi",
    DATA / "extracted" / "nasa_psi",
]

DEST = DATA / "raw" / "nasa"

CATEGORIES = [
    "experimental_tables",
    "science_documents",
    "metadata",
    "raw_data",
    "images",
]

counts = Counter()
seen = set()

def get_investigation(file, source):
    relative = file.relative_to(source)

    # On privilégie le nom de l'archive ou du fichier
    for name in [*relative.parts[:-1], file.name]:
        match = re.search(
            r"PSI[-_ ]?(\d+)",
            name,
            flags=re.IGNORECASE
        )
        if match:
            return f"PSI-{int(match.group(1))}"

    return "unclassified"

def get_category(file):
    name = str(file).lower()
    ext = file.suffix.lower()

    if "metadata" in name:
        return "metadata"

    if "experimental table" in name or "experimental_table" in name:
        return "experimental_tables"

    if ext in {".csv", ".xlsx", ".xls"}:
        return "experimental_tables"

    if ext in {".pdf", ".doc", ".docx", ".ppt", ".pptx"}:
        return "science_documents"

    if ext in {".jpg", ".jpeg", ".png", ".tif", ".tiff"}:
        return "images"

    if ext == ".zip":
        return "archives"

    return "raw_data"

def sha256(file):
    h = hashlib.sha256()
    with file.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

if DEST.exists():
    raise SystemExit(
        f"Destination déjà existante : {DEST}\n"
        "Vérifie son contenu avant de relancer."
    )

for source in SOURCES:
    if not source.exists():
        continue

    for file in source.rglob("*"):
        if not file.is_file():
            continue

        if file.suffix.lower() == ".crdownload":
            counts["incomplete_skipped"] += 1
            continue

        # Ne copier qu'une fois un contenu identique
        fingerprint = sha256(file)
        if fingerprint in seen:
            counts["duplicates_skipped"] += 1
            continue

        investigation = get_investigation(file, source)
        category = get_category(file)

        # Préserve le chemin source pour éviter les collisions
        relative = file.relative_to(source)
        target = (
            DEST / investigation / category
            / source.parent.name / relative
        )

        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, target)

        seen.add(fingerprint)
        counts["copied"] += 1
        counts[investigation] += 1

# Créer les 5 catégories pour chaque investigation identifiée
for folder in DEST.iterdir():
    if folder.is_dir() and folder.name.startswith("PSI-"):
        for category in CATEGORIES:
            (folder / category).mkdir(exist_ok=True)

print("\n=== RÉORGANISATION NASA ===")
for key, value in sorted(counts.items()):
    print(f"{key}: {value}")

print(f"\nDestination : {DEST}")
print("Originaux conservés.")
