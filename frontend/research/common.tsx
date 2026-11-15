import { usePreference } from "./preferences";
import { Link } from "react-router-dom";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAllExperiments, label, origin, type Evidence } from "./api";
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
export function Pending({
  label = "Loading research data…",
  tone = "data",
}: {
  label?: string;
  tone?: "data" | "ai";
}) {
  return (
    <p role="status" className={"loading" + (tone === "ai" ? " loading-ai" : "")}>
      <span className={"loader" + (tone === "ai" ? " ai" : "")} aria-hidden />
      {label}
    </p>
  );
}
export function State({
  query,
}: {
  query: { isPending: boolean; error: Error | null; refetch: () => unknown };
}) {
  if (query.error) return null;
  return query.isPending ? <Pending /> : null;
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
// oxlint-disable-next-line react/only-export-components
export function useMedia(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const apply = () => setMatches(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [query]);
  return matches;
}
export function Picker({
  suppressStatus = false,
  startOpen = false,
}: {
  suppressStatus?: boolean;
  startOpen?: boolean;
}) {
  const q = useAllExperiments();
  const { codes, set } = useSelection();
  const [filter, setFilter] = useState("");
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (details.current) details.current.open = startOpen;
  }, [startOpen]);
  const query = filter.trim().toLowerCase();
  const experiments = q.data?.filter((e) =>
    e.experiment_code.toLowerCase().includes(query),
  );
  return (
    <details className="picker" ref={details}>
      <summary>Experiment selection · {codes.length}</summary>
      {!(suppressStatus && (q.error || q.isPending)) && <State query={q} />}
      <label>
        Filter experiments
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </label>
      {experiments?.length === 0 && (
        <p className="empty-result">No experiments match that filter.</p>
      )}
      <div className="checks">
        {experiments?.map((e) => (
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
        <button type="button" onClick={() => set([])}>
          Clear selection
        </button>
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
              {origin({
                investigation_code:
                  typeof r.investigation_code === "string"
                    ? r.investigation_code
                    : null,
                experiment_code: String(r.experiment_code),
              })}
            </p>
          )}
          <Fields row={Object.fromEntries(Object.entries(r).filter(([key]) => ![
            "observation_id", "source_id", "experiment_id", "model", "model_name",
            "embedding", "local_path", "sha256", "media_url", "media_type",
          ].includes(key)))} />
        </details>
      ))}
    </div>
  );
}
