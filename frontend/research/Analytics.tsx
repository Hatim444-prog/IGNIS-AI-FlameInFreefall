"use client";
import { useState, useRef } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ErrorBar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Brush,
} from "recharts";
import { useMutation } from "@tanstack/react-query";
import { Picker, Header, State, RunLink, useSelection } from "./common";
import {
  comparison,
  useVariables,
  post,
  download,
  label,
  type Evidence,
} from "./api";
function numeric(value: unknown) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function csv(rows: Evidence[]) {
  const keys = Array.from(new Set(rows.flatMap(Object.keys)));
  const cell = (v: unknown) => {
    const s = String(v ?? "");
    return (
      '"' + (/^[=+@\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"'
    );
  };
  download(
    "ignis-measurements.csv",
    [keys, ...rows.map((r) => keys.map((k) => r[k]))]
      .map((r) => r.map(cell).join(","))
      .join("\r\n"),
    "text/csv",
  );
}
function Plot({ rows, unit }: { rows: Evidence[]; unit: string }) {
  const [axis, setAxis] = useState("experiment");
  const figure = useRef<HTMLDivElement>(null);
  const dimensions = [
    ["oxygen_percent", "Oxygen (%)"],
    ["pressure_pa", "Pressure (Pa)"],
    ["airflow_m_s", "Airflow (m/s)"],
    ["timestamp_s", "Time (s)"],
  ] as const;
  const available = dimensions.filter(
    ([key]) =>
      new Set(
        rows.flatMap((r) => (numeric(r[key]) == null ? [] : [numeric(r[key])])),
      ).size > 1,
  );
  const active = available.find(([key]) => key === axis);
  const points = rows.flatMap((r, i) => {
    const value = numeric(r.value);
    return value == null
      ? []
      : [
          {
            name: String(r.experiment_code) + " · " + (i + 1),
            value,
            uncertainty: numeric(r.uncertainty),
            x: active ? numeric(r[active[0]]) : null,
          },
        ];
  });
  const values = points.map((p) => p.value).sort((a, b) => a - b),
    n = values.length;
  const paired = points
    .filter((p) => p.x != null)
    .sort((a, b) => Number(a.x) - Number(b.x));
  const timeSeries =
    active?.[0] === "timestamp_s" &&
    new Set(rows.map((r) => r.experiment_code)).size === 1 &&
    new Set(paired.map((p) => p.x)).size === paired.length;
  const axes = (
    <>
      <CartesianGrid stroke="#344357" />
      <XAxis
        type="number"
        dataKey="x"
        name={active?.[1]}
        domain={["dataMin", "dataMax"]}
      />
      <YAxis dataKey="value" name="Measurement" unit={" " + unit} width={85} />
      <Tooltip
        cursor={{ strokeDasharray: "3 3" }}
        contentStyle={{ background: "var(--panel)" }}
      />
    </>
  );
  if (!n || !unit)
    return <p>Insufficient comparable data with reported units.</p>;
  return (
    <section className="panel">
      <h2>Measurements ({unit})</h2>
      <p>
        n = {n} · Range {values[0]}–{values[n - 1]} · Mean{" "}
        {Number((values.reduce((a, b) => a + b, 0) / n).toPrecision(5))} ·
        Median{" "}
        {(values[Math.floor((n - 1) / 2)] + values[Math.floor(n / 2)]) / 2}
      </p>
      {n > 1 && n <= 80 ? (
        <>
          <label>
            Horizontal axis
            <select
              value={active?.[0] || "experiment"}
              onChange={(e) => setAxis(e.target.value)}
            >
              <option value="experiment">Recorded observation</option>
              {available.map(([key, title]) => (
                <option key={key} value={key}>
                  {title}
                </option>
              ))}
            </select>
          </label>
          <div className="plot" ref={figure}>
            <ResponsiveContainer width="100%" height="100%">
              {active ? (
                timeSeries ? (
                  <LineChart data={paired}>
                    {axes}
                    <Line dataKey="value" type="linear" stroke="#32b5ad" dot />
                  </LineChart>
                ) : (
                  <ScatterChart>
                    {axes}
                    <Scatter data={paired} fill="#32b5ad" />
                  </ScatterChart>
                )
              ) : (
                <BarChart data={points}>
                  <CartesianGrid vertical={false} stroke="#344357" />
                  <XAxis dataKey="name" hide={n > 6} />
                  <YAxis width={70} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel)",
                      color: "var(--fg)",
                    }}
                  />
                  <Bar dataKey="value" fill="#32b5ad" unit={" " + unit}>
                    {points.some((p) => p.uncertainty != null) && (
                      <ErrorBar dataKey="uncertainty" stroke="#999" />
                    )}
                  </Bar>
                  {points.length > 12 && <Brush dataKey="name" height={18} />}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <button
            onClick={() => {
              const svg = figure.current?.querySelector("svg.recharts-surface");
              if (svg) {
                const clone = svg.cloneNode(true) as SVGElement;
                clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                download(
                  "ignis-measurements.svg",
                  new XMLSerializer().serializeToString(clone),
                  "image/svg+xml",
                );
              }
            }}
          >
            Download chart
          </button>
        </>
      ) : (
        <p className="muted">
          {n === 1
            ? "One observation is available."
            : "Use the table or CSV to inspect this many observations."}
        </p>
      )}
    </section>
  );
}
export default function Analytics() {
  const v = useVariables(),
    { codes } = useSelection();
  const [variable, setVariable] = useState("");
  const selected = variable || v.data?.variables[0]?.variable_name || "";
  const m = useMutation({
    mutationFn: (body: {
      variable_name: string;
      experiment_codes: string[];
      dataset_prefix: string;
    }) => post("/ai/data/compare", body, comparison),
  });
  const rows = m.data?.measurements || [];
  return (
    <>
      <Header section="Scientific data" title="Analytics studio">
        Compare observations by variable and original unit. Each bar represents
        one recorded measurement.
      </Header>
      <section className="panel">
        <Picker />
        <State query={v} />
        <label>
          Measured variable
          <select
            value={selected}
            onChange={(e) => setVariable(e.target.value)}
          >
            {[...new Set(v.data?.variables.map((x) => x.variable_name))].map(
              (s) => (
                <option value={s} key={s}>
                  {label(s)}
                </option>
              ),
            )}
          </select>
        </label>
        <div className="actions">
          <button
            className="primary"
            disabled={
              !selected || !codes.length || codes.length > 25 || m.isPending
            }
            onClick={() =>
              m.mutate({
                experiment_codes: codes,
                variable_name: selected,
                dataset_prefix: "",
              })
            }
          >
            {m.isPending ? "Comparing…" : "Compare measurements"}
          </button>
          <span>Select 1–25 experiments.</span>
        </div>
      </section>
      {m.error && (
        <p role="alert" className="notice">
          {m.error.message}
        </p>
      )}
      {m.data && (
        <>
          <h2>
            {label(m.variables.variable_name)} ·{" "}
            {m.variables.experiment_codes.join(", ")}
          </h2>
          {!rows.length && <p>No matching measurements were returned.</p>}
          {Array.from(
            Map.groupBy(rows, (r) => String(r.unit ?? "")),
            ([unit, group]) => (
              <Plot key={unit} unit={unit} rows={group} />
            ),
          )}
          {rows.length > 0 && (
            <section className="panel">
              <div className="row">
                <h2>Source measurements</h2>
                <button onClick={() => csv(rows)}>Export CSV</button>
              </div>
              <div className="table">
                <table>
                  <thead>
                    <tr>
                      {[
                        "Experiment",
                        "Value",
                        "Uncertainty",
                        "Unit",
                        "Source / row",
                        "Verification",
                      ].map((x) => (
                        <th key={x}>{x}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <RunLink code={String(r.experiment_code)} />
                        </td>
                        <td>{r.value ?? "Not reported"}</td>
                        <td>{r.uncertainty ?? "Not reported"}</td>
                        <td>{r.unit ?? "Not reported"}</td>
                        <td>
                          {r.filename ?? "Not reported"}{" "}
                          {r.source_row != null ? " · " + r.source_row : ""}
                        </td>
                        <td>{r.verification_status ?? "Unverified"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <p className="muted">{m.data.disclaimer}</p>
        </>
      )}
    </>
  );
}
