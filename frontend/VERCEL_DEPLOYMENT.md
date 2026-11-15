# Deploy IGNIS as a Vercel multi-service project

The repository root `vercel.json` defines two services in one Vercel project:

- `frontend` is the public Vite application.
- `ai-service` is the FastAPI backend exposed only under the same-origin
  `/ai/*` path.

Vercel Services are currently in beta. Top-level rewrites send `/ai/*` directly
to FastAPI and all remaining paths to the Vite single-page application. The
specific API rewrite must stay before the frontend catch-all.

## Vercel project setup

1. Import this repository into Vercel and keep the project root at the
   repository root. Do not set the project root to `frontend`.
2. Keep the committed `vercel.json`; it defines each service's framework,
   build settings, binding, and request routing.
3. Add the following environment variables in Vercel for the appropriate
   service and deployment environments:
   - `DATABASE_URL` on `ai-service`, pointing to a reachable PostgreSQL
     database with the project's pgvector schema and indexed research data.
   - `IGNIS_NIM_API_KEY` on `ai-service` if the backend should use NVIDIA NIM.
     Keep it server-side; do not use a `VITE_` prefix.
   - Any backend inference variables required by the selected provider on
     `ai-service` (for example, `NIM_BASE_URL`).
4. Do not set `IGNIS_API_ORIGIN` or `VITE_IGNIS_API_URL`; the browser uses the
   same-origin `/ai/*` route.
5. Deploy the project.

The app calls `/ai/*` on its own origin, and Vercel routes those requests to the
FastAPI service without passing through the Vite service. The FastAPI function
is configured for a maximum duration of 300 seconds. Vercel Function requests
have a 4.5 MB total body limit, so media uploads through this path must remain
under that limit; the UI caps them at 4 MiB.

## Backend dependencies

The FastAPI service needs a reachable PostgreSQL/pgvector database containing
the imported documents and measurements. Vercel does not provide the local
PostgreSQL or Ollama instances used by the development setup. Configure a
reachable inference provider for production; the backend must not depend on a
developer's `127.0.0.1` services.

## Local development

Normal local development remains available through `npm run dev` in `frontend`
and the repository's FastAPI startup script. The Vite development proxy uses
`http://127.0.0.1:8001` by default. For local Vercel Services development, use
`vercel dev` from the repository root.
