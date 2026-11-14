import { NextRequest } from "next/server";
import contract from "@/ignis_openapi.json";
const routes: Record<string, object> = contract.paths;
async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ segments: string[] }> },
) {
  const path = "/ai/" + (await params).segments.join("/");
  if (
    !Object.hasOwn(routes, path) ||
    !Object.hasOwn(routes[path], request.method.toLowerCase())
  )
    return Response.json(
      { detail: "Unknown API route or method" },
      { status: 404 },
    );
  const url = new URL(
    path,
    new URL(process.env.IGNIS_API_ORIGIN || "http://127.0.0.1:8001").origin,
  );
  url.search = request.nextUrl.search;
  const headers = new Headers();
  const content = request.headers.get("content-type");
  if (content) headers.set("content-type", content);
  const mode = request.headers.get("x-ignis-mode");
  if (mode === "ollama" || mode === "nim" || mode === "nim-mixed") {
    headers.set("X-IGNIS-Chat-Backend", mode === "ollama" ? "ollama" : "nim");
    headers.set("X-IGNIS-Embed-Backend", mode === "nim" ? "nim" : "ollama");
    if (
      mode !== "ollama" &&
      (path.startsWith("/ai/ask") ||
        path.startsWith("/ai/vision/") ||
        path === "/ai/inference/test")
    ) {
      if (!process.env.IGNIS_NIM_API_KEY)
        return Response.json(
          {
            detail:
              "Configure IGNIS_NIM_API_KEY on the frontend server to use NVIDIA inference.",
          },
          { status: 503 },
        );
      headers.set("Authorization", "Bearer " + process.env.IGNIS_NIM_API_KEY);
    }
  }
  try {
    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(300000)]),
    };
    if (request.body) {
      init.body = request.body;
      init.duplex = "half";
    }
    const upstream = await fetch(url, init);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      {
        detail:
          "FastAPI is unreachable or timed out. Check the backend service.",
      },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as POST };
