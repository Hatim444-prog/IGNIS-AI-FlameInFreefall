import contract from "../ignis_openapi.json" with { type: "json" };

const routes = contract.paths;

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 * @param {{ apiOrigin: string; nimApiKey?: string }} options
 */
export async function handleAiProxy(req, res, options) {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  if (!url.pathname.startsWith("/ai/") && url.pathname !== "/ai") {
    return false;
  }

  const path = url.pathname;
  const method = (req.method || "GET").toLowerCase();
  if (
    !Object.hasOwn(routes, path) ||
    !Object.hasOwn(routes[path], method)
  ) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ detail: "Unknown API route or method" }));
    return true;
  }

  const upstreamUrl = new URL(path, new URL(options.apiOrigin).origin);
  upstreamUrl.search = url.search;

  const headers = new Headers();
  const content = req.headers["content-type"];
  if (content) headers.set("content-type", String(content));

  const mode = req.headers["x-ignis-mode"];
  if (mode === "ollama" || mode === "nim" || mode === "nim-mixed") {
    headers.set("X-IGNIS-Chat-Backend", mode === "ollama" ? "ollama" : "nim");
    headers.set("X-IGNIS-Embed-Backend", mode === "nim" ? "nim" : "ollama");
    if (
      mode !== "ollama" &&
      (path.startsWith("/ai/ask") ||
        path.startsWith("/ai/vision/") ||
        path === "/ai/inference/test")
    ) {
      if (!options.nimApiKey) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            detail:
              "Configure IGNIS_NIM_API_KEY on the frontend server to use NVIDIA inference.",
          }),
        );
        return true;
      }
      headers.set("Authorization", "Bearer " + options.nimApiKey);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000);
  req.on("aborted", () => controller.abort());

  try {
    const init = {
      method: req.method,
      headers,
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      duplex: "half",
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = req;
    }
    const upstream = await fetch(upstreamUrl, init);
    res.statusCode = upstream.status;
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json",
    );
    res.setHeader("Cache-Control", "no-store");
    if (upstream.body) {
      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    }
    res.end();
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        detail:
          "FastAPI is unreachable or timed out. Check the backend service.",
      }),
    );
  } finally {
    clearTimeout(timeout);
  }
  return true;
}