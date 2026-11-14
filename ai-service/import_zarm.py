"""Import the official Zenodo ZARM flame-spread index into IGNIS AI PostgreSQL.

Requires the IGNIS schema from Stage 2, including the additional experiment
columns added in Step 7.2. Designed to be safe to rerun.
"""
from __future__ import annotations

import csv
import hashlib
from datetime import date
from pathlib import Path

from dotenv import load_dotenv

from db_config import connect_db

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "data" / "raw" / "zarm_microgravity" / "index.csv"
load_dotenv(ROOT.parent / ".env")

ZENODO_URL = "https://zenodo.org/records/18479713"
SOURCE_URL = f"{ZENODO_URL}/files/index.csv?download=1"
# Checks the file against the checksum published by Zenodo for record 18479713.
EXPECTED_MD5 = "ee54b6e41b6b0a920e68b73e0611495e"

REQUIRED_COLUMNS = {
    "Experiment [ID]", "Date [yyyy-mm-dd]",
    "Oxygen [mole/mole]", "Oxygen (std.) [mole/mole]",
    "Pressure [kPa]", "Pressure (std.) [kPa]",
    "Flow Velocity [mm/s]", "Flow Velocity (std.) [mm/s]",
    "Flow Direction [opposed/concurrent]",
    "Gaps [Sequence]", "Filler [Material]", "Thickness [mm]",
    "PixelRatio [mm/px]", "Propagation Rate [mm/s]",
    "Propagation Rate (std.) [mm/s]", "IR Data File [Path]",
}


def optional_float(row: dict[str, str], key: str) -> float | None:
    raw = (row.get(key) or "").strip()
    if not raw:
        return None
    result = float(raw)
    if not (-float("inf") < result < float("inf")):
        raise ValueError(f"Non-finite value for {key}: {raw!r}")
    return result


def optional_text(row: dict[str, str], key: str) -> str | None:
    value = (row.get(key) or "").strip()
    return value if value else None


def measurement(cur, experiment_id: int, source_id: int,
                variable: str, value: float | None, unit: str,
                uncertainty: float | None, csv_line: int) -> bool:
    if value is None:
        return False
    cur.execute(
        """
        INSERT INTO measurements
          (experiment_id, source_id, variable_name, value, unit,
           uncertainty, source_row)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (experiment_id, source_id, variable, value, unit,
         uncertainty, csv_line),
    )
    return True


def main() -> None:
    if not CSV_PATH.is_file():
        raise FileNotFoundError(f"Expected original ZARM CSV at: {CSV_PATH}")

    raw = CSV_PATH.read_bytes()
    md5 = hashlib.md5(raw).hexdigest()
    if md5 != EXPECTED_MD5:
        raise ValueError(
            "The CSV checksum differs from the published Zenodo file. "
            "Verify you downloaded index.csv for record 18479713. "
            f"Expected MD5 {EXPECTED_MD5}, received {md5}."
        )
    sha256 = hashlib.sha256(raw).hexdigest()

    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Missing CSV columns: {sorted(missing)}")
        rows = list(reader)

    if not rows:
        raise ValueError("CSV is empty")
    if any(not (r.get("Experiment [ID]") or "").strip() for r in rows):
        raise ValueError("At least one experiment has no ID")
    ids = [(r["Experiment [ID]"] or "").strip() for r in rows]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate experiment IDs in CSV")

    imported = 0
    measurement_count = 0
    propagation_count = 0
    with connect_db(register_pgvector=False, row_factory=None) as conn:
        # All changes are committed together; failures roll back the import.
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO investigations (code, title, objective, description)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (code) DO UPDATE SET
                    title = EXCLUDED.title,
                    objective = EXCLUDED.objective,
                    description = EXCLUDED.description
                RETURNING id
                """,
                (
                    "ZARM-FLARE", "ZARM Flame Spread over Discrete Fuels",
                    "Study flame spread and heat transfer in microgravity "
                    "over PMMA strips and metal barriers.",
                    "EXTERNAL RESEARCH, NOT NASA PSI. Conducted at ZARM "
                    "(University of Bremen); original public dataset at " + ZENODO_URL,
                ),
            )
            investigation_id = cur.fetchone()[0]

            local_path = "data/raw/zarm_microgravity/index.csv"
            cur.execute(
                """
                SELECT id FROM sources
                WHERE investigation_id = %s AND source_url = %s
                ORDER BY id LIMIT 1
                """,
                (investigation_id, SOURCE_URL),
            )
            source = cur.fetchone()
            if source:
                source_id = source[0]
                cur.execute(
                    """
                    UPDATE sources SET filename = 'index.csv', file_type = 'csv',
                      local_path = %s, sha256 = %s,
                      verification_status = 'verified'
                    WHERE id = %s
                    """,
                    (local_path, sha256, source_id),
                )
            else:
                cur.execute(
                    """
                    INSERT INTO sources
                      (investigation_id, filename, file_type, source_url,
                       local_path, sha256, verification_status)
                    VALUES (%s, 'index.csv', 'csv', %s, %s, %s, 'verified')
                    RETURNING id
                    """,
                    (investigation_id, SOURCE_URL, local_path, sha256),
                )
                source_id = cur.fetchone()[0]

            for csv_line, row in enumerate(rows, start=2):
                code = f"ZARM-{row['Experiment [ID]'].strip()}"
                oxygen_fraction = optional_float(row, "Oxygen [mole/mole]")
                oxygen_sd = optional_float(row, "Oxygen (std.) [mole/mole]")
                pressure_kpa = optional_float(row, "Pressure [kPa]")
                pressure_sd = optional_float(row, "Pressure (std.) [kPa]")
                airflow_mm_s = optional_float(row, "Flow Velocity [mm/s]")
                airflow_sd = optional_float(row, "Flow Velocity (std.) [mm/s]")
                propagation_mm_s = optional_float(row, "Propagation Rate [mm/s]")
                propagation_sd = optional_float(row, "Propagation Rate (std.) [mm/s]")

                if oxygen_fraction is not None and not 0 <= oxygen_fraction <= 1:
                    raise ValueError(f"Bad oxygen fraction in CSV row {csv_line}")
                if pressure_kpa is not None and pressure_kpa <= 0:
                    raise ValueError(f"Bad pressure in CSV row {csv_line}")

                when = optional_text(row, "Date [yyyy-mm-dd]")
                experiment_date = date.fromisoformat(when) if when else None

                cur.execute(
                    """
                    INSERT INTO experiments
                      (investigation_id, experiment_code, fuel_material,
                       fuel_phase, oxygen_percent, pressure_pa, airflow_m_s,
                       gravity_condition, research_focus, experiment_date,
                       flow_direction, gaps_sequence, filler_material,
                       sample_thickness_mm, pixel_ratio_mm_px, ir_data_file)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (investigation_id, experiment_code)
                    DO UPDATE SET
                      fuel_material = EXCLUDED.fuel_material,
                      fuel_phase = EXCLUDED.fuel_phase,
                      oxygen_percent = EXCLUDED.oxygen_percent,
                      pressure_pa = EXCLUDED.pressure_pa,
                      airflow_m_s = EXCLUDED.airflow_m_s,
                      gravity_condition = EXCLUDED.gravity_condition,
                      research_focus = EXCLUDED.research_focus,
                      experiment_date = EXCLUDED.experiment_date,
                      flow_direction = EXCLUDED.flow_direction,
                      gaps_sequence = EXCLUDED.gaps_sequence,
                      filler_material = EXCLUDED.filler_material,
                      sample_thickness_mm = EXCLUDED.sample_thickness_mm,
                      pixel_ratio_mm_px = EXCLUDED.pixel_ratio_mm_px,
                      ir_data_file = EXCLUDED.ir_data_file
                    RETURNING id
                    """,
                    (
                        investigation_id, code, "PMMA", "solid",
                        oxygen_fraction * 100 if oxygen_fraction is not None else None,
                        pressure_kpa * 1000 if pressure_kpa is not None else None,
                        airflow_mm_s / 1000 if airflow_mm_s is not None else None,
                        "microgravity", "flame_spread", experiment_date,
                        optional_text(row, "Flow Direction [opposed/concurrent]"),
                        optional_text(row, "Gaps [Sequence]"),
                        optional_text(row, "Filler [Material]"),
                        optional_float(row, "Thickness [mm]"),
                        optional_float(row, "PixelRatio [mm/px]"),
                        optional_text(row, "IR Data File [Path]"),
                    ),
                )
                experiment_id = cur.fetchone()[0]

                # Replacing this file's measurements makes repeat imports idempotent.
                cur.execute(
                    "DELETE FROM measurements WHERE experiment_id = %s AND source_id = %s",
                    (experiment_id, source_id),
                )
                specs = [
                    ("oxygen_concentration", oxygen_fraction * 100 if oxygen_fraction is not None else None,
                     "%", oxygen_sd * 100 if oxygen_sd is not None else None),
                    ("pressure", pressure_kpa * 1000 if pressure_kpa is not None else None,
                     "Pa", pressure_sd * 1000 if pressure_sd is not None else None),
                    ("airflow_velocity", airflow_mm_s / 1000 if airflow_mm_s is not None else None,
                     "m/s", airflow_sd / 1000 if airflow_sd is not None else None),
                    ("propagation_rate", propagation_mm_s, "mm/s", propagation_sd),
                ]
                for name, value, unit, uncertainty in specs:
                    if measurement(cur, experiment_id, source_id, name, value,
                                   unit, uncertainty, csv_line):
                        measurement_count += 1
                if propagation_mm_s is not None:
                    propagation_count += 1
                imported += 1

    print(f"Imported/updated {imported} ZARM experiments")
    print(f"Stored {measurement_count} numerical values (including test conditions)")
    print(f"Experiments with reported propagation rates: {propagation_count}")
    print("Source: ZARM/University of Bremen via Zenodo — NOT NASA PSI")
    print("Import completed successfully!")


if __name__ == "__main__":
    main()
