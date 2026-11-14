
import os
from pathlib import Path

from dotenv import load_dotenv

from db_config import connect_db

# Load existing database password
ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT.parent / ".env")


def get_connection():
    return connect_db()


def get_available_measurements():
    """Find available scientific variables and statistics."""

    query = """
        SELECT
            m.variable_name,
            m.unit,
            COUNT(*) AS total,
            MIN(m.value) AS minimum,
            MAX(m.value) AS maximum,
            AVG(m.value) AS average
        FROM measurements m
        JOIN experiments e
            ON e.id = m.experiment_id
        WHERE e.experiment_code LIKE 'ZARM-%'
        GROUP BY m.variable_name, m.unit
        ORDER BY m.variable_name
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()


def get_experiment_data(experiment_code):
    """Retrieve actual measurements and source references."""

    query = """
        SELECT
            e.experiment_code,
            e.oxygen_percent,
            e.pressure_pa,
            e.airflow_m_s,
            m.variable_name,
            m.value,
            m.unit,
            m.uncertainty,
            m.source_row,
            s.filename,
            s.source_url
        FROM experiments e
        JOIN measurements m
            ON m.experiment_id = e.id
        JOIN sources s
            ON s.id = m.source_id
        WHERE e.experiment_code = %s
        ORDER BY m.variable_name
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (experiment_code,))
            return cur.fetchall()


if __name__ == "__main__":
    variables = get_available_measurements()

    print("\n=== AVAILABLE SCIENTIFIC VARIABLES ===")

    for variable in variables:
        print(
            f"{variable['variable_name']} "
            f"({variable['unit']}) | "
            f"Count: {variable['total']} | "
            f"Min: {variable['minimum']} | "
            f"Max: {variable['maximum']}"
        )

    print("\nDatabase retrieval successful!")
