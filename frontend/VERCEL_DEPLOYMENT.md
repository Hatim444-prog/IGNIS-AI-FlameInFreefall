# Deploy IGNIS on Vercel

The Vercel project serves the Vite frontend and provides a small same-origin
API proxy. FastAPI, PostgreSQL/pgvector, Ollama, source files, and embeddings
remain on a separate backend host. The Vercel deployment cannot reach a
developer's 127.0.0.1.

## Vercel project settings

1. Import the Git repository into Vercel.
2. Set **Root Directory** to **frontend**.
3. Select the Vite framework preset, Node.js 24.x, and use the committed
   frontend/vercel.json build settings.
4. Set IGNIS_API_ORIGIN to the public HTTPS origin serving FastAPI, for
   example https://ignis-api.example.com. Do not include /ai or a trailing
   path.
5. If the backend uses NVIDIA NIM, set IGNIS_NIM_API_KEY as a Vercel server
   environment variable. Never use a VITE_ prefix for this key.
6. Deploy the project.

The function forwards only endpoints and methods listed in
ignis_openapi.json. It forwards requests to IGNIS_API_ORIGIN, passes model
selection headers, and adds the server-side NIM key to inference requests.
Its configured maximum duration is 300 seconds.

## Media uploads

Vercel Function requests have a 4.5 MB total body limit. The media screen
therefore caps uploads at 4 MiB when requests use the Vercel proxy. To retain
the backend's full 10 MiB image and 30 MiB MP4 limits, set the frontend build
variable VITE_IGNIS_API_URL to the public HTTPS FastAPI origin. Browser
requests then go directly to FastAPI, so the backend must allow the deployed
Vercel origin in CORS.

Set IGNIS_CORS_ORIGINS on the backend to the comma-separated production and
preview origins that should be allowed. For example:

    IGNIS_CORS_ORIGINS=https://ignis.example.com,https://ignis-git-main-team.vercel.app

Avoid a wildcard origin for a credentialed API. Vercel preview domains can
change, so add the preview origins you use or use the same-origin proxy with
uploads under 4 MiB.

## Backend requirements

Deploy FastAPI to a host that can reach PostgreSQL/pgvector, the imported source
documents, and its configured inference provider. If using local Ollama, that
Ollama server must run on the backend host. For a backend using NIM for chat,
keep document embeddings on the database-compatible 768-dimensional embedding
model configured by the project. A successful frontend deployment does not
deploy or expose the FastAPI service.

## Environment variable reference

| Variable | Where | Purpose |
| --- | --- | --- |
| IGNIS_API_ORIGIN | Vercel Function environment | Public FastAPI origin used by the same-origin proxy |
| IGNIS_NIM_API_KEY | Vercel Function environment, optional | Server-side key for NVIDIA inference |
| VITE_IGNIS_API_URL | Vercel build environment, optional | Direct browser-to-FastAPI requests, including large uploads |
| IGNIS_CORS_ORIGINS | FastAPI host, direct API only | Allowed browser origins, comma separated |

Do not put database credentials, NIM keys, or other server secrets in a
VITE_ variable. Vite embeds those values in public browser assets.

## Local deployment preview

With Vercel CLI installed, from frontend run:

    npm ci
    vercel dev

Provide IGNIS_API_ORIGIN=http://127.0.0.1:8001 in the local Vercel
environment for the proxy. Normal local development remains available through
npm run dev, which uses the Vite proxy.
