import contract from "../ignis_openapi.json" with { type: "json" };

const routes = contract.paths;

/** Match concrete paths against OpenAPI templates like /ai/data/experiments/{code}. */
function matchRoute(pathname, method) {
  for (const [routePath, ops] of Object.entries(routes)) {
    if (!ops || typeof ops !== "object") continue;
    const routeSegs = routePath.split("/").filter(Boolean);
    const pathSegs = pathname.split("/").filter(Boolean);
    if (routeSegs.length !== pathSegs.length) continue;
    const matches = routeSegs.every(
      (seg, i) => seg.startsWith("{") || seg === pathSegs[i],
    );
    if (matches && Object.hasOwn(ops, method)) return true;
  }
  return false;
}

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
  if (!matchRoute(path, method)) {
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
  if (req.headers.range) headers.set("range", String(req.headers.range));

  const mode = req.headers["x-ignis-mode"];
  if (mode === "ollama" || mode === "nim" || mode === "nim-mixed") {
    headers.set("X-IGNIS-Chat-Backend", mode === "ollama" ? "ollama" : "nim");
    headers.set("X-IGNIS-Embed-Backend", mode === "nim" ? "nim" : "ollama");
    if (
      path.startsWith("/ai/ask") ||
      path.startsWith("/ai/vision/") ||
      path === "/ai/inference/test"
    ) {
      if (options.nimApiKey) {
        headers.set("Authorization", "Bearer " + options.nimApiKey);
      }
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
    for (const name of [
      "content-length",
      "content-range",
      "accept-ranges",
      "content-disposition",
    ]) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
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
