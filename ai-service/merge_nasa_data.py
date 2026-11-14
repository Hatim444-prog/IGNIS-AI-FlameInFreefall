
from pathlib import Path
import json

BASE = Path(__file__).resolve().parent
DATA_DIR = BASE / "data" / "processed"

files = [
    "FLARE_chunks.jsonl",
    "SOFIE_chunks.jsonl",
    "FM2_chunks.jsonl",
    "NASA_Combustion_Guide_chunks.jsonl",
    "Apollo1_chunks.jsonl",
    "Apollo13_chunks.jsonl",
    "Mir_Fire_chunks.jsonl",
    "Firemans_Air_Tanks_chunks.jsonl",
    "Fire_Detector_chunks.jsonl",
    "Fire_Attire_chunks.jsonl"
]

output_file = DATA_DIR / "NASA_All_Data_chunks.jsonl"

# Vérifier tous les fichiers avant la fusion
missing = [
    name for name in files
    if not (DATA_DIR / name).is_file()
]

if missing:
    raise SystemExit(
        "Fichiers manquants :\n" + "\n".join(missing)
    )

if output_file.exists():
    raise SystemExit(
        f"Fichier final déjà existant : {output_file}"
    )

all_chunks = []
seen_ids = set()

for filename in files:
    path = DATA_DIR / filename
    count = 0

    with path.open("r", encoding="utf-8") as f:
        for line_number, line in enumerate(f, start=1):
            if not line.strip():
                continue

            chunk = json.loads(line)

            # Vérifier les champs essentiels
            for field in ["id", "source", "text"]:
                if field not in chunk:
                    raise ValueError(
                        f"{filename}:{line_number} : {field} absent"
                    )

            if not isinstance(chunk["text"], str):
                raise ValueError("Texte invalide")

            if not chunk["text"].strip():
                continue

            # Éviter les IDs dupliqués
            if chunk["id"] in seen_ids:
                raise ValueError(
                    f"ID dupliqué : {chunk['id']}"
                )

            seen_ids.add(chunk["id"])
            all_chunks.append(chunk)
            count += 1

    print(f"{filename} : {count} chunks")

if not all_chunks:
    raise SystemExit("Aucune donnée exploitable")

# Créer le fichier fusionné
with output_file.open("x", encoding="utf-8") as f:
    for chunk in all_chunks:
        f.write(
            json.dumps(chunk, ensure_ascii=False) + "\n"
        )

print("\nFusion terminée avec succès !")
print(f"Documents : {len(files)}")
print(f"Total chunks : {len(all_chunks)}")
print(f"Fichier final : {output_file}")
