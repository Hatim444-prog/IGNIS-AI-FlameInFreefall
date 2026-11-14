import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { paths, components } from "./contract";
import { getApiBase } from "../src/lib/inference.js";
export type Models = components["schemas"];
const scalar = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const evidence = z.record(z.string(), scalar);
export type Evidence = z.infer<typeof evidence>;
const experiment = z.object({
  experiment_code: z.string(),
  investigation_title: z.string().nullable(),
  investigation_code: z.string(),
  fuel_material: z.string().nullable(),
  gravity_condition: z.string().nullable(),
  oxygen_percent: z.coerce.number().nullable(),
  pressure_pa: z.coerce.number().nullable(),
  airflow_m_s: z.coerce.number().nullable(),
});
export type Experiment = z.infer<typeof experiment>;
export const variables = z.object({
  variables: z.array(
    z.object({
      variable_name: z.string(),
      unit: z.string().nullable(),
      experiment_count: z.number(),
      observation_count: z.number(),
    }),
  ),
});
export const comparison = z.object({
  measurements: z.array(evidence),
  disclaimer: z.string().optional(),
});
export const answer = z.object({
  answer: z.string().min(1),
  model: z.string().optional(),
  sources: z.array(evidence).optional(),
  paper_sources: z.array(evidence).optional(),
  visual_sources: z.array(evidence).optional(),
  measurement_sources: z.array(evidence).optional(),
  measurements: z.array(evidence).optional(),
  warnings: z.array(z.string()).optional(),
  limitations: z.array(z.string()).optional(),
});
export const observation = z.object({
  description: z.string(),
  file_name: z.string(),
  review_status: z.string().optional(),
  approx_timestamps_s: z.array(z.number()).optional(),
  persisted_to_database: z.boolean(),
});
export const visuals = z.object({ results: z.array(evidence) });
type Path = keyof paths;
type JsonBody<P extends Path> = paths[P] extends {
  post: { requestBody: { content: { "application/json": infer B } } };
}
  ? B
  : never;
async function request<T>(
  path: Path,
  schema: z.ZodType<T>,
  options: RequestInit = {},
  query = "",
) {
  const timeout = AbortSignal.timeout(300000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;
  let response: Response;
  try {
    response = await fetch(getApiBase() + path + query, {
      ...options,
      headers: {
        ...options.headers,
        "x-ignis-mode": localStorage.getItem("ignis_infer_mode") || "ollama",
      },
      signal,
      cache: "no-store",
    });
  } catch {
    if (signal.aborted)
      throw new Error(
        timeout.aborted ? "Request timed out." : "Request cancelled.",
      );
    throw new Error("Cannot reach IGNIS. Check the API connection and retry.");
  }
  const responseText = await response.text();
  let responseBody: unknown;
  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    if (/^\s*<!doctype html\b/i.test(responseText))
      throw new Error(
        "The API route returned the frontend page. Check the deployed Vercel service routing.",
      );
    throw new Error("The backend returned an invalid response.");
  }
  if (!response.ok) {
    const detail =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "detail" in responseBody &&
      typeof responseBody.detail === "string"
        ? responseBody.detail
        : response.statusText;
    throw new Error("HTTP " + response.status + " · " + detail);
  }
  const parsed = schema.safeParse(responseBody);
  if (!parsed.success)
    throw new Error(
      "The backend returned an incomplete or unexpected response.",
    );
  return parsed.data;
}
export function post<P extends Path, T>(
  path: P,
  body: JsonBody<P>,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
) {
  return request(path, schema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}
export { request };
export function uploadObservation(
  path: Extract<Path, `/ai/vision/${string}`>,
  body: FormData,
  signal: AbortSignal,
  onProgress: (percent: number) => void,
) {
  return new Promise<z.infer<typeof observation>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    xhr.open("POST", getApiBase() + path);
    xhr.timeout = 300000;
    xhr.responseType = "json";
    xhr.setRequestHeader(
      "x-ignis-mode",
      localStorage.getItem("ignis_infer_mode") || "ollama",
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new Error(
            "HTTP " +
              xhr.status +
              " · " +
              (xhr.response?.detail || xhr.statusText),
          ),
        );
        return;
      }
      const parsed = observation.safeParse(xhr.response);
      if (parsed.success) resolve(parsed.data);
      else reject(new Error("Incomplete visual analysis returned."));
    };
    xhr.onerror = () => reject(new Error("Cannot reach the media service."));
    xhr.ontimeout = () => reject(new Error("Visual analysis timed out."));
    xhr.onabort = () => reject(new Error("Request cancelled."));
    xhr.onloadend = () => signal.removeEventListener("abort", abort);
    if (signal.aborted) {
      reject(new Error("Request cancelled."));
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
    xhr.send(body);
  });
}
export function useRead<T>(
  path: Path,
  schema: z.ZodType<T>,
  query = "",
  enabled = true,
) {
  return useQuery({
    queryKey: [path, query],
    enabled,
    queryFn: ({ signal }) => request(path, schema, { signal }, query),
    staleTime: 30000,
    retry: false,
  });
}
export const useDocuments = () =>
  useRead(
    "/ai/data/documents",
    z.array(
      z.object({
        filename: z.string(),
        file_type: z.string(),
        passages: z.number(),
        source_url: z.string().nullable(),
        verification_status: z.string(),
      }),
    ),
  );
export const useExperiments = (prefix = "") =>
  useRead(
    "/ai/data/experiments",
    z.object({ experiments: z.array(experiment) }),
    "?limit=100&dataset_prefix=" + encodeURIComponent(prefix),
  );
export const useVariables = () =>
  useRead("/ai/data/variables", variables, "?dataset_prefix=");
export const useHealth = () =>
  useRead(
    "/ai/health",
    z.object({
      status: z.string(),
      text_model: z.string(),
      vision_model: z.string(),
      embedding_model: z.string(),
    }),
  );
export const useDatabase = () =>
  useRead(
    "/ai/mission/health",
    z.object({ status: z.string(), investigations_in_db: z.number() }),
  );
export function origin(code: unknown) {
  return String(code || "").startsWith("ZARM-")
    ? "External · ZARM"
    : "Origin unverified";
}
export function download(name: string, body: string, type: string) {
  const href = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
export function label(key: string) {
  return key.replaceAll("_", " ");
}
