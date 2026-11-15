"""Index prepared research passages and any additional PDFs in PostgreSQL."""
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path

import numpy as np
import ollama
import pymupdf

from db_config import connect_db
from ingest import split_text
from llm_client import OLLAMA_EMBED

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"


def load_documents(tessdata):
    documents = defaultdict(list)
    seen = {}
    for path in sorted((DATA / "processed").glob("*_chunks.jsonl")):
        if path.name == "NASA_All_Data_chunks.jsonl":
            continue  # Derived by merge_nasa_data.py from the individual files.
        for line in path.read_text(encoding="utf-8-sig").splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            name = record["source"]
            if Path(name).name != name or not record["text"].strip():
                raise ValueError(f"Invalid passage in {path.name}")
            if record["id"] in seen:
                if seen[record["id"]] != record:
                    raise ValueError(f"Conflicting passage {record['id']}")
                continue
            seen[record["id"]] = record
            folder = "pdfs" if name.lower().endswith(".pdf") else "raw"
            original = DATA / folder / name
            if not original.is_file():
                raise FileNotFoundError(original)
            documents[original].append(record)

    for pdf in sorted((DATA / "pdfs").glob("*.pdf")):
        if pdf in documents:
            continue
        with pymupdf.open(pdf) as doc:
            for number, page in enumerate(doc, 1):
                text = page.get_text("text", sort=True)
                if not text.strip() and page.get_images():
                    text = page.get_textpage_ocr(
                        language="eng", dpi=300, full=True, tessdata=tessdata
                    ).extractText()
                for chunk in split_text(text):
                    documents[pdf].append({"page": number, "text": chunk})
        if not documents[pdf]:
            raise ValueError(f"No readable text in {pdf.name}")
    return documents


def sync_document(conn, original, records):
    local_path = original.relative_to(ROOT).as_posix()
    checksum = hashlib.sha256(original.read_bytes()).hexdigest()
    urls = {r["source_url"] for r in records if r.get("source_url")}
    if len(urls) > 1:
        raise ValueError(f"Conflicting source URLs for {original.name}")
    source_url = next(iter(urls), None)
    with conn.transaction():
        conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (local_path,))
        src = conn.execute("SELECT id FROM sources WHERE local_path=%s ORDER BY id LIMIT 1",
                           (local_path,)).fetchone()
        if src:
            source_id = src["id"]
            conn.execute("UPDATE sources SET sha256=%s, source_url=COALESCE(%s,source_url) WHERE id=%s",
                         (checksum, source_url, source_id))
        else:
            source_id = conn.execute(
                """INSERT INTO sources(filename,file_type,local_path,sha256,source_url)
                   VALUES (%s,%s,%s,%s,%s) RETURNING id""",
                (original.name, original.suffix[1:].lower(), local_path, checksum, source_url)
            ).fetchone()["id"]
        previous = {r["chunk_index"]: (r["page_number"], r["content"])
                    for r in conn.execute(
                        """SELECT chunk_index,page_number,content FROM document_chunks
                           WHERE source_id=%s AND embedding IS NOT NULL""", (source_id,))}
        changed = [(i,r) for i,r in enumerate(records)
                   if previous.get(i) != (r["page"], r["text"])]
        for start in range(0, len(changed), 16):
            batch = changed[start:start+16]
            vectors = ollama.embed(model=OLLAMA_EMBED, input=[
                "search_document: " + r["text"] for _,r in batch
            ]).embeddings
            rows = []
            for (i,r), vector in zip(batch,vectors,strict=True):
                vector = np.asarray(vector,dtype=np.float32)
                if vector.shape != (768,) or not np.isfinite(vector).all():
                    raise ValueError("Invalid document embedding")
                rows.append((source_id,i,r["page"],r["text"],vector))
            with conn.cursor() as cur:
                cur.executemany(
                    """INSERT INTO document_chunks(source_id,chunk_index,page_number,content,embedding)
                       VALUES (%s,%s,%s,%s,%s) ON CONFLICT(source_id,chunk_index) DO UPDATE SET
                       page_number=EXCLUDED.page_number,content=EXCLUDED.content,embedding=EXCLUDED.embedding""",
                    rows)
        conn.execute("DELETE FROM document_chunks WHERE source_id=%s AND chunk_index >= %s",
                     (source_id,len(records)))
    print(f"{original.name}: {len(records)} passages, {len(changed)} embedded", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tessdata", help="Tesseract language data directory for scanned PDFs")
    documents = load_documents(parser.parse_args().tessdata)
    with connect_db(autocommit=True) as connection:
        for source, passages in documents.items():
            sync_document(connection, source, passages)
