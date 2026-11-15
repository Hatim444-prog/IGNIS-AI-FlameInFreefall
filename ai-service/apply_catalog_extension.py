from pathlib import Path
from dotenv import load_dotenv
import psycopg
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

sql = Path(__file__).resolve().parent.parent.joinpath(
    "catalog_extension.sql"
).read_text(encoding="utf-8")

with psycopg.connect(
    os.environ["DATABASE_URL"], sslmode="require", connect_timeout=15
) as conn:
    conn.execute(sql)
    print("catalog_extension.sql applique")

    cols = conn.execute(
        """
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'measurements'
          AND column_name IN ('text_value','qualifier','page_number')
        ORDER BY 1
        """
    ).fetchall()
    for (name,) in cols:
        print(" -", name)

    count = conn.execute(
        "SELECT COUNT(*) FROM variable_catalog"
    ).fetchone()[0]
    print("variable_catalog:", count, "variables")
