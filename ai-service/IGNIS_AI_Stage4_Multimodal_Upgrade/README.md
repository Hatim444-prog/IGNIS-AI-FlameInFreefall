# IGNIS AI Stage 4 — Multimodal RAG Upgrade

Adds **non-breaking** routes to your existing `C:\IGNIS_AI\ai-service`.

## Before you start

Your previous components must already work:
- `main.py`, `vision_api.py`, `hybrid_api.py`
- Docker PostgreSQL `ignis_db` on Windows port `5433` with `vector` extension
- Existing tables: `sources`, `experiments`, `measurements`, `document_chunks`
- Ollama: `llama3.1:8b`, `gemma4:e4b`, `nomic-embed-text`

**IMPORTANT:** All uploads remain *unverified* and all AI-generated visual notes remain *pending_review*. Never treat inferred flame features as measured scientific quantities.

## Install in 4 steps

1. Copy `stage4_multimodal_api.py` to `C:\IGNIS_AI\ai-service`. Copy `stage4_schema.sql` to `C:\IGNIS_AI`.
2. Run the SQL migration from PowerShell (this is NOT inside psql):

   ```powershell
   cd C:\IGNIS_AI
   Get-Content .\stage4_schema.sql | docker exec -i ignis-postgres psql -v ON_ERROR_STOP=1 -U ignis -d ignis_db
   ```

3. Append two lines at the bottom of your existing `C:\IGNIS_AI\ai-service\main.py`:

   ```python
   from stage4_multimodal_api import build_stage4_router
   app.include_router(build_stage4_router(search_documents))
   ```

4. Restart API:

   ```powershell
   cd C:\IGNIS_AI\ai-service
   .\.venv\Scripts\Activate.ps1
   python -m py_compile main.py stage4_multimodal_api.py
   uvicorn main:app --reload --port 8001
   ```

Visit `http://127.0.0.1:8001/docs`.

## New endpoints

- `POST /ai/vision/store-image`: Upload JPEG/PNG, optionally `experiment_code` and `source_url`. Gemma describes it; Nomic indexes its description; the original file and unverified reference are stored.
- `POST /ai/vision/store-video`: Upload MP4 ≤30 MB. Reuses your existing OpenCV video processor and stores the summary with timestamps.
- `GET /ai/vision/search?q=flame+shape`: semantic search over stored visual descriptions.
- `POST /ai/ask-multimodal`: Llama answers using papers + visual descriptions + experiment-linked numbers.

Example request to `/ai/ask-multimodal`:

```json
{
  "question": "What do the visual observations suggest, and what measured data is actually available?",
  "experiment_codes": [],
  "top_k_papers": 3,
  "top_k_visual": 3
}
```

Add an actual `experiment_code` only when the visual file or measurement is known to belong to that experiment. Blank codes mean no automatic numeric rows are injected. Citations `[P#]`, `[V#]`, `[M#]` distinguish documents, AI visual descriptions and measured numbers.

## Verify PostgreSQL

```powershell
docker exec -it ignis-postgres psql -U ignis -d ignis_db -c "SELECT COUNT(*) AS visual_records FROM visual_observations;"
```

## Security / scientific validation

- **Development-only endpoints:** protect uploads with authentication before exposing them to the internet.
- `source_url` is stored as user-supplied provenance; it is **not** automatically verified. Never cite it as NASA-confirmed without review.
- An uploaded `experiment_code` represents an unverified association even when the code exists in your database.
- Unreviewed image descriptions are not calibrated temperatures, speeds, flammability thresholds, or suppressant effectiveness.
- Large raw media are saved under `data/visual/`, not in PostgreSQL.
- The RTX 4060 may switch between the two LLMs; keeping Gemma and Llama loaded simultaneously may cause memory pressure.
