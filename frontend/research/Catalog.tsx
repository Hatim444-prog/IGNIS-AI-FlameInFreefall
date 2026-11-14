"use client";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Header, State, RunLink, Fields, useSelection } from "./common";
import { useExperiments, origin, type Experiment, label } from "./api";
export { default as Overview } from "./Overview";
const ranges = {
  oxygen_percent: "Oxygen (%)",
  pressure_pa: "Pressure (Pa)",
  airflow_m_s: "Airflow (m/s)",
} as const;
export function Explorer() {
  const q = useExperiments();
  const { codes, set } = useSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = Object.fromEntries(searchParams);
  const [page, setPage] = useState(0);
  function change(k: string, value: string) {
    const f = { ...filters, [k]: value };
    setSearchParams(Object.entries(f).filter(([, v]) => v));
    setPage(0);
  }
  const rows = q.data?.experiments || [];
  const filtered = rows
    .filter(
      (e) =>
        Object.values(e)
          .join(" ")
          .toLowerCase()
          .includes((filters.q || "").toLowerCase()) &&
        (
          ["fuel_material", "gravity_condition", "investigation_title"] as const
        ).every((k) => !filters[k] || filters[k] === e[k]) &&
        (!filters.origin || origin(e.experiment_code) === filters.origin) &&
        Object.keys(ranges).every((k) => {
          const n = e[k as keyof typeof ranges];
          return (
            (!filters[k + "Min"] ||
              (n != null && n >= Number(filters[k + "Min"]))) &&
            (!filters[k + "Max"] ||
              (n != null && n <= Number(filters[k + "Max"])))
          );
        }),
    )
    .sort(
      (a, b) =>
        a.experiment_code.localeCompare(b.experiment_code) *
        (filters.sort === "descending" ? -1 : 1),
    );
  return (
    <>
      <Header section="Research collection" title="Experiment explorer">
        Search up to 100 returned records. Select runs to carry into analytics
        or the assistant.
      </Header>
      <section className="panel">
        <label>
          Search experiments
          <input
            id="search"
            type="search"
            placeholder="Experiment code, investigation or fuel"
            value={filters.q || ""}
            onChange={(e) => change("q", e.target.value)}
          />
        </label>
        <details className="picker">
          <summary>Filter conditions</summary>
          <div className="fields">
            {(
              [
                "investigation_title",
                "fuel_material",
                "gravity_condition",
                "origin",
              ] as const
            ).map((k) => (
              <label key={k}>
                {label(k)}
                <select
                  value={filters[k] || ""}
                  onChange={(e) => change(k, e.target.value)}
                >
                  <option value="">All</option>
                  {[
                    ...new Set(
                      rows
                        .map((e) =>
                          k === "origin" ? origin(e.experiment_code) : e[k],
                        )
                        .filter(Boolean),
                    ),
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            ))}
            {Object.entries(ranges).map(([k, title]) => (
              <div key={k}>
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
          </div>
          <button
            onClick={() => {
              setSearchParams({});
              setPage(0);
            }}
          >
            Reset filters
          </button>
        </details>
        <State query={q} />
        {q.data && (
          <>
            <div className="row">
              <strong>{filtered.length} matching records</strong>
              <button
                onClick={() =>
                  change(
                    "sort",
                    filters.sort === "descending" ? "ascending" : "descending",
                  )
                }
              >
                Code {filters.sort === "descending" ? "↓" : "↑"}
              </button>
            </div>
            <div className="table">
              <table>
                <thead>
                  <tr>
                    {[
                      "Select",
                      "Experiment",
                      "Origin",
                      "Fuel",
                      "Oxygen (%)",
                      "Pressure (Pa)",
                      "Airflow (m/s)",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(page * 12, page * 12 + 12).map((e) => (
                    <tr key={e.experiment_code}>
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
                      <td>{origin(e.experiment_code)}</td>
                      {[
                        e.fuel_material,
                        e.oxygen_percent,
                        e.pressure_pa,
                        e.airflow_m_s,
                      ].map((n, i) => (
                        <td key={i}>{n ?? "Not reported"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!filtered.length && <p>No matching records.</p>}
            <div className="actions">
              <button disabled={!page} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>
                Page {page + 1} of{" "}
                {Math.max(1, Math.ceil(filtered.length / 12))}
              </span>
              <button
                disabled={(page + 1) * 12 >= filtered.length}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
      <div className="actions">
        <Link className="action" to="/analytics">
          Compare selected ({codes.length})
        </Link>
        <Link to="/assistant">Ask about selection →</Link>
      </div>
    </>
  );
}
export function Detail({ code }: { code: string }) {
  const q = useExperiments(code);
  const e = q.data?.experiments.find((r) => r.experiment_code === code);
  const { codes, set } = useSelection();
  const [copied, copy] = useState(false);
  return (
    <>
      <Header title={code} section="Experiment record">
        {origin(code)}
      </Header>
      <State query={q} />
      {q.data &&
        (e ? (
          <section className="panel">
            <h2>{e.investigation_title}</h2>
            <Fields
              row={{
                Fuel: e.fuel_material,
                Gravity: e.gravity_condition,
                "Oxygen (%)": e.oxygen_percent,
                "Pressure (Pa)": e.pressure_pa,
                "Airflow (m/s)": e.airflow_m_s,
                Investigation: e.investigation_code,
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
        ) : (
          <p>No experiment returned for this code.</p>
        ))}
    </>
  );
}
export function Investigations() {
  const q = useExperiments();
  const groups = Map.groupBy(
    q.data?.experiments || [],
    (e: Experiment) => e.investigation_code,
  );
  return (
    <>
      <Header section="Library" title="Investigations">
        Grouped from the loaded experiment records. A complete catalog requires
        a dedicated investigation API.
      </Header>
      <State query={q} />
      {q.data && !groups.size && (
        <p>No investigations in the loaded records.</p>
      )}
      {Array.from(groups, ([k, rows]) => (
        <section key={k} className="panel">
          <small>{k}</small>
          <h2>{rows[0].investigation_title}</h2>
          <p>
            {rows.length} loaded experiments ·{" "}
            {[...new Set(rows.map((r) => origin(r.experiment_code)))].join(
              ", ",
            )}
          </p>
          <Link
            to={
              "/experiments?investigation_title=" +
              encodeURIComponent(rows[0].investigation_title || "")
            }
          >
            Explore records →
          </Link>
        </section>
      ))}
    </>
  );
}
