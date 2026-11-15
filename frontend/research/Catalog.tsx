"use client";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import DocumentCollection from "./DocumentCollection";
import { Header, State, RunLink, Fields, Pending, useSelection } from "./common";
import {
  useExperimentPage,
  useExperimentDetail,
  useCatalogStats,
  useExperimentFacets,
  origin,
  label,
  type ExperimentQuery,
  type ExperimentDetail,
  type Experiment,
} from "./api";
export { default as Overview } from "./Overview";

const PAGE_SIZE = 12;
const rangeFilters = {
  oxygen_percent: "Oxygen (%)",
  pressure_pa: "Pressure (Pa)",
  airflow_m_s: "Airflow (m/s)",
} as const;

function titleCase(value: string) {
  return label(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function num(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

const OPTIONAL_COLUMNS = [
  { key: "fuel_material", label: "Fuel", render: (e: Experiment) => e.fuel_material ?? "Not reported" },
  { key: "oxygen_percent", label: "Oxygen (%)", render: (e: Experiment) => e.oxygen_percent ?? "Not reported" },
  { key: "pressure_pa", label: "Pressure (Pa)", render: (e: Experiment) => e.pressure_pa ?? "Not reported" },
  { key: "airflow_m_s", label: "Airflow (m/s)", render: (e: Experiment) => e.airflow_m_s ?? "Not reported" },
  { key: "gravity_condition", label: "Gravity", render: (e: Experiment) => e.gravity_condition ?? "Not reported" },
  { key: "experiment_date", label: "Date", render: (e: Experiment) => e.experiment_date ?? "Not reported" },
  { key: "completeness_score", label: "Completeness", render: (e: Experiment) => e.completeness_score ?? "—" },
] as const;

export function Explorer() {
  const { codes, set } = useSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = Object.fromEntries(searchParams);
  const [page, setPage] = useState(0);
  const [hiddenCols, setHiddenCols] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const facets = useExperimentFacets();
  const stats = useCatalogStats();
  const visibleCols = OPTIONAL_COLUMNS.filter(
    (c) => !hiddenCols.has(c.key),
  );

  const query: ExperimentQuery = {
    investigation: filters.investigation || undefined,
    q: filters.q || undefined,
    fuel_material: filters.fuel_material || undefined,
    gravity_condition: filters.gravity_condition || undefined,
    oxygen_min: num(filters.oxygen_percentMin),
    oxygen_max: num(filters.oxygen_percentMax),
    pressure_min: num(filters.pressure_paMin),
    pressure_max: num(filters.pressure_paMax),
    airflow_min: num(filters.airflow_m_sMin),
    airflow_max: num(filters.airflow_m_sMax),
    airflow_availability:
      filters.airflow === "reported" || filters.airflow === "not_reported"
        ? filters.airflow
        : undefined,
    sort: filters.sort || "airflow_first",
    curated: filters.dataset !== "all",
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };
  const q = useExperimentPage(query);
  const total = q.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function change(k: string, value: string) {
    const f = { ...filters, [k]: value };
    setSearchParams(Object.entries(f).filter(([, v]) => v));
    setPage(0);
  }

  const totals = stats.data?.totals;
  const investigations = stats.data?.investigations ?? [];

  return (
    <div className="tool">
      <Header section="Research collection" title="Experiment explorer">
        {totals
          ? `${totals.experiments} experiments · ${investigations.length} investigations · ${totals.measurements} measurements`
          : "Search the scientific catalog. Select runs to carry into analytics or the assistant."}
      </Header>

      {stats.data && (
        <section className="stats-grid" aria-label="Catalog statistics">
          <div className="stat-card">
            <span className="stat-value">{totals?.experiments ?? 0}</span>
            <span className="stat-label">Total experiments</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{investigations.length}</span>
            <span className="stat-label">Investigations</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totals?.measurements ?? 0}</span>
            <span className="stat-label">Measurements</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totals?.verified_sources ?? 0}</span>
            <span className="stat-label">Verified sources</span>
          </div>
        </section>
      )}

      <form
        className="panel catalog-search"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <label>
          Search runs
          <input
            id="search"
            type="search"
            placeholder="Experiment code, investigation or fuel"
            value={filters.q || ""}
            onChange={(e) => change("q", e.target.value)}
          />
        </label>
      </form>
      <div className="tool-split catalog-split">
        <section className="panel scope-panel">
          <h2>Filters</h2>
          {facets.isPending && !q.isPending && <Pending />}
          {facets.error && facets.error.message !== q.error?.message && (
            <State query={facets} />
          )}
          <label>
            Dataset
            <select
              value={filters.dataset || "curated"}
              onChange={(e) => change("dataset", e.target.value)}
            >
              <option value="curated">Top 150 — most complete</option>
              <option value="all">All experiments</option>
            </select>
          </label>
          <label>
            Investigation
            <select
              value={filters.investigation || ""}
              onChange={(e) => change("investigation", e.target.value)}
            >
              <option value="">All investigations</option>
              {(facets.data?.investigations ?? []).map((inv) => (
                <option key={inv.code} value={inv.code}>
                  {inv.code} — {inv.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Airflow availability
            <select
              value={filters.airflow || ""}
              onChange={(e) => change("airflow", e.target.value)}
            >
              <option value="">All experiments</option>
              <option value="reported">Reported only</option>
              <option value="not_reported">Not reported only</option>
            </select>
          </label>
          {(["fuel_material", "gravity_condition"] as const).map((k) => (
            <label key={k}>
              {titleCase(k)}
              <select
                value={filters[k] || ""}
                onChange={(e) => change(k, e.target.value)}
              >
                <option value="">All</option>
                {(facets.data?.[k] ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <fieldset>
            <legend>Numeric ranges</legend>
            {Object.entries(rangeFilters).map(([k, title]) => (
              <div className="range-pair" key={k}>
                {["Min", "Max"].map((bound) => (
                  <label key={bound}>
                    {title} {bound}
                    <input
                      type="number"
                      value={filters[k + bound] || ""}
                      onChange={(e) => change(k + bound, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            ))}
          </fieldset>
          <button
            type="button"
            onClick={() => {
              setSearchParams({});
              setPage(0);
            }}
          >
            Reset filters
          </button>
        </section>
        <section className="panel results-panel">
        <State query={q} />
        {q.data && (
          <>
            <div className="catalog-toolbar">
              <strong>{total} matching records</strong>
              <label className="sort-select">
                Sort
                <select
                  value={filters.sort || "airflow_first"}
                  onChange={(e) => change("sort", e.target.value)}
                >
                  <option value="airflow_first">
                    Airflow reported first
                  </option>
                  <option value="code_asc">Code A–Z</option>
                  <option value="code_desc">Code Z–A</option>
                  <option value="date_desc">Date newest first</option>
                </select>
              </label>
              <details className="picker columns-picker">
                <summary>Columns</summary>
                <div className="checks">
                  {OPTIONAL_COLUMNS.map((c) => (
                    <label key={c.key} className="inline">
                      <input
                        type="checkbox"
                        checked={!hiddenCols.has(c.key)}
                        onChange={(ev) =>
                          setHiddenCols((prev) => {
                            const next = new Set(prev);
                            if (ev.target.checked) next.delete(c.key);
                            else next.add(c.key);
                            return next;
                          })
                        }
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </details>
            </div>
            {q.data.experiments.length > 0 && (
            <div className="table">
              <table>
                <thead>
                  <tr>
                    {[
                      "Select",
                      "Experiment",
                      "Investigation",
                      ...visibleCols.map((c) => c.label),
                      "Details",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {q.data.experiments.map((e) => (
                    <tr key={e.investigation_code + ":" + e.experiment_code}>
                      <td>
                        <input
                          aria-label={"Select " + e.experiment_code}
                          type="checkbox"
                          checked={codes.includes(e.experiment_code)}
                          onChange={(ev) =>
                            set(
                              ev.target.checked
                                ? [...codes, e.experiment_code]
                                : codes.filter((c) => c !== e.experiment_code),
                            )
                          }
                        />
                      </td>
                      <td>
                        <RunLink code={e.experiment_code} />
                      </td>
                      <td>
                        <div className="experiment-identity">
                          <span className="experiment-study">
                            {e.investigation_title || e.investigation_code}
                          </span>
                          <span className="origin-pill">
                            {origin(e)}
                          </span>
                        </div>
                      </td>
                      {visibleCols.map((c) => (
                        <td key={c.key}>{c.render(e)}</td>
                      ))}
                      <td>
                        <Link
                          className="mono"
                          to={
                            "/experiments/" +
                            encodeURIComponent(e.experiment_code) +
                            (e.investigation_code
                              ? "?investigation=" +
                                encodeURIComponent(e.investigation_code)
                              : "")
                          }
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            {!q.data.experiments.length && (
              <p className="empty-result">No matching records.</p>
            )}
            {q.data.experiments.length > 0 && (
            <div className="actions">
              <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span className="page-status">
                Page {Math.min(page + 1, pageCount)} of {pageCount}
              </span>
              <button
                type="button"
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
            )}
          </>
        )}
        </section>
      </div>
      <div className="selection-bar">
        <p>
          {codes.length
            ? codes.length + " selected for comparison"
            : "Select runs to compare or ask about them."}
        </p>
        <div className="actions">
          <Link className="action primary" to="/analytics">
            Compare selected ({codes.length})
          </Link>
          <Link to="/assistant">Ask about selection →</Link>
        </div>
      </div>
    </div>
  );
}

const CONDITION_VARS = [
  "pressure",
  "airflow",
  "gravity",
  "fuel",
  "droplet",
  "ambient_pressure",
];
const GAS_VARS = [
  "fraction",
  "_o2",
  "_n2",
  "_co",
  "_he",
  "co2",
  "oxygen_",
  "gas",
];
const RESULT_VARS = [
  "burn",
  "flame",
  "spread",
  "extinction",
  "end",
  "duration",
  "rate",
];

function groupMeasurements(
  measurements: ExperimentDetail["measurements"],
): Record<string, ExperimentDetail["measurements"]> {
  const groups: Record<string, ExperimentDetail["measurements"]> = {
    conditions: [],
    gas: [],
    results: [],
    other: [],
  };
  for (const m of measurements) {
    const name = m.variable_name.toLowerCase();
    if (GAS_VARS.some((k) => name.includes(k))) groups.gas.push(m);
    else if (CONDITION_VARS.some((k) => name.includes(k)))
      groups.conditions.push(m);
    else if (RESULT_VARS.some((k) => name.includes(k))) groups.results.push(m);
    else groups.other.push(m);
  }
  return groups;
}

export function Detail({ code }: { code: string }) {
  const [searchParams] = useSearchParams();
  const investigation = searchParams.get("investigation") || "";
  const q = useExperimentDetail(code, investigation);
  const e = q.data?.experiment;
  const { codes, set } = useSelection();
  const [copied, copy] = useState(false);
  const groups = e ? groupMeasurements(q.data?.measurements ?? []) : null;
  return (
    <div className="tool">
      <Header title={code} section="Experiment record">
        {e ? origin(e) : ""}
      </Header>
      <State query={q} />
      {q.data &&
        (e ? (
          <>
            <section className="panel">
              <h2>{e.investigation_title || e.investigation_code}</h2>
              <Fields
                row={{
                  "Experiment code": e.experiment_code,
                  Investigation: e.investigation_code,
                  Date: e.experiment_date ?? null,
                  "Fuel material": e.fuel_material ?? null,
                  "Fuel phase": e.fuel_phase ?? null,
                  Gravity: e.gravity_condition ?? null,
                  "Oxygen (%)": e.oxygen_percent ?? null,
                  "Pressure (Pa)": e.pressure_pa ?? null,
                  "Airflow (m/s)": e.airflow_m_s ?? null,
                  "Flow direction": e.flow_direction ?? null,
                  "Sample thickness (mm)": e.sample_thickness_mm ?? null,
                  "Gaps sequence": e.gaps_sequence ?? null,
                  "Filler material": e.filler_material ?? null,
                  "Research focus": e.research_focus ?? null,
                }}
              />
              <div className="actions">
                <button
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(code)
                      .then(() => copy(true));
                  }}
                >
                  {copied ? "Copied" : "Copy code"}
                </button>
                {["analytics", "assistant"].map((route) => (
                  <Link
                    key={route}
                    className={
                      "action" + (route === "analytics" ? " primary" : "")
                    }
                    to={"/" + route}
                    onClick={() => set(Array.from(new Set([...codes, code])))}
                  >
                    {route === "analytics"
                      ? "Compare measurements"
                      : "Ask about this run"}{" "}
                    →
                  </Link>
                ))}
              </div>
            </section>
            {groups && (
              <section className="panel">
                <h2>Measurements &amp; scientific evidence</h2>
                {(
                  [
                    ["conditions", "Experimental conditions"],
                    ["gas", "Gas composition"],
                    ["results", "Combustion results"],
                    ["other", "Other recorded values"],
                  ] as const
                ).map(([g, title]) =>
                  groups[g].length ? (
                    <details key={g} className="evidence" open={g !== "other"}>
                      <summary>
                        {title} ({groups[g].length})
                      </summary>
                      <div className="table">
                        <table>
                          <thead>
                            <tr>
                              <th>Variable</th>
                              <th>Value</th>
                              <th>Unit</th>
                              <th>Source</th>
                              <th>Row</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groups[g].map((m, i) => (
                              <tr key={g + i}>
                                <td>{m.variable_name}</td>
                                <td>
                                  {m.value != null
                                    ? (m.qualifier ?? "") + m.value
                                    : (m.text_value ?? "Not reported")}
                                </td>
                                <td>{m.unit ?? "—"}</td>
                                <td>{m.filename}</td>
                                <td>
                                  {m.source_row ?? "—"}
                                  {m.page_number != null
                                    ? " · p." + m.page_number
                                    : ""}
                                </td>
                                <td>{m.verification_status ?? "unverified"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ) : null,
                )}
                {!q.data.measurements.length && (
                  <p>No measurements recorded for this experiment.</p>
                )}
              </section>
            )}
          </>
        ) : (
          <p>No experiment returned for this code.</p>
        ))}
    </div>
  );
}
export function Investigations() {
  const q = useCatalogStats();
  return (
    <>
      <Header section="Library" title="Investigations">
        Browse indexed research documents and investigations with measured
        experiment runs.
      </Header>
      <DocumentCollection />
      <State query={q} />
      {q.data && !q.data.investigations.length && (
        <p>No investigations in the catalog.</p>
      )}
      {q.data?.investigations.map((inv) => (
        <section key={inv.code} className="panel">
          <small>{inv.code}</small>
          <h2>{inv.title}</h2>
          <p>
            {inv.experiment_count} experiments · {inv.measurement_count}{" "}
            measurements
          </p>
          <Link
            to={
              "/experiments?investigation=" + encodeURIComponent(inv.code)
            }
          >
            Explore records →
          </Link>
        </section>
      ))}
    </>
  );
}
