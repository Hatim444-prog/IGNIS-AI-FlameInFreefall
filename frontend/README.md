# IGNIS research frontend

The Vite + React application runs at http://127.0.0.1:5173. Start the FastAPI service with the root start.bat, then start the frontend with start-frontend.bat. Use Node 22.12 or newer, and preferably Node 24, for a fresh checkout.

```powershell
npm ci
npm run dev
```

For a production build run `npm run build`, then `npm start` (Vite preview). Both development and preview bind to loopback. Copy `.env.example` to `.env.local` for local proxy settings. In local development the Vite proxy uses the root `.env` values. Read [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for the Vercel frontend, backend, CORS, and upload configuration.

## Research workflows

- Overview reports the availability of each data source independently.
- Experiment Explorer searches, filters, sorts and paginates up to 100 returned experiments. Exact code links request records using the documented prefix filter. The shortlist is shared across pages and survives a reload.
- Analytics groups by original unit, plots individual observations, supports condition scatterplots with paired values and time series for a single experiment with distinct timestamps. Export source rows to CSV or the displayed chart to SVG.
- Assistant supports paper, hybrid and multimodal questions. Each turn is an independent API request. Expand evidence cards or export the answer with citations. The conversation is local to the open view.
- Media Laboratory previews JPEG, PNG and MP4 uploads, reports upload progress, and offers separate analyze-only and save actions. Saved observation search uses the embedding service.
- Mission Advisor submits validated scenario inputs, displays NASA-linked and external groups, coverage and weighted dimensions, and exports the submitted scenario with its response.
- Investigations groups the available experiment records. Sources lists searchable documents from `GET /ai/data/documents`, with passage counts, verification status and original web links where supplied.

## Import research documents

Run `import-data.bat` at the repository root to import the ZARM measurements and research documents. For documents alone, run `.\.venv\Scripts\python.exe import_documents.py` from `ai-service` with Ollama and the configured PostgreSQL database available. The importer reads individual prepared JSONL files, skips the combined export and extracts additional PDFs. It reuses unchanged indexed passages. The prepared Fireman's Air Tanks scan includes OCR of text on PDF pages 1 and 3. A new image-only PDF without prepared passages requires English Tesseract language data via `--tessdata`.

Legacy `/measurements`, `/vision` and `/mission` URLs redirect to `/analytics`, `/media`, and `/mission-advisor`. The older JSX prototype under `src/components` and `src/screens` is unused; routing lives in `src/App.tsx` and `research/`.

## Contract and checks

The included ignis_openapi.json was exported from the installed FastAPI app. Refresh it after changing the backend. From the repository root run the following while FastAPI is online.

```powershell
Invoke-WebRequest http://127.0.0.1:8001/openapi.json -OutFile frontend/ignis_openapi.json
cd frontend
npm run contract
npm run typecheck
npm run lint
npm run build
```

FastAPI leaves several success responses unspecified in OpenAPI. The frontend generates request types from the schema and validates response fields at runtime using Zod, based on the installed handlers. Empty values and unsupported fields remain visible as missing. Lab observations are qualitative. Mission scores express relevance within the indexed collection.

With the frontend and backend running and Chrome installed, run npm test. Live comparison and mission tests require an indexed experiment with measurements. The other browser tests control network responses to exercise assistant modes, media actions, empty results, connectivity failures and recovery without writing test observations to the scientific database. IGNIS_BROWSER can select a different installed Playwright Chromium channel.
