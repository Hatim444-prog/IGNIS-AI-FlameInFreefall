# Deploy IGNIS as a Vercel multi-service project

The repository root `vercel.json` defines two services in one Vercel project:

- `frontend` is the public Vite application.
- `ai-service` is the FastAPI backend and stays internal. The frontend service
  calls it through the `IGNIS_API_ORIGIN` service binding.

Vercel Services are currently in beta. The top-level catch-all rewrite exposes
only the frontend service. Within that service, `/ai/*` is sent to the
server-side proxy function, which uses the private backend binding; all other
paths serve the Vite single-page application.

## Vercel project setup

1. Import this repository into Vercel and keep the project root at the
   repository root. Do not set the project root to `frontend`.
2. Keep the committed `vercel.json`; it defines each service's framework,
   build settings, binding, and request routing.
3. Add the following environment variables in Vercel for the appropriate
   service and deployment environments:
   - `DATABASE_URL` on `ai-service`, pointing to a reachable PostgreSQL
     database with the project's pgvector schema and indexed research data.
   - `IGNIS_NIM_API_KEY` on `frontend` if the proxy should provide the NVIDIA
     NIM credential for inference requests. Keep it server-side; do not use a
     `VITE_` prefix.
   - Any backend inference variables required by the selected provider on
     `ai-service` (for example, `NIM_BASE_URL`).
4. Do not manually set `IGNIS_API_ORIGIN`. Vercel injects it into `frontend`
   from the `ai-service` binding.
5. Deploy the project.

The app calls `/ai/*` on its own origin. The proxy validates paths and methods
against `ignis_openapi.json`, forwards model-selection headers, and can attach
the server-side NIM key. The proxy is configured for a maximum duration of 300
seconds. Vercel Function requests have a 4.5 MB total body limit, so media
uploads through this path must remain under that limit; the UI caps them at 4
MiB.

## Backend dependencies

The FastAPI service needs a reachable PostgreSQL/pgvector database containing
the imported documents and measurements. Vercel does not provide the local
PostgreSQL or Ollama instances used by the development setup. Configure a
reachable inference provider for production; the backend must not depend on a
developer's `127.0.0.1` services.

## Local development

Normal local development remains available through `npm run dev` in `frontend`
and the repository's FastAPI startup script. The Vite proxy continues to use
`IGNIS_API_ORIGIN` locally, defaulting to `http://127.0.0.1:8001`. For local
Vercel Services development, use `vercel dev` from the repository root so
Vercel can inject service bindings.
