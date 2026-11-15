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
  experiment_date: z.string().nullable(),
  completeness_score: z.coerce.number().optional(),
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
export const visuals = z.object({
  results: z.array(evidence),
  total_observations: z.number().optional(),
  search_mode: z.enum(["semantic", "keyword", "empty"]).optional(),
  warnings: z.array(z.string()).optional(),
  note: z.string().optional(),
});
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
        "x-ignis-mode": localStorage.getItem("ignis_infer_mode") || "nim-mixed",
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
      localStorage.getItem("ignis_infer_mode") || "nim-mixed",
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
const experimentPage = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  experiments: z.array(experiment),
});
export type ExperimentPage = z.infer<typeof experimentPage>;
export interface ExperimentQuery {
  investigation?: string;
  q?: string;
  fuel_material?: string;
  gravity_condition?: string;
  oxygen_min?: number;
  oxygen_max?: number;
  pressure_min?: number;
  pressure_max?: number;
  airflow_min?: number;
  airflow_max?: number;
  airflow_availability?: "all" | "reported" | "not_reported";
  sort?: "airflow_first" | "code_asc" | "code_desc" | "date_desc" | string;
  curated?: boolean;
  limit?: number;
  offset?: number;
}
function experimentParams(query: ExperimentQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "" && value !== null)
      params.set(key, String(value));
  }
  return params.toString();
}
/** Fetch every experiment page so pickers/analytics keep a complete list. */
export async function fetchAllExperiments(
  query: ExperimentQuery = {},
  signal?: AbortSignal,
): Promise<Experiment[]> {
  const limit = 100;
  const all: Experiment[] = [];
  let offset = 0;
  let total = Infinity;
  while (all.length < total) {
    const qs = experimentParams({ ...query, limit, offset });
    const page = await request(
      "/ai/data/experiments",
      experimentPage,
      { signal },
      "?" + qs,
    );
    total = page.total;
    all.push(...page.experiments);
    offset += page.experiments.length || limit;
    if (!page.experiments.length) break;
  }
  return all;
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
export function useAllExperiments(query: ExperimentQuery = {}) {
  const qs = experimentParams({ ...query, limit: 100 });
  return useQuery({
    queryKey: ["/ai/data/experiments", "all", qs],
    queryFn: ({ signal }) => fetchAllExperiments(query, signal),
    staleTime: 30000,
    retry: false,
  });
}
export function useExperimentPage(query: ExperimentQuery, enabled = true) {
  const qs = experimentParams(query);
  return useRead(
    "/ai/data/experiments",
    experimentPage,
    "?" + qs,
    enabled,
  );
}
export const experimentDetail = z.object({
  experiment: experiment.extend({
    experiment_id: z.number().optional(),
    fuel_phase: z.string().nullable().optional(),
    research_focus: z.string().nullable().optional(),
    flow_direction: z.string().nullable().optional(),
    sample_thickness_mm: z.coerce.number().nullable().optional(),
    gaps_sequence: z.string().nullable().optional(),
    filler_material: z.string().nullable().optional(),
  }),
  measurements: z.array(
    z.object({
      variable_name: z.string(),
      value: z.coerce.number().nullable(),
      text_value: z.string().nullable().optional(),
      unit: z.string().nullable(),
      qualifier: z.string().nullable().optional(),
      uncertainty: z.coerce.number().nullable(),
      source_row: z.number().nullable(),
      page_number: z.number().nullable().optional(),
      timestamp_s: z.coerce.number().nullable(),
      filename: z.string(),
      file_type: z.string().nullable(),
      source_url: z.string().nullable(),
      local_path: z.string().nullable(),
      sha256: z.string().nullable(),
      verification_status: z.string().nullable(),
    }),
  ),
});
export type ExperimentDetail = z.infer<typeof experimentDetail>;
export function useExperimentDetail(code: string, investigation = "") {
  const qs = investigation
    ? "?investigation=" + encodeURIComponent(investigation)
    : "";
  return useRead(
    ("/ai/data/experiments/" + encodeURIComponent(code)) as Path,
    experimentDetail,
    qs,
  );
}
export const catalogStats = z.object({
  investigations: z.array(
    z.object({
      code: z.string(),
      title: z.string(),
      experiment_count: z.number(),
      measurement_count: z.number(),
    }),
  ),
  totals: z.object({
    experiments: z.number(),
    measurements: z.number(),
    sources: z.number(),
    verified_sources: z.number(),
  }),
});
export const useCatalogStats = () =>
  useRead("/ai/data/stats" as Path, catalogStats);
export const experimentFacets = z.object({
  investigations: z.array(z.object({ code: z.string(), title: z.string() })),
  fuel_material: z.array(z.string()),
  gravity_condition: z.array(z.string()),
});
export const useExperimentFacets = () =>
  useRead("/ai/data/facets" as Path, experimentFacets);
export function useVariables(experimentCodes?: string[]) {
  const params = new URLSearchParams({ dataset_prefix: "" });
  [...new Set(experimentCodes)]
    .sort()
    .forEach((code) => params.append("experiment_codes", code));
  return useRead(
    "/ai/data/variables",
    variables,
    "?" + params.toString(),
    experimentCodes === undefined ||
      (experimentCodes.length >= 2 && experimentCodes.length <= 25),
  );
}
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
export function origin(
  e: { investigation_code?: string | null; experiment_code?: string | null } | string,
) {
  const investigation =
    typeof e === "string" ? "" : e.investigation_code || "";
  const code = typeof e === "string" ? e : e.experiment_code || "";
  if (investigation) {
    return investigation.startsWith("ZARM")
      ? "External · ZARM"
      : `NASA · ${investigation}`;
  }
  if (code.startsWith("ZARM-")) return "External · ZARM";
  return "Origin unverified";
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
const measureFormat = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 6,
  useGrouping: false,
});
export function formatMeasure(value: unknown): string {
  if (value == null || value === "") return "Not reported";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && !Number.isFinite(Number(value))) return value;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return measureFormat.format(n);
}
