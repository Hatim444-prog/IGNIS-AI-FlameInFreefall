
from pathlib import Path
import pandas as pd
import hashlib

BASE = Path(__file__).resolve().parent
NASA = BASE / "data" / "raw" / "nasa" / "PSI-25"

files = list(
    NASA.rglob("PSI-25_Experimental table_BASS-II.csv")
)

if not files:
    raise SystemExit("CSV PSI-25 introuvable")

path = files[0]

df = pd.read_csv(path, encoding="utf-8-sig", dtype=str)
df.columns = df.columns.str.strip()

print("\n=== NASA PSI-25 ===")
print("Fichier :", path.name)
print("Lignes :", len(df))
print("Colonnes :", len(df.columns))
print("SHA256 :", hashlib.sha256(path.read_bytes()).hexdigest())

print("\n=== IDENTIFIANTS ===")
for col in ["Test #", "Sample #", "GMT"]:
    if col in df.columns:
        print(
            col,
            "uniques :", df[col].nunique(dropna=True),
            "manquants :", df[col].isna().sum()
        )

print("\n=== UNICITÉ COMBINÉE ===")
for cols in [
    ["Test #"],
    ["GMT", "Test #"],
    ["GMT", "Test #", "Sample #"]
]:
    if all(c in df.columns for c in cols):
        print(
            " + ".join(cols),
            "doublons :", df.duplicated(subset=cols).sum()
        )

print("\n=== VALEURS MANQUANTES ===")
missing = df.isna().sum()
for col, count in missing.items():
    print(f"{col}: {count} / {len(df)}")

print("\n=== LIGNES DUPLIQUÉES ===")
print(df.duplicated().sum())

print("\n=== VALEURS NON NUMÉRIQUES ===")
numeric_cols = [
    "Calibrated  initial O2 % by vol",
    "Calibrated final O2 % by vol",
    "Initial CO2 % by vol",
    "Final CO2 % by vol",
    "Initial CO (ppm)",
    "Final CO (ppm)"
]

for col in numeric_cols:
    if col not in df.columns:
        continue

    raw = df[col].str.strip()
    numbers = pd.to_numeric(raw, errors="coerce")

    invalid = raw.notna() & numbers.isna()

    print(
        f"{col}: {invalid.sum()} valeurs non numériques"
    )

    if invalid.any():
        print(raw[invalid].value_counts().head(10))

print("\n=== FIN INSPECTION ===")
