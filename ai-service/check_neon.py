
from pathlib import Path
from dotenv import load_dotenv
import psycopg
import os

# Charger le .env situé à la racine du projet
ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise SystemExit("DATABASE_URL introuvable")

try:
    with psycopg.connect(
        database_url,
        connect_timeout=10,
        sslmode="require"
    ) as conn:

        with conn.cursor() as cur:
            cur.execute("SELECT current_database(), current_user")
            database, user = cur.fetchone()

            print("=== CONNEXION NEON ===")
            print("Connexion : OK")
            print("Database :", database)
            print("Utilisateur : [masqué]")

            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)

            tables = [row[0] for row in cur.fetchall()]

            print("\n=== TABLES ===")
            for table in tables:
                print("-", table)

            if "investigations" in tables and "experiments" in tables:
                cur.execute("""
                    SELECT i.code, COUNT(e.id)
                    FROM investigations i
                    LEFT JOIN experiments e
                        ON e.investigation_id = i.id
                    GROUP BY i.code
                    ORDER BY i.code
                """)

                print("\n=== EXPÉRIENCES PAR INVESTIGATION ===")
                for code, count in cur.fetchall():
                    print(f"{code}: {count}")

except Exception as e:
    print("Erreur de connexion ou de lecture :", type(e).__name__)
    print("Vérifie DATABASE_URL, SSL et l'accès réseau.")
