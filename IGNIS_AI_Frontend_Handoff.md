# IGNIS AI — AI/backend handoff to frontend team

**Project:** NASA Space Apps Challenge 2026 — Flame in Freefall / IGNIS AI  
**As of:** November 10, 2026  
**Role implemented:** local AI service, document/structured-data retrieval, visual analysis, multimodal RAG, and mission-relevance API  
**Current environment:** Windows, `C:\IGNIS_AI`, Python virtual environment, Ollama, PostgreSQL/pgvector in Docker  
**API base (on AI host):** `http://127.0.0.1:8001`  
**Interactive API schema:** `http://127.0.0.1:8001/docs`  
**Machine-readable OpenAPI:** `http://127.0.0.1:8001/openapi.json`

> Important: `127.0.0.1` is the machine *running the browser/API*. On another developer's laptop it does **not** point to the IGNIS AI host. Coordinate a secure reachable backend URL/proxy with the backend engineer. Do not expose the upload/inference endpoints publicly before authentication, access controls, quotas, and network restrictions are in place.

## 1. Project goal

IGNIS AI helps researchers and space-safety engineers find relevant scientific combustion evidence. Users can explore experiments, ask research questions, compare experimental measurements, analyze combustion photographs/videos, and rank available evidence for a proposed spacecraft/lunar/Mars scenario. It is a **research decision-support prototype**, not a flight-certified fire-safety system.

## 2. Architecture

```text
Next.js/TypeScript frontend  <--HTTP/JSON or multipart--> FastAPI on port 8001
                                                          |
                               +--------------------------+-------------------+
                               |                          |                   |
                           Ollama local              PostgreSQL 17       Media folder
                       llama3.1:8b (answers)       + pgvector          data/visual/
                       gemma4:e4b (vision)         structured rows     original media
                       nomic-embed-text             vectors 768D
                               |
                           PDF/CSV/Images/MP4 ingestion & retrieval
```

The AI service handles retrieval/inference. All numerical experiments and statistics must be sourced from structured data and Python/SQL; LLM output is explanatory and may require human review. NASA research documents and *external ZARM* data must not be merged or mislabeled.

## 3. Development stages already implemented

1. **Stage 1 — PDF RAG:** research PDF ingestion, chunking, Nomic embeddings, pgvector cosine search, Llama evidence-grounded Q&A with document and page references. Existing route `/ai/ask`.
2. **Stage 2 — Scientific/Hybrid RAG:** PostgreSQL schema; 31 ZARM flame-spread experiment records imported from a Zenodo data source; variable listing, experiment listing, numeric comparison, and hybrid PDF+measurement Q&A. The imported ZARM data is **not NASA PSI data**.
3. **Stage 3 — Vision:** Gemma qualitative analysis of JPEG/PNG images; OpenCV samples up to 4 frames from MP4 and asks Gemma for observable changes. Raw Stage 3 endpoints do *not* persist media.
4. **Stage 4 — Multimodal:** `visual_observations` table and vector index; store original image/video under `data/visual/`; store AI-generated descriptions and embeddings; retrieve visual observations semantically; multimodal Llama answers with distinct document/visual/measurement citations.
5. **Stage 5 — Mission Advisor:** deterministic Python/SQL retrieval and scoring of relevant investigations for mission scenarios; outputs ranked NASA-linked metadata separately from external research, evidence coverage and limitations. It **does not call Llama** in the Stage 5 endpoint.

## 4. Important files and folders

```text
C:\IGNIS_AI\
├── .env                              # secrets: DO NOT share
├── docker-compose.yml                # PostgreSQL / persistent volume
├── stage4_schema.sql                 # visual_observations migration
└── ai-service\
    ├── .venv\                        # local venv: DO NOT share
    ├── main.py                       # FastAPI app + PDF RAG routes
    ├── ingest.py                     # PDF ingestion (as in local project)
    ├── migrate_vectors.py            # original JSON -> pgvector migration
    ├── import_zarm.py                # external experiment CSV import
    ├── scientific_data.py            # structured scientific data utilities
    ├── hybrid_api.py                 # Stage 2 endpoints
    ├── vision_api.py                 # Stage 3 image/video endpoints
    ├── stage4_multimodal_api.py      # Stage 4 persistence/multimodal endpoints
    ├── mission_advisor_api.py        # Stage 5 deterministic mission ranking
    └── data\
        ├── raw\zarm_microgravity\index.csv
        └── visual\                 # uploaded originals by SHA-256 filename
```

File tree reflects modules discussed/used in the local project; confirm it against the actual Git repository before handoff. Preserve Docker's `ignis_pgdata` volume and database backups.

## 5. Database model

| Table | Purpose |
|---|---|
| `investigations` | Research programs, investigation codes/titles/objectives, possible NASA links |
| `experiments` | Individual runs, experimental conditions (oxygen %, total pressure Pa, airflow m/s, gravity, material, etc.) |
| `sources` | Source files, URLs, local path, SHA-256 hash, verification status, experiment/investigation association |
| `measurements` | Actual numerical observations with variable name, value, unit, uncertainty, timestamp/row and source |
| `document_chunks` | Research PDF text chunks, page numbers and `vector(768)` embeddings |
| `visual_observations` | Gemma-generated media descriptions, timestamps, embeddings, review status, source/experiment associations |

Key relationship: one investigation has many experiments; each experiment may have measurements and sources; sources point to paper/media evidence; document chunks and visual observations support semantic search. The original media is stored on the AI host's filesystem, **not as public URL assets**.

Known ZARM variables: `airflow_velocity`, `oxygen_concentration`, `pressure`, `propagation_rate`. Use the `/ai/data/variables` API for units and actual available variables. The initial ZARM import has 31 experiment records; future imports may change totals.

## 6. API reference for frontend

All URLs below are relative to the **AI service base URL**. `GET` query fields belong in query string. `POST` expects JSON unless tagged `multipart/form-data`.

| Method | Endpoint | UI purpose | Important inputs / response |
|---|---|---|---|
| GET | `/ai/health` | AI service status | Confirm service responds (exact shape from OpenAPI) |
| POST | `/ai/ask` | PDF research chat | Existing Stage 1 research Q&A; inspect OpenAPI for the exact schema |
| GET | `/ai/data/variables` | Variable selector | `dataset_prefix` optional (`ZARM-` default); returns `variables[]` |
| GET | `/ai/data/experiments` | Experiment explorer | `dataset_prefix` and `limit` (1–100); returns `experiments[]` |
| POST | `/ai/data/compare` | Measurement comparison charts | JSON: `variable_name`, `experiment_codes[]`, optional `dataset_prefix`; returns `summary` and `measurements[]` |
| POST | `/ai/ask-hybrid` | Data-aware chat | JSON: `question`, `dataset_prefix`, `variable_name?`, `experiment_codes[]`, `max_experiments`, `top_k_papers`; returns `answer`, `numerical_summary`, `paper_sources`, `measurements`, `warnings` |
| POST | `/ai/vision/image` | Transient image analysis | Multipart `file` JPEG/PNG, `experiment_code?`; returns `description`; does **not** persist |
| POST | `/ai/vision/video` | Transient video analysis | Multipart `file` MP4, `experiment_code?`; returns `description`, sampled timestamps; does **not** persist |
| POST | `/ai/vision/store-image` | Upload/store analyzed image | Multipart `file`, `experiment_code?`, `source_url?`; returns `observation_id`, `description`, review status |
| POST | `/ai/vision/store-video` | Upload/store analyzed video | Multipart `file`, `experiment_code?`, `source_url?`; returns `observation_id`, `description`, review status |
| GET | `/ai/vision/search` | Visual evidence search | `q` and `limit` (1–10); returns `results[]` with AI descriptions/similarity/verification |
| POST | `/ai/ask-multimodal` | Combined research chat | JSON: `question`, `experiment_codes[]`, `top_k_papers`, `top_k_visual`; returns `answer`, `paper_sources`, `visual_sources`, `measurement_sources`, `limitations` |
| GET | `/ai/mission/health` | DB status for mission features | Returns status and number of investigations |
| POST | `/ai/mission/analyze` | Mission relevance ranking | JSON scenario fields; returns `scenario`, `weights`, `ranked_nasa_investigations`, `related_external_research`, `warnings`, `result_status`, `llm_generated: false` |

### 6A. Experiments and variables

```http
GET /ai/data/variables?dataset_prefix=ZARM-
GET /ai/data/experiments?dataset_prefix=ZARM-&limit=30
```

**Use the returned actual `experiment_code` values**. Do not generate placeholder codes or associate arbitrary images with unrelated experiments.

### 6B. Numeric comparison

```json
{
  "variable_name": "propagation_rate",
  "experiment_codes": ["REPLACE_WITH_REAL_CODE_1", "REPLACE_WITH_REAL_CODE_2"],
  "dataset_prefix": "ZARM-"
}
```

Response includes a `summary` of actual values (min/max/mean when units match) and `measurements[]`. Visualize units and provenance, and display the provided disclaimer.

### 6C. Hybrid AI chat

```json
{
  "question": "Summarize measured flame propagation rates and their limitations.",
  "dataset_prefix": "ZARM-",
  "variable_name": "propagation_rate",
  "experiment_codes": [],
  "max_experiments": 8,
  "top_k_papers": 4
}
```

`variable_name` is an *exact database identifier*. Select from `/ai/data/variables` if automatic detection fails. The numeric dataset and document retrieval are independent; do not assume measurements are from the same study as retrieved PDF passages unless evidence links them.

### 6D. Image upload

`POST /ai/vision/store-image` is `multipart/form-data` with `file` (JPEG/PNG max 10 MB) plus optional `experiment_code` and `source_url`. `POST /ai/vision/store-video` similarly accepts MP4 max 30 MB. Backend analyzes and persists; original file remains in the AI host folder `data/visual/`. The source URL is user supplied and is not verified by upload.

### 6E. Multimodal chat

```json
{
  "question": "Describe available flame images and compare them with the documented measurements. What remains uncertain?",
  "experiment_codes": [],
  "top_k_papers": 4,
  "top_k_visual": 3
}
```

With `experiment_codes: []`, no structured numeric rows are injected; add *verified* experiment codes to include them. Response citations: `P1` = paper passage, `V1` = AI-generated visual description, `M1` = structured measurement. Visually distinguish these evidence types in the UI.

### 6F. Mission Advisor

```json
{
  "environment": "pressurized_lunar_rover",
  "research_focus": "suppression",
  "oxygen_percent": 32,
  "pressure_psi": 12.2,
  "fuel_material": null,
  "max_results": 10,
  "include_external_research": true
}
```

Supported `environment` values: `pressurized_lunar_rover`, `lunar_habitat`, `mars_habitat`, `spacecraft`, `space_station`. Supported `research_focus`: `suppression`, `prevention`, `detection`.

Response highlights:

- `ranked_nasa_investigations[]` — investigation records with `nasa.gov`-linked metadata, **not automatically verified NASA experimental results**.
- `related_external_research[]` — research from other origins (including ZARM when relevant).
- `ranking_score` — heuristic relevance score (weighted dimensions), **NOT** fire-risk probability or suppression success chance.
- `relevance_score_observed` and `evidence_coverage_percent` — scored observed dimensions and fraction of dimensions present.
- `score_dimensions` — seven component scores (objective, fuel, oxygen, pressure, outcome, evidence, gravity).
- `limitations[]`, top-level `warnings[]` — must remain visible in the UI.
- `result_status` — may be `insufficient_nasa_evidence` even if the API succeeds; this is **not** HTTP failure.
- `llm_generated: false` — ranking engine is deterministic, not text-generation by Llama.

Mission weights: objective 25, fuel 15, oxygen 10, pressure 10, outcome 15, evidence 15, gravity 10. The heuristic has not been validated as a hazard prediction model.

## 7. Suggested frontend screens

1. **Overview dashboard**: service health, research counts, featured experiments, dataset provenance.
2. **Experiments explorer**: list experiments and filters; select one; show conditions, variables and provenance.
3. **Scientific measurements**: select real experiment codes and variables, compare rows and chart values with units/uncertainty.
4. **Research assistant**: prompt input plus tabs/indicators for PDF-only, hybrid, and multimodal evidence; show citations and warnings.
5. **Vision laboratory**: upload image/video, see qualitative description, optionally store; search saved visual observations.
6. **Mission Advisor**: validated scenario form, NASA/external result sections, transparent score breakdown, coverage and limitations.

## 8. Running the service (AI host)

Start Docker Desktop and Ollama; ensure the local model names are installed:

```powershell
ollama list
docker compose -f C:\IGNIS_AI\docker-compose.yml up -d
docker compose -f C:\IGNIS_AI\docker-compose.yml ps
```

In the AI service terminal:

```powershell
cd C:\IGNIS_AI\ai-service
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8001
```

Smoke tests from the **AI host**:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/ai/health
Invoke-RestMethod http://127.0.0.1:8001/ai/mission/health
Test-NetConnection 127.0.0.1 -Port 5433
```

PostgreSQL expected binding: `127.0.0.1:5433->5432/tcp`, database `ignis_db`, user `ignis`, container `ignis-postgres`, persistent Docker volume `ignis_pgdata`. `POSTGRES_PASSWORD` is in root `.env`; **never send this secret to the frontend team or commit it to GitHub**.

### Export exact API contract for the frontend

From the AI host (while the app is importable in its venv):

```powershell
cd C:\IGNIS_AI\ai-service
python -c "import json, main; open('ignis_openapi.json', 'w', encoding='utf-8').write(json.dumps(main.app.openapi(), indent=2, ensure_ascii=False))"
```

Send `ignis_openapi.json` to the frontend team; it describes the **actual installed version's** request and response schemas, rather than relying solely on this summary. Alternatively share `/openapi.json` from a reachable backend.

## 9. Integration and production gaps / things not to overclaim

- **Network visibility:** default Uvicorn URL binds localhost. Other team members need a secure reachable API deployment, VPN/reverse proxy, or backend team–managed API proxy. `localhost` on their machines will not work.
- **Security:** prototype has no verified cross-team authentication, upload authorization, rate limits, size-constrained proxy config or public service hardening. Do not expose to public internet as-is.
- **CORS:** browser frontend from a different origin may require explicitly configured CORS, or preferably server-side Next.js API proxy. Verify current `main.py` before configuring.
- **Media serving:** stored originals are on local disk, but the provided Stage 4 module does not expose a URL to download/display those originals. Implement a validated authenticated media-serving endpoint if the UI needs image thumbnails/video playback.
- **NASA numerical dataset coverage:** the ZARM dataset is **external, non-NASA**. NASA experiment manifests previously identified relevant BASS/BASS-II, Saffire, FLEX/FLEX2, SoFIE, SAME, etc., but the manifest entries were not evidence that their raw scientific datasets were downloaded or imported. Verify source coverage before claims of specific NASA suppression outcomes.
- **Review workflow:** visual observations default to `pending_review`; image-to-experiment associations and user-supplied source URLs are not automatically validated. Display them as unverified until reviewed.
- **Science:** image descriptions are not calibrated measurements; observed ranking scores are not hazard probabilities; microgravity experimental results are not automatically applicable to lunar/Martian partial gravity.
- **Performance:** local 16 GB RAM / RTX 4060 may not serve simultaneous expensive Llama and Gemma calls; handle long requests and errors gracefully.
- **Operational deployment:** container volume backups and the `data/visual` folder require separate backup. `.venv`, `.env`, model files and database volumes should not be sent directly in source control.

## 10. Recommended handoff package

Share: cleaned Git repository with current `main.py` and modules, `requirements.txt` or a pinned dependency list, Docker Compose and SQL migrations, `.env.example` without real secrets, this handoff summary, generated `ignis_openapi.json`, a small set of licensed and provenance-labeled demo files, and a short walkthrough of the working API in `/docs`.

The frontend team should build against the API contract and agreed backend URL. The scientific-data and backend owners should remain responsible for verification, additional NASA imports, auth/network setup, and any public media endpoints.
