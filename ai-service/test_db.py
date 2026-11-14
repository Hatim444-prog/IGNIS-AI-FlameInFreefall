
from db_config import connect_db, database_display_name

try:
    with connect_db(row_factory=None) as conn:
        print("Connected to PostgreSQL!")

        version = conn.execute(
            "SELECT current_database(), current_user"
        ).fetchone()

        print("Database:", version[0])
        print("User:", version[1])
        print("Configured DB name:", database_display_name())

        extension = conn.execute(
            "SELECT extversion FROM pg_extension "
            "WHERE extname = 'vector'"
        ).fetchone()

        print(
            "pgvector version:",
            extension[0] if extension else "Not installed"
        )

        tables = conn.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """).fetchall()

        print("\nAvailable tables:")
        for table in tables:
            print(" -", table[0])

except Exception as error:
    print("Database connection failed!")
    print(error)
