
import json
from pathlib import Path

import pymupdf
import ollama

PDF_DIR = Path("data/pdfs")
INDEX_FILE = Path("data/index.json")
EMBED_MODEL = "nomic-embed-text"


def split_text(text, chunk_size=1000, overlap=150):
    chunks = []
    step = chunk_size - overlap

    for start in range(0, len(text), step):
        chunk = text[start:start + chunk_size].strip()
        if chunk:
            chunks.append(chunk)

    return chunks


def main():
    records = []

    pdf_files = sorted(PDF_DIR.glob("*.pdf"))

    if not pdf_files:
        print("No PDFs found in data/pdfs")
        return

    for pdf_path in pdf_files:
        print(f"Reading {pdf_path.name}")

        with pymupdf.open(pdf_path) as document:
            for page_number, page in enumerate(document, start=1):
                text = page.get_text("text", sort=True)

                for chunk in split_text(text):
                    records.append({
                        "source": pdf_path.name,
                        "page": page_number,
                        "text": chunk
                    })

    if not records:
        print("No selectable text found in PDFs.")
        return

    print(f"Generating embeddings for {len(records)} chunks...")

    # Batch processing avoids repeated model calls.
    for start in range(0, len(records), 16):
        batch = records[start:start + 16]

        response = ollama.embed(
            model=EMBED_MODEL,
            input=[r["text"] for r in batch]
        )

        for record, vector in zip(batch, response.embeddings):
            record["embedding"] = list(vector)

        print(f"Embedded {min(start + 16, len(records))}/{len(records)}")

    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    INDEX_FILE.write_text(
        json.dumps(records),
        encoding="utf-8"
    )

    print(f"Successfully indexed {len(records)} chunks.")


if __name__ == "__main__":
    main()
