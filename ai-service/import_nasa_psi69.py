
from pathlib import Path
from collections import Counter
from datetime import datetime
from dotenv import load_dotenv
import argparse
import hashlib
import math
import os
import re

import pandas as pd
import psycopg


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

CSV_FILE = (
    BASE_DIR
    / "data/raw/nasa/PSI-69/experimental_tables/raw/structured"
    / "PSI-69_Experimental table_FLEX.csv"
)

INVESTIGATION_CODE = "PSI-69"
INVESTIGATION_TITLE = "NASA PSI-69 — FLEX"

EXPECTED_EXPERIMENTS = 274
EXPECTED_ZARM = 31
EXPECTED_PSI25 = 129

# Contrôles de non-régression : comptes relevés dans Neon
# après l'import PSI-25 (14/11/2026).

# ------------------------------------------------------------
# MAPPING DES COLONNES NASA
# ------------------------------------------------------------
# Les unités sont celles DÉCLARÉES dans les en-têtes du CSV.
# Aucune conversion SI n'est appliquée :
#   - pression reste en mmHg (pas de conversion en Pa)
#   - fractions gazeuses restent en mole fraction
#     (0.21 = fraction, PAS 21 %)
#   - "Burning rate; mm" est stocké avec l'unité déclarée "mm"
#     et signalé dans le rapport : la dimension physique
#     d'un débit de combustion en "mm" est suspecte et doit
#     être vérifiée dans la documentation FLEX avant usage.
# ------------------------------------------------------------

NUMERIC_MEASUREMENTS = {
    # (colonne CSV, variable_name, unité déclarée, catégorie)
    "Ambient pressure; mmHg": (
        "ambient_pressure", "mmHg", "experimental_conditions"),
    "O initial ambient composition; mole fraction": (
        "initial_o2_fraction", "mole fraction", "gas_composition"),
    "N initial ambient composition; mole fraction": (
        "initial_n2_fraction", "mole fraction", "gas_composition"),
    "CO initial ambient composition; mole fraction": (
        "initial_co_fraction", "mole fraction", "gas_composition"),
    "He initial ambient composition; mole fraction": (
        "initial_he_fraction", "mole fraction", "gas_composition"),
    "Droplet initial diameter; mm": (
        "droplet_initial_diameter", "mm", "experimental_conditions"),
    "Visible flame extinction diameter; mm": (
        "flame_extinction_diameter", "mm", "combustion_results"),
    "Burning rate; mm": (
        "burning_rate", "mm", "combustion_results"),
    "Burn time; s": (
        "burn_time", "s", "combustion_results"),
}

TEXT_MEASUREMENTS = {
    "FLEX Identifier": "flex_identifier",
    "Test GMT": "test_gmt",
}

CATEGORICAL_MEASUREMENTS = {
    "Test end": "test_end_condition",
}

MISSING_MARKERS = {"", "-", "--", "–", "—", "none", "n/a", "na"}

QUALIFIER_RE = re.compile(r"^([<>~])\s*(.+)$")


# ============================================================
# VALIDATION DES DONNEES SCIENTIFIQUES
# ============================================================

def parse_cell(raw):
    """
    Retourne (kind, value, qualifier) :
      kind = 'number' | 'text' | 'missing'
    Les marqueurs de valeurs manquantes NASA (–, —, vide)
    ne sont jamais convertis en 0.
    """
    text = str(raw).strip()

    if text.lower() in MISSING_MARKERS:
        return ("missing", None, None)

    match = QUALIFIER_RE.match(text)
    qualifier = match.group(1) if match else None
    body = match.group(2) if match else text

    try:
        value = float(body)
        if math.isfinite(value):
            return ("number", value, qualifier)
    except ValueError:
        pass

    return ("text", text, qualifier)


def parse_test_date(raw):
    """Test Date NASA au format m/d/yyyy -> date ISO."""
    text = str(raw).strip()
    if text.lower() in MISSING_MARKERS:
        return None
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def load_frame():
    if not CSV_FILE.is_file():
        raise FileNotFoundError(
            f"Fichier NASA introuvable : {CSV_FILE}"
        )

    last_error = None
    for encoding in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            return pd.read_csv(
                CSV_FILE,
                dtype=str,
                keep_default_na=False,
                encoding=encoding,
            )
        except UnicodeDecodeError as exc:
            last_error = exc
    raise ValueError(f"Encodage illisible : {last_error}")


def prepare_data():
    """
    Vérifie le CSV FLEX et prépare expériences + mesures.
    Aucune connexion PostgreSQL.
    """

    digest = hashlib.sha256(CSV_FILE.read_bytes()).hexdigest()

    df = load_frame()
    df.columns = df.columns.str.strip()

    required = {
        "FLEX Test #",
        "FLEX Identifier",
        "Fuel",
        "Test end",
        *NUMERIC_MEASUREMENTS.keys(),
        *TEXT_MEASUREMENTS.keys(),
    }

    missing = required - set(df.columns)

    if missing:
        raise ValueError(
            f"Colonnes NASA manquantes : {sorted(missing)}"
        )

    codes = df["FLEX Test #"].str.strip()

    if codes.eq("").any():
        raise ValueError("Certains FLEX Test # sont vides")

    if codes.duplicated().any():
        raise ValueError("Certains FLEX Test # sont dupliqués")

    experiments = []
    counters = Counter()
    skipped = Counter()
    warnings = Counter()

    for index, row in df.iterrows():

        test_code = row["FLEX Test #"].strip()
        fuel = row["Fuel"].strip() or None
        test_date = parse_test_date(row["Test Date"])

        if test_date is None:
            warnings[("date_unparsed", row["Test Date"].strip())] += 1

        measurements = []

        # --- Mesures numériques (avec qualificatifs) ---
        for column, (variable, unit, _category) in (
            NUMERIC_MEASUREMENTS.items()
        ):
            raw = row[column].strip()
            kind, value, qualifier = parse_cell(raw)

            if kind == "missing":
                skipped[(variable, raw or "<vide>")] += 1
                continue

            if kind == "text":
                # Valeur non numérique dans une colonne numérique :
                # conservée comme texte plutôt que perdue.
                measurements.append({
                    "variable": variable,
                    "value": None,
                    "text_value": value,
                    "qualifier": qualifier,
                    "unit": unit,
                })
                counters[variable] += 1
                warnings[("text_in_numeric", variable, value)] += 1
                continue

            measurements.append({
                "variable": variable,
                "value": value,
                "text_value": None,
                "qualifier": qualifier,
                "unit": unit,
            })
            counters[variable] += 1

        # --- Mesures textuelles ---
        for column, variable in TEXT_MEASUREMENTS.items():
            raw = row[column].strip()
            kind, value, _qualifier = parse_cell(raw)
            if kind == "missing":
                skipped[(variable, raw or "<vide>")] += 1
                continue
            measurements.append({
                "variable": variable,
                "value": None,
                "text_value": value,
                "qualifier": None,
                "unit": None,
            })
            counters[variable] += 1

        # --- Mesures catégorielles ---
        for column, variable in CATEGORICAL_MEASUREMENTS.items():
            raw = row[column].strip()
            kind, value, _qualifier = parse_cell(raw)
            if kind == "missing":
                skipped[(variable, raw or "<vide>")] += 1
                continue
            measurements.append({
                "variable": variable,
                "value": None,
                "text_value": value,
                "qualifier": None,
                "unit": None,
            })
            counters[variable] += 1

        experiments.append({
            "code": test_code,
            "fuel": fuel,
            "test_date": test_date,
            "source_row": index + 2,
            "measurements": measurements,
        })

    if len(experiments) != EXPECTED_EXPERIMENTS:
        raise ValueError(
            f"Nombre d'essais inattendu : {len(experiments)}"
        )

    return experiments, counters, skipped, warnings, digest


# ============================================================
# IMPORTATION NEON POSTGRESQL
# ============================================================

def _check_extension_columns(cur):
    """Vérifie que catalog_extension.sql a été appliqué."""
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'measurements'
          AND column_name IN ('text_value', 'qualifier')
    """)
    present = {row[0] for row in cur.fetchall()}
    missing = {"text_value", "qualifier"} - present
    if missing:
        raise ValueError(
            "Colonnes manquantes : " + ", ".join(sorted(missing)) +
            ". Exécutez d'abord catalog_extension.sql "
            "(avec mon accord) avant --apply."
        )


def _count(cur, investigation_code):
    cur.execute("""
        SELECT COUNT(*)
        FROM investigations i
        JOIN experiments e ON e.investigation_id = i.id
        WHERE i.code = %s
    """, (investigation_code,))
    return cur.fetchone()[0]


def apply_import(experiments, digest):
    """
    Importe PSI-69 FLEX dans Neon.

    Sécurité :
    - Transaction unique
    - INSERT uniquement, IDs générés par PostgreSQL
    - Vérification ZARM et PSI-25 avant/après
    - Protection contre les doublons
    - ROLLBACK en cas d'erreur
    """

    load_dotenv(BASE_DIR.parent / ".env")

    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError("DATABASE_URL introuvable")

    with psycopg.connect(
        database_url,
        sslmode="require",
        connect_timeout=15,
    ) as conn:

        with conn.transaction():
            with conn.cursor() as cur:

                cur.execute(
                    "SELECT pg_advisory_xact_lock(hashtext(%s))",
                    ("IGNIS_PSI69_IMPORT",)
                )

                _check_extension_columns(cur)

                zarm_before = _count(cur, "ZARM-FLARE")
                psi25_before = _count(cur, "PSI-25")

                if zarm_before != EXPECTED_ZARM:
                    raise ValueError(
                        f"ZARM contient {zarm_before} expériences "
                        f"au lieu de {EXPECTED_ZARM}. "
                        "Importation annulée."
                    )

                if psi25_before != EXPECTED_PSI25:
                    raise ValueError(
                        f"PSI-25 contient {psi25_before} expériences "
                        f"au lieu de {EXPECTED_PSI25}. "
                        "Importation annulée."
                    )

                cur.execute("""
                    SELECT id FROM investigations WHERE code = %s
                """, (INVESTIGATION_CODE,))

                if cur.fetchone():
                    raise ValueError(
                        "PSI-69 existe déjà dans Neon. "
                        "Importation annulée pour éviter "
                        "les doublons."
                    )

                # Doublons de codes à l'intérieur de PSI-69
                # déjà vérifiés par prepare_data().

                cur.execute("""
                    INSERT INTO investigations (
                        code, title, description
                    )
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (
                    INVESTIGATION_CODE,
                    INVESTIGATION_TITLE,
                    "Données expérimentales FLEX (Flame "
                    "Extinguishment Experiment) issues du "
                    "tableau NASA PSI-69."
                ))

                investigation_id = cur.fetchone()[0]

                print(
                    "Investigation PSI-69 créée :",
                    investigation_id,
                )

                relative_path = str(
                    CSV_FILE.relative_to(BASE_DIR)
                ).replace("\\", "/")

                cur.execute("""
                    INSERT INTO sources (
                        investigation_id,
                        experiment_id,
                        filename,
                        file_type,
                        local_path,
                        sha256,
                        verification_status
                    )
                    VALUES (%s, NULL, %s, %s, %s, %s, 'unverified')
                    RETURNING id
                """, (
                    investigation_id,
                    CSV_FILE.name,
                    "csv",
                    relative_path,
                    digest,
                ))

                source_id = cur.fetchone()[0]

                print("Source NASA enregistrée :", source_id)

                inserted_experiments = 0
                inserted_measurements = 0

                for experiment in experiments:

                    cur.execute("""
                        INSERT INTO experiments (
                            investigation_id,
                            experiment_code,
                            fuel_material,
                            gravity_condition,
                            experiment_date
                        )
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        investigation_id,
                        experiment["code"],
                        experiment["fuel"],
                        "microgravity",
                        experiment["test_date"],
                    ))

                    experiment_id = cur.fetchone()[0]
                    inserted_experiments += 1

                    for m in experiment["measurements"]:
                        cur.execute("""
                            INSERT INTO measurements (
                                experiment_id,
                                source_id,
                                variable_name,
                                value,
                                text_value,
                                unit,
                                qualifier,
                                source_row
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            experiment_id,
                            source_id,
                            m["variable"],
                            m["value"],
                            m["text_value"],
                            m["unit"],
                            m["qualifier"],
                            experiment["source_row"],
                        ))
                        inserted_measurements += 1

                psi69_count = _count(cur, INVESTIGATION_CODE)
                zarm_after = _count(cur, "ZARM-FLARE")
                psi25_after = _count(cur, "PSI-25")

                if psi69_count != EXPECTED_EXPERIMENTS:
                    raise ValueError(
                        "Nombre d'expériences PSI-69 incorrect"
                    )

                if inserted_experiments != EXPECTED_EXPERIMENTS:
                    raise ValueError(
                        "Insertion des expériences incomplète"
                    )

                if zarm_after != zarm_before:
                    raise ValueError(
                        "ZARM-FLARE modifié pendant l'import"
                    )

                if psi25_after != psi25_before:
                    raise ValueError(
                        "PSI-25 modifié pendant l'import"
                    )

        # COMMIT automatique si aucune exception

    print("\n====================================")
    print("IMPORTATION NASA PSI-69 RÉUSSIE")
    print("====================================")
    print("Investigation :", INVESTIGATION_CODE)
    print("Expériences FLEX :", psi69_count)
    print("Mesures insérées :", inserted_measurements)
    print("ZARM avant/après :", zarm_before, "/", zarm_after)
    print("PSI-25 avant/après :", psi25_before, "/", psi25_after)
    print("Transaction : COMMIT")


# ============================================================
# INTERFACE CLI
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description="Import NASA PSI-69 FLEX vers Neon PostgreSQL"
    )

    mode = parser.add_mutually_exclusive_group()

    mode.add_argument(
        "--dry-run",
        action="store_true",
        help="Valider les données sans modifier Neon "
             "(mode par défaut)",
    )

    mode.add_argument(
        "--apply",
        action="store_true",
        help="Importer réellement dans Neon "
             "(nécessite catalog_extension.sql appliqué)",
    )

    args = parser.parse_args()

    experiments, counters, skipped, warnings, digest = (
        prepare_data()
    )

    total_measurements = sum(counters.values())

    print("\n=== NASA PSI-69 / FLEX ===")
    print("Fichier :", CSV_FILE.name)
    print("SHA-256 :", digest)
    print("Essais :", len(experiments))
    print("Mesures :", total_measurements)
    print(
        "Valeurs exclues (manquantes) :",
        sum(skipped.values()),
    )

    fuels = Counter(e["fuel"] for e in experiments)
    print("\nCarburants :", dict(fuels))

    dates = [e["test_date"] for e in experiments if e["test_date"]]
    if dates:
        print(
            "Période :", min(dates), "->", max(dates),
            f"({len(dates)}/{len(experiments)} dates parsées)",
        )

    print("\n=== COMPTEURS PAR VARIABLE ===")
    for variable, count in sorted(counters.items()):
        print(f"{variable}: {count}")

    if skipped:
        print("\n=== VALEURS MANQUANTES PAR VARIABLE ===")
        for (variable, raw), count in sorted(skipped.items()):
            print(f"Exclu {variable}: {raw!r} x {count}")

    if warnings:
        print("\n=== AVERTISSEMENTS ===")
        for key, count in sorted(warnings.items()):
            print(f"{key}: x {count}")

    print(
        "\nNOTE UNITÉS : pression en mmHg, fractions en mole "
        "fraction (non converties), 'burning_rate' stocké avec "
        "l'unité déclarée 'mm' — à vérifier scientifiquement."
    )

    if not args.apply:
        print("\nMODE DRY-RUN")
        print("Aucune connexion Neon et aucune écriture.")
        return

    print("\nMODE APPLY : importation dans Neon")
    print(
        "PRÉREQUIS : catalog_extension.sql doit avoir été "
        "appliqué sur Neon."
    )

    apply_import(experiments, digest)


if __name__ == "__main__":
    main()
