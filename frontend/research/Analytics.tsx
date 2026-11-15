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
import {
  Picker,
  Header,
  State,
  RunLink,
  Pending,
  useMedia,
  useSelection,
} from "./common";
import {
  comparison,
  useVariables,
  post,
  download,
  formatMeasure,
  label,
  type Evidence,
} from "./api";
const chartTick = { fill: "var(--muted)", fontSize: 12 };
const axisLabel = {
  fill: "var(--muted)",
  fontSize: 12,
};
type ChartPoint = {
  name: string;
  experiment: string;
  source: string;
  value: number;
  uncertainty: number | null;
  x: number | null;
};
function categoryInterval(count: number, narrow: boolean) {
  const budget = narrow ? 4 : 8;
  if (count <= budget) return 0;
  return Math.ceil(count / budget) - 1;
}
function sourceLabel(row: Evidence) {
  const file =
    row.filename == null || row.filename === ""
      ? "Source not reported"
      : String(row.filename);
  return row.source_row == null || row.source_row === ""
    ? file
    : file + " · row " + row.source_row;
}
function MeasureTooltip({
  active,
  payload,
  unit,
  xLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartPoint }>;
  unit: string;
  xLabel?: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="chart-tip">
      <p>
        <strong>{point.experiment}</strong>
      </p>
      <p>
        {formatMeasure(point.value)} {unit}
        {point.uncertainty != null
          ? ` ± ${formatMeasure(point.uncertainty)}`
          : ""}
      </p>
      {xLabel && point.x != null && (
        <p>
          {xLabel}: {formatMeasure(point.x)}
        </p>
      )}
      <p>{point.source}</p>
    </div>
  );
}
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
  const [span, setSpan] = useState<{
    start: number;
    end: number;
    key: string;
  } | null>(null);
  const narrow = useMedia("(max-width: 720px)");
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
            name: String(r.experiment_code ?? "Not reported") + " · " + (i + 1),
            experiment: String(r.experiment_code ?? "Not reported"),
            source: sourceLabel(r),
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
  const plotted = active ? paired.length : n;
  const angled = !active && n > 6;
  const dense = plotted > 12;
  const spanKey = axis + ":" + n;
  const activeSpan = span?.key === spanKey ? span : null;
  const visible =
    activeSpan && activeSpan.end >= activeSpan.start
      ? activeSpan.end - activeSpan.start + 1
      : plotted;
  const brush = dense ? (
    <Brush
      dataKey={active ? "x" : "name"}
      height={narrow ? 28 : 24}
      stroke="var(--accent)"
      fill="var(--raised)"
      travellerWidth={10}
      onChange={(range) =>
        setSpan((current) =>
          current?.key === spanKey &&
          current.start === range.startIndex &&
          current.end === range.endIndex
            ? current
            : { start: range.startIndex, end: range.endIndex, key: spanKey },
        )
      }
    />
  ) : null;
  const tooltip = (
    <Tooltip
      cursor={{ strokeDasharray: "3 3" }}
      content={(props) => (
        <MeasureTooltip
          active={props.active}
          payload={props.payload as ReadonlyArray<{ payload?: ChartPoint }>}
          unit={unit}
          xLabel={active?.[1]}
        />
      )}
    />
  );
  const yAxis = {
    width: narrow ? 64 : 76,
    tick: chartTick,
    tickFormatter: (value: number | string) => formatMeasure(value),
    label: {
      value: `Measurement (${unit})`,
      angle: -90,
      position: "insideLeft" as const,
      offset: 12,
      ...axisLabel,
    },
  };
  if (!n || !unit)
    return <p>Insufficient comparable data with reported units.</p>;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const median =
    (values[Math.floor((n - 1) / 2)] + values[Math.floor(n / 2)]) / 2;
  return (
    <section className="panel">
      <h2>Measurements ({unit})</h2>
      <dl className="facts">
        <div>
          <dt>Observations</dt>
          <dd>{n}</dd>
        </div>
        <div>
          <dt>Range</dt>
          <dd>
            {formatMeasure(values[0])}–{formatMeasure(values[n - 1])}
          </dd>
        </div>
        <div>
          <dt>Mean</dt>
          <dd>{formatMeasure(mean)}</dd>
        </div>
        <div>
          <dt>Median</dt>
          <dd>{formatMeasure(median)}</dd>
        </div>
      </dl>
      <div className="catalog-toolbar">
        <label className="sort-select">
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
      </div>
      {active && !paired.length ? (
        <p>No observations include that horizontal measurement.</p>
      ) : (
        <div
          className={
            "plot" +
            (angled ? " plot-angled" : "") +
            (dense ? " plot-dense" : "")
          }
          ref={figure}
        >
          <ResponsiveContainer width="100%" height="100%">
            {active ? (
              timeSeries ? (
                <LineChart
                  data={paired}
                  margin={{ top: 8, right: 16, left: 16, bottom: 16 }}
                >
                  <CartesianGrid stroke="#344357" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={["dataMin", "dataMax"]}
                    tick={chartTick}
                    tickFormatter={(value) => formatMeasure(value)}
                    height={36}
                    label={{
                      value: active[1],
                      position: "insideBottom",
                      offset: -4,
                      ...axisLabel,
                    }}
                  />
                  <YAxis dataKey="value" {...yAxis} />
                  {tooltip}
                  <Line dataKey="value" type="linear" stroke="#ff8738" dot />
                  {brush}
                </LineChart>
              ) : (
                <ScatterChart
                  data={paired}
                  margin={{ top: 8, right: 16, left: 16, bottom: 16 }}
                >
                  <CartesianGrid stroke="#344357" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={["dataMin", "dataMax"]}
                    tick={chartTick}
                    tickFormatter={(value) => formatMeasure(value)}
                    height={36}
                    label={{
                      value: active[1],
                      position: "insideBottom",
                      offset: -4,
                      ...axisLabel,
                    }}
                  />
                  <YAxis dataKey="value" {...yAxis} />
                  {tooltip}
                  <Scatter data={paired} fill="#ff8738" />
                  {brush}
                </ScatterChart>
              )
            ) : (
              <BarChart
                data={points}
                margin={{ top: 8, right: 12, left: 16, bottom: angled ? 28 : 12 }}
              >
                <CartesianGrid vertical={false} stroke="#344357" />
                <XAxis
                  dataKey="name"
                  interval={categoryInterval(n, narrow)}
                  angle={angled ? -32 : 0}
                  textAnchor={angled ? "end" : "middle"}
                  height={angled ? 72 : 40}
                  tick={chartTick}
                  label={{
                    value: "Recorded observation",
                    position: "insideBottom",
                    offset: angled ? -2 : -4,
                    ...axisLabel,
                  }}
                />
                <YAxis {...yAxis} />
                {tooltip}
                <Bar dataKey="value" fill="#ff8738">
                  {points.some((p) => p.uncertainty != null) && (
                    <ErrorBar dataKey="uncertainty" stroke="#ffc76b" />
                  )}
                </Bar>
                {brush}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
      {n === 1 && <p className="muted">One observation is available.</p>}
      {dense && plotted > 0 && (
        <p className="muted">
          {visible} of {plotted} observations in view. Drag the range under
          the chart to zoom.
        </p>
      )}
      <button
        type="button"
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
    </section>
  );
}
export default function Analytics() {
  const { codes } = useSelection();
  const widePicker = useMedia("(min-width: 981px)");
  const v = useVariables(codes);
  const [variable, setVariable] = useState("");
  const validCount = codes.length >= 2 && codes.length <= 25;
  const variableNames = validCount
    ? [...new Set(v.data?.variables.map((x) => x.variable_name))]
    : [];
  const selected = variableNames.includes(variable)
    ? variable
    : variableNames[0] || "";
  const m = useMutation({
    mutationFn: (body: {
      variable_name: string;
      experiment_codes: string[];
      dataset_prefix: string;
    }) => post("/ai/data/compare", body, comparison),
  });
  const rows = m.data?.measurements || [];
  const currentResult =
    m.data &&
    m.variables.variable_name === selected &&
    m.variables.experiment_codes.length === codes.length &&
    m.variables.experiment_codes.every((code) => codes.includes(code));
  return (
    <div className="tool">
      <Header section="Scientific data" title="Data comparison">
        Compare observations by variable and original unit. Each bar represents
        one recorded measurement.
      </Header>
      <div className="tool-split compare-split">
        <section className="panel compare-form">
          <h2>Comparison</h2>
          {validCount && <State query={v} />}
          {validCount && v.error && (
            <p role="alert">
              Could not load shared measured variables. {v.error.message}{" "}
              <button type="button" onClick={() => v.refetch()}>
                Retry
              </button>
            </p>
          )}
          <label>
            Measured variable
            <select
              value={selected}
              aria-describedby="comparison-variable-hint"
              disabled={
                !validCount ||
                v.isPending ||
                Boolean(v.error) ||
                !variableNames.length
              }
              onChange={(e) => setVariable(e.target.value)}
            >
              {!variableNames.length && (
                <option value="">
                  {!validCount
                    ? "Select 2–25 experiments first"
                    : v.isPending
                      ? "Loading shared variables…"
                      : v.error
                        ? "Shared variables unavailable"
                        : "No shared measured variables"}
                </option>
              )}
              {variableNames.map((s) => (
                <option value={s} key={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </label>
          <p id="comparison-variable-hint" className="field-hint" role="status">
            {validCount && v.data && !variableNames.length
              ? "These experiments have no numeric measured variables in common with the same reported unit. Choose different experiments."
              : "Only numeric variables recorded for every selected experiment in the same unit are shown."}
          </p>
          <p className="field-hint">
            <span>Select 2–25 experiments.</span>
            <span>{codes.length} selected</span>
          </p>
          {codes.length > 25 && (
            <p role="alert">Select at most 25 runs for one comparison.</p>
          )}
          {codes.length > 0 && (
            <ul className="weight-list" aria-label="Selected experiments">
              {codes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          )}
          {!codes.length && (
            <p className="muted">
              Choose experiments in the catalog, or pick them from the list.
            </p>
          )}
          <div className="actions">
            <button
              className="primary"
              disabled={
                !selected ||
                !validCount ||
                v.isPending ||
                Boolean(v.error) ||
                m.isPending
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
          </div>
          {m.isPending && <Pending tone="ai" label="Comparing…" />}
          {m.error && (
            <p role="alert">
              Could not compare measurements. {m.error.message}
            </p>
          )}
        </section>
        <section className="panel scope-panel" aria-labelledby="compare-runs">
          <h2 id="compare-runs">Experiments</h2>
          <Picker startOpen={widePicker} />
        </section>
      </div>
      {currentResult && m.data && (
        <>
          <section className="panel">
            <h2>{label(m.variables.variable_name)}</h2>
            <ul className="weight-list">
              {m.variables.experiment_codes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          </section>
          {!rows.length && <p>No matching measurements were returned.</p>}
          {Array.from(
            Map.groupBy(rows, (r) => String(r.unit ?? "")),
            ([unit, group]) => (
              <Plot key={unit} unit={unit} rows={group} />
            ),
          )}
          {rows.length > 0 && (
            <section className="panel">
              <div className="result-heading">
                <h2>Source measurements</h2>
                <button type="button" onClick={() => csv(rows)}>
                  Export CSV
                </button>
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
                        <td className="num">
                          {r.value == null || r.value === ""
                            ? "Not reported"
                            : formatMeasure(r.value)}
                        </td>
                        <td className="num">
                          {r.uncertainty == null || r.uncertainty === ""
                            ? "Not reported"
                            : formatMeasure(r.uncertainty)}
                        </td>
                        <td>{r.unit ?? "Not reported"}</td>
                        <td className="file-name">
                          {r.filename ?? "Not reported"}
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
    </div>
  );
}
