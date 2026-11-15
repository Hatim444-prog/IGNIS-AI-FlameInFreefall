
from pathlib import Path
import shutil
import csv
import hashlib
import sys

ROOT = Path(__file__).resolve().parent
NASA = ROOT / "ai-service" / "data" / "raw" / "nasa"
SOURCE = NASA / "unclassified"
REPORT = ROOT / "nasa_classification_result.csv"

# Correspondances conservatrices fondées sur les noms
RULES = {
    "PSI-20": ["bre_final_report", "acme-bre_"],
    "PSI-22": ["e-field"],
    "PSI-23": ["s-flame"],
    "PSI-25": ["bass-ii", "bass-2"],
    "PSI-26": ["bass_gmt", "bass_", "iss denver 2013-bass",
               "asg sr bass", "asgsr bass", "gmt2014_174_bass"],
    "PSI-39": ["cfi_", "cfi science", "cfi operational"],
    "PSI-47": ["daft"],
    "PSI-68": ["flex-2", "flex-1261"],
    "PSI-69": ["flex-007"],
    "PSI-98": ["saffire-i image"],
    "PSI-99": ["saffire-ii", "saffire_ii"],
    "PSI-100": ["saffire-iii", "saffire_iii"],
    "PSI-102": ["same final", "same eird",
                "same_baseline", "same_crew"],
    "PSI-106": ["slice"],
    "PSI-107": ["spice"],
}

CATEGORIES = [
    "experimental_tables",
    "science_documents",
    "metadata",
    "raw_data",
    "images",
]


def identify(name):
    name = name.lower()

    # Correspondances précises en priorité
    if "saffire-iii" in name or "saffire_iii" in name:
        return "PSI-100"

    if "saffire-ii" in name or "saffire_ii" in name:
        return "PSI-99"

    if "saffire-i" in name or "saffire_i" in name:
        return "PSI-98"

    if "cfi science" in name or "cfi operational" in name:
        return "PSI-39"

    matches = [
        psi for psi, keywords in RULES.items()
        if any(keyword in name for keyword in keywords)
    ]

    return matches[0] if len(matches) == 1 else None


def category(file):
    ext = file.suffix.lower()
    name = file.name.lower()

    if "metadata" in name:
        return "metadata"
    if ext in {".csv", ".xlsx", ".xls"}:
        return "experimental_tables"
    if ext in {".pdf", ".doc", ".docx", ".ppt", ".pptx"}:
        return "science_documents"
    if ext in {".jpg", ".jpeg", ".png", ".tif", ".tiff"}:
        return "images"
    return "raw_data"

def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

apply = "--apply" in sys.argv

if not SOURCE.is_dir():
    raise SystemExit(f"Source introuvable : {SOURCE}")

records = []
copied = 0

for file in sorted(SOURCE.rglob("*")):
    if not file.is_file():
        continue

    psi = identify(file.name)
    group = category(file)

    if psi is None:
        records.append([file.name, "", group, "A_VERIFIER"])
        continue

    target_dir = NASA / psi / group
    target = target_dir / file.name

    if target.exists():
        if digest(target) == digest(file):
            records.append([file.name, psi, group, "DEJA_PRESENT"])
            continue

        # Éviter d'écraser un fichier de même nom
        index = 2
        while target.exists():
            target = target_dir / (
                f"{file.stem}_{index}{file.suffix}"
            )
            index += 1

    if apply:
        target_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, target)
        copied += 1
        status = "COPIE"
    else:
        status = "PROPOSITION"

    records.append([file.name, psi, group, status])

with REPORT.open("w", newline="", encoding="utf-8-sig") as f:
    writer = csv.writer(f)
    writer.writerow([
        "filename", "investigation", "category", "status"
    ])
    writer.writerows(records)

print("\n=== CLASSEMENT NASA ===")
print("Mode :", "COPIE" if apply else "SIMULATION")
print("Fichiers examinés :", len(records))
print("Fichiers copiés :", copied)
print("À vérifier :", sum(r[3] == "A_VERIFIER" for r in records))
print("Rapport :", REPORT)
