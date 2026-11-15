
from pathlib import Path
from collections import Counter
from dotenv import load_dotenv
import argparse
import hashlib
import math
import os

import pandas as pd
import psycopg


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

CSV_FILE = (
    BASE_DIR
    / "data/raw/nasa/PSI-25/experimental_tables/raw/structured"
    / "PSI-25_Experimental table_BASS-II.csv"
)

EXPECTED_SHA256 = (
    "71e792bf6b5fb5ea620c5dd70fbbac05515992e12aefcf5dff47312caa48c042"
)

INVESTIGATION_CODE = "PSI-25"
EXPECTED_EXPERIMENTS = 129
EXPECTED_MEASUREMENTS = 752
EXPECTED_ZARM = 31

MEASUREMENTS = {
    "Calibrated  initial O2 % by vol ": ("oxygen_initial", "% vol"),
    "Calibrated final O2 % by vol": ("oxygen_final", "% vol"),
    "Initial CO2 % by vol": ("co2_initial", "% vol"),
    "Final CO2 % by vol": ("co2_final", "% vol"),
    "Initial CO (ppm)": ("co_initial", "ppm"),
    "Final CO (ppm)": ("co_final", "ppm"),
}


# ============================================================
# VALIDATION DES DONNEES SCIENTIFIQUES
# ============================================================

def parse_number(raw):
    """
    Convertit uniquement les nombres valides.

    Les valeurs non numériques (none, OR, >500, over)
    ne sont jamais converties en 0.
    """
    text = str(raw).strip()

    if not text:
        return None

    try:
        value = float(text)
        if math.isfinite(value):
            return value
        return None

    except ValueError:
        return None


def prepare_data():
    """
    Vérifie le CSV et prépare les expériences et mesures.
    Aucune connexion PostgreSQL.
    """

    if not CSV_FILE.is_file():
        raise FileNotFoundError(
            f"Fichier NASA introuvable : {CSV_FILE}"
        )

    digest = hashlib.sha256(CSV_FILE.read_bytes()).hexdigest()

    if digest != EXPECTED_SHA256:
        raise ValueError(
            "SHA-256 inattendu : le fichier source a changé. "
            "Importation bloquée."
        )

    df = pd.read_csv(
        CSV_FILE,
        dtype=str,
        keep_default_na=False
    )

    required = {
        "Test #",
        "Fuel Sample Material",
        *MEASUREMENTS.keys()
    }

    missing = required - set(df.columns)

    if missing:
        raise ValueError(
            f"Colonnes NASA manquantes : {sorted(missing)}"
        )

    codes = df["Test #"].str.strip()

    if codes.eq("").any():
        raise ValueError("Certains Test # sont vides")

    if codes.duplicated().any():
        raise ValueError("Certains Test # sont dupliqués")

    experiments = []
    counters = Counter()
    skipped = Counter()

    for index, row in df.iterrows():

        test_code = row["Test #"].strip()
        fuel = row["Fuel Sample Material"].strip() or None

        measurements = []

        for column, (variable, unit) in MEASUREMENTS.items():

            raw = row[column].strip()
            value = parse_number(raw)

            if value is None:
                skipped[(variable, raw or "<vide>")] += 1
                continue

            measurements.append({
                "variable": variable,
                "value": value,
                "unit": unit
            })

            counters[variable] += 1

        experiments.append({
            "code": test_code,
            "fuel": fuel,
            "oxygen": parse_number(
                row["Calibrated  initial O2 % by vol "]
            ),
            "source_row": index + 2,
            "measurements": measurements
        })

    total_measurements = sum(counters.values())

    if len(experiments) != EXPECTED_EXPERIMENTS:
        raise ValueError(
            f"Nombre d'essais inattendu : {len(experiments)}"
        )

    if total_measurements != EXPECTED_MEASUREMENTS:
        raise ValueError(
            f"Nombre de mesures inattendu : {total_measurements}"
        )

    if sum(skipped.values()) != 22:
        raise ValueError(
            "Le nombre de valeurs non numériques a changé"
        )

    return experiments, counters, skipped, digest


# ============================================================
# IMPORTATION NEON POSTGRESQL
# ============================================================

def apply_import(experiments, digest):
    """
    Importe PSI-25 dans Neon.

    Sécurité :
    - Transaction unique
    - INSERT uniquement
    - Identifiants générés par PostgreSQL
    - Vérification ZARM avant et après
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
        connect_timeout=15
    ) as conn:

        with conn.transaction():
            with conn.cursor() as cur:

                # ------------------------------------------------
                # 1. Verrou pour éviter deux imports simultanés
                # ------------------------------------------------

                cur.execute(
                    "SELECT pg_advisory_xact_lock(hashtext(%s))",
                    ("IGNIS_PSI25_IMPORT",)
                )

                # ------------------------------------------------
                # 2. Vérifier les expériences ZARM existantes
                # ------------------------------------------------

                cur.execute("""
                    SELECT COUNT(*)
                    FROM investigations i
                    JOIN experiments e
                        ON e.investigation_id = i.id
                    WHERE i.code = 'ZARM-FLARE'
                """)

                zarm_before = cur.fetchone()[0]

                if zarm_before != EXPECTED_ZARM:
                    raise ValueError(
                        f"ZARM contient {zarm_before} expériences "
                        f"au lieu de {EXPECTED_ZARM}. "
                        "Importation annulée."
                    )

                # ------------------------------------------------
                # 3. Vérifier que PSI-25 n'existe pas
                # ------------------------------------------------

                cur.execute("""
                    SELECT id
                    FROM investigations
                    WHERE code = %s
                """, (INVESTIGATION_CODE,))

                if cur.fetchone():
                    raise ValueError(
                        "PSI-25 existe déjà dans Neon. "
                        "Importation annulée pour éviter "
                        "les doublons."
                    )

                # ------------------------------------------------
                # 4. Créer l'investigation NASA
                # ------------------------------------------------

                # PostgreSQL génère automatiquement l'ID.

                cur.execute("""
                    INSERT INTO investigations (
                        code,
                        title,
                        description
                    )
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (
                    INVESTIGATION_CODE,
                    "NASA PSI-25 — BASS-II",
                    "Données expérimentales BASS-II "
                    "issues du tableau NASA PSI-25."
                ))

                investigation_id = cur.fetchone()[0]

                print(
                    "Investigation PSI-25 créée :",
                    investigation_id
                )

                # ------------------------------------------------
                # 5. Enregistrer la source NASA
                # ------------------------------------------------

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
                        sha256
                    )
                    VALUES (
                        %s,
                        NULL,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    RETURNING id
                """, (
                    investigation_id,
                    CSV_FILE.name,
                    "csv",
                    relative_path,
                    digest
                ))

                source_id = cur.fetchone()[0]

                print(
                    "Source NASA enregistrée :",
                    source_id
                )

                # ------------------------------------------------
                # 6. Insérer les expériences et mesures
                # ------------------------------------------------

                inserted_experiments = 0
                inserted_measurements = 0

                for experiment in experiments:

                    cur.execute("""
                        INSERT INTO experiments (
                            investigation_id,
                            experiment_code,
                            fuel_material,
                            oxygen_percent
                        )
                        VALUES (%s, %s, %s, %s)
                        RETURNING id
                    """, (
                        investigation_id,
                        experiment["code"],
                        experiment["fuel"],
                        experiment["oxygen"]
                    ))

                    experiment_id = cur.fetchone()[0]
                    inserted_experiments += 1

                    for measurement in experiment["measurements"]:

                        cur.execute("""
                            INSERT INTO measurements (
                                experiment_id,
                                source_id,
                                variable_name,
                                value,
                                unit,
                                source_row
                            )
                            VALUES (
                                %s, %s, %s, %s, %s, %s
                            )
                        """, (
                            experiment_id,
                            source_id,
                            measurement["variable"],
                            measurement["value"],
                            measurement["unit"],
                            experiment["source_row"]
                        ))

                        inserted_measurements += 1

                # ------------------------------------------------
                # 7. Vérification NASA
                # ------------------------------------------------

                cur.execute("""
                    SELECT COUNT(*)
                    FROM experiments
                    WHERE investigation_id = %s
                """, (investigation_id,))

                nasa_count = cur.fetchone()[0]

                cur.execute("""
                    SELECT COUNT(*)
                    FROM measurements m
                    JOIN experiments e
                        ON e.id = m.experiment_id
                    WHERE e.investigation_id = %s
                """, (investigation_id,))

                nasa_measurements = cur.fetchone()[0]

                # ------------------------------------------------
                # 8. Vérification ZARM après import
                # ------------------------------------------------

                cur.execute("""
                    SELECT COUNT(*)
                    FROM investigations i
                    JOIN experiments e
                        ON e.investigation_id = i.id
                    WHERE i.code = 'ZARM-FLARE'
                """)

                zarm_after = cur.fetchone()[0]

                # ------------------------------------------------
                # 9. Contrôles de sécurité avant COMMIT
                # ------------------------------------------------

                if nasa_count != EXPECTED_EXPERIMENTS:
                    raise ValueError(
                        "Nombre d'expériences NASA incorrect"
                    )

                if nasa_measurements != EXPECTED_MEASUREMENTS:
                    raise ValueError(
                        "Nombre de mesures NASA incorrect"
                    )

                if inserted_experiments != EXPECTED_EXPERIMENTS:
                    raise ValueError(
                        "Insertion des expériences incomplète"
                    )

                if inserted_measurements != EXPECTED_MEASUREMENTS:
                    raise ValueError(
                        "Insertion des mesures incomplète"
                    )

                if zarm_after != zarm_before:
                    raise ValueError(
                        "Modification détectée du nombre "
                        "d'expériences ZARM"
                    )

        # Fin de la transaction : COMMIT si aucune erreur

    print("\n====================================")
    print("IMPORTATION NASA PSI-25 RÉUSSIE")
    print("====================================")
    print("Investigation : PSI-25")
    print("Expériences NASA :", nasa_count)
    print("Mesures NASA :", nasa_measurements)
    print("ZARM avant :", zarm_before)
    print("ZARM après :", zarm_after)
    print("Transaction : COMMIT")


# ============================================================
# INTERFACE CLI
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description="Import NASA PSI-25 vers Neon PostgreSQL"
    )

    mode = parser.add_mutually_exclusive_group()

    mode.add_argument(
        "--dry-run",
        action="store_true",
        help="Valider les données sans modifier Neon"
    )

    mode.add_argument(
        "--apply",
        action="store_true",
        help="Importer réellement dans Neon"
    )

    args = parser.parse_args()

    experiments, counters, skipped, digest = prepare_data()

    print("\n=== NASA PSI-25 / BASS-II ===")
    print("SHA-256 :", digest)
    print("Essais :", len(experiments))
    print("Mesures :", sum(counters.values()))
    print(
        "Valeurs exclues des mesures :",
        sum(skipped.values())
    )

    if not args.apply:

        print("\nMODE DRY-RUN")
        print("Aucune connexion Neon et aucune écriture.")

        for variable, count in counters.items():
            print(f"{variable}: {count}")

        for (variable, raw), count in sorted(skipped.items()):
            print(f"Exclu {variable}: {raw!r} x {count}")

        return

    print("\nMODE APPLY : importation dans Neon")

    apply_import(experiments, digest)


if __name__ == "__main__":
    main()
