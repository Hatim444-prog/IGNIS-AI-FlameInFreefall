
import json
import os
import hashlib
from pathlib import Path
from collections import defaultdict

import numpy as np
from dotenv import load_dotenv

from db_config import connect_db

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT.parent / ".env")

INDEX = ROOT / "data" / "index.json"
PDF_DIR = ROOT / "data" / "pdfs"

# Read existing Stage 1 embeddings
records = json.loads(INDEX.read_text(encoding="utf-8"))

if not records:
    raise RuntimeError("The RAG index is empty.")

groups = defaultdict(list)

for record in records:
    vector = np.asarray(record["embedding"], dtype=np.float32)

    if vector.shape != (768,) or not np.isfinite(vector).all():
        raise ValueError("Invalid Nomic embedding dimensions or values")

    groups[Path(record["source"]).name].append(
        (record, vector)
    )

with connect_db(row_factory=None) as conn:

    with conn.cursor() as cursor:
        for filename, chunks in groups.items():

            pdf = PDF_DIR / filename

            if not pdf.is_file():
                raise FileNotFoundError(
                    f"Original PDF not found: {pdf}"
                )

            checksum = hashlib.sha256(
                pdf.read_bytes()
            ).hexdigest()

            local_path = f"data/pdfs/{filename}"

            cursor.execute("""
                SELECT id FROM sources
                WHERE filename = %s AND local_path = %s
                ORDER BY id LIMIT 1
            """, (filename, local_path))

            existing = cursor.fetchone()

            if existing:
                source_id = existing[0]
                cursor.execute("""
                    UPDATE sources
                    SET sha256 = %s
                    WHERE id = %s
                """, (checksum, source_id))
            else:
                cursor.execute("""
                    INSERT INTO sources
                    (filename, file_type, local_path, sha256)
                    VALUES (%s, 'pdf', %s, %s)
                    RETURNING id
                """, (filename, local_path, checksum))

                source_id = cursor.fetchone()[0]

            for index, (record, vector) in enumerate(chunks):
                cursor.execute("""
                    INSERT INTO document_chunks
                    (source_id, chunk_index,
                     page_number, content, embedding)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (source_id, chunk_index)
                    DO UPDATE SET
                        page_number = EXCLUDED.page_number,
                        content = EXCLUDED.content,
                        embedding = EXCLUDED.embedding
                """, (
                    source_id,
                    index,
                    record["page"],
                    record["text"],
                    vector
                ))

            print(f"Imported {len(chunks)} chunks from {filename}")

print("Migration completed successfully!")
