import { usePreference } from "./preferences";
import { Link } from "react-router-dom";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useExperiments, label, origin, type Evidence } from "./api";
export function Header({
  section,
  title,
  children,
}: {
  section: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="head">
      <small>{section}</small>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}
export function State({
  query,
}: {
  query: { isPending: boolean; error: Error | null; refetch: () => unknown };
}) {
  if (query.error)
    return (
      <div role="alert" className="notice">
        {query.error.message}{" "}
        <button onClick={() => query.refetch()}>Retry</button>
      </div>
    );
  return query.isPending ? (
    <p role="status" className="loading">
      Loading research data…
    </p>
  ) : null;
}
const Selection = createContext<{
  codes: string[];
  set: (codes: string[]) => void;
}>({ codes: [], set: () => {} });
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [stored, save] = usePreference("ignis_selected_experiment_codes", "[]");
  const codes = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.filter((c) => typeof c === "string")
        : [];
    } catch {
      return [];
    }
  }, [stored]);
  function set(next: string[]) {
    save(JSON.stringify(next));
  }
  return (
    <Selection.Provider value={{ codes, set }}>{children}</Selection.Provider>
  );
}
// The context hook shares this provider module.
// oxlint-disable-next-line react/only-export-components
export const useSelection = () => useContext(Selection);
export function Picker() {
  const q = useExperiments();
  const { codes, set } = useSelection();
  return (
    <details className="picker">
      <summary>Experiment selection · {codes.length}</summary>
      <State query={q} />
      <div className="checks">
        {q.data?.experiments.map((e) => (
          <label key={e.experiment_code}>
            <input
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
            {e.experiment_code}
          </label>
        ))}
      </div>
      {codes.length > 0 && (
        <button onClick={() => set([])}>Clear selection</button>
      )}
    </details>
  );
}
export function RunLink({ code }: { code: string }) {
  return (
    <Link className="mono" to={"/experiments/" + encodeURIComponent(code)}>
      {code}
    </Link>
  );
}
export function Fields({ row }: { row: Evidence }) {
  return (
    <dl className="facts">
      {Object.entries(row).map(([k, v]) => (
        <div key={k}>
          <dt>{label(k)}</dt>
          <dd>{v == null ? "Not reported" : String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
export function EvidenceCards({ rows }: { rows: Evidence[] }) {
  return (
    <div>
      {rows.map((r, i) => (
        <details className="evidence" key={i}>
          <summary>
            {[
              r.citation ?? r.reference,
              r.file ?? r.source ?? r.filename ?? r.experiment_code,
              r.page != null ? "p. " + r.page : null,
            ]
              .filter((v) => v != null)
              .join(" · ") || "Observation"}
          </summary>
          {r.experiment_code && (
            <p>
              <RunLink code={String(r.experiment_code)} /> ·{" "}
              {origin(r.experiment_code)}
            </p>
          )}
          <Fields row={r} />
        </details>
      ))}
    </div>
  );
}
