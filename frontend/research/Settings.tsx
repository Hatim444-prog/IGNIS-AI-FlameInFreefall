"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePreference, resetWorkspacePreferences } from "./preferences";
import {
  Palette,
  SlidersHorizontal,
  BrainCircuit,
  Server,
  Database,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Header, State, useSelection } from "./common";
import { useHealth, useDatabase, request, useDocuments } from "./api";
import { useState } from "react";
export function Settings() {
  const [provider, setProvider] = usePreference(
    "ignis_infer_mode",
    "nim-mixed",
  );
  const [theme, setTheme] = usePreference("ignis_theme", "dark");
  const [motion, setMotion] = usePreference("ignis_motion", "system");
  const [sidebar, setSidebar] = usePreference("ignis_sidebar_compact", "false");
  const [dataset, setDataset] = usePreference(
    "ignis_default_dataset",
    "curated",
  );
  const [pageSize, setPageSize] = usePreference("ignis_page_size", "12");
  const [assistantMode, setAssistantMode] = usePreference(
    "ignis_assistant_mode",
    "Hybrid",
  );
  const [apiBase, setApiBase] = usePreference("ignis_api_base", "");
  const [apiDraft, setApiDraft] = useState(apiBase);
  const [connectionError, setConnectionError] = useState("");
  const [notice, setNotice] = useState("");
  const { codes, set: setSelection } = useSelection();
  const client = useQueryClient();
  function save(set: (value: string) => void, value: string) {
    set(value);
    setNotice("Changes saved to this browser.");
  }
  function applyConnection(value: string) {
    let normalized = value.trim().replace(/\/$/, "");
    if (normalized) {
      try {
        const url = new URL(normalized);
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.username ||
          url.password ||
          url.search ||
          url.hash
        )
          throw new Error();
        normalized = url.href.replace(/\/$/, "");
      } catch {
        setConnectionError(
          "Enter an HTTP or HTTPS API address without credentials, query parameters, or a fragment.",
        );
        return;
      }
    }
    setConnectionError("");
    setApiDraft(normalized);
    save(setApiBase, normalized);
    m.reset();
    void client.resetQueries();
  }
  const h = useHealth(),
    d = useDatabase();
  const m = useMutation({
    mutationFn: () =>
      request(
        "/ai/inference/test",
        z.object({
          ok: z.boolean(),
          checks: z.record(
            z.string(),
            z
              .object({
                ok: z.boolean(),
                message: z.string().optional(),
                embed_ok: z.boolean().optional(),
                embed_message: z.string().optional(),
              })
              .passthrough(),
          ),
        }),
        { method: "POST" },
      ),
  });
  return (
    <div className="tool settings-page">
      <Header section="Your workspace" title="Settings">
        Make IGNIS work the way you do. Preferences are saved automatically in
        this browser.
      </Header>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          <a href="#appearance">
            <Palette size={17} /> Appearance
          </a>
          <a href="#research-defaults">
            <SlidersHorizontal size={17} /> Research defaults
          </a>
          <a href="#ai-provider">
            <BrainCircuit size={17} /> AI provider
          </a>
          <a href="#connections">
            <Server size={17} /> Connections
          </a>
          <a href="#local-data">
            <Database size={17} /> Local data
          </a>
        </nav>
        <div className="settings-sections">
          <p className="settings-save-status" role="status">
            {notice || "Preferences stay on this device"}
          </p>
          <section className="panel settings-section" id="appearance">
            <div className="settings-heading">
              <Palette size={21} />
              <div>
                <h2>Appearance</h2>
                <p>Adjust the look and movement of your workspace.</p>
              </div>
            </div>
            <div className="settings-row">
              <div>
                <label htmlFor="settings-theme">Color theme</label>
                <p>Choose a theme or follow your device.</p>
              </div>
              <select
                id="settings-theme"
                value={theme}
                onChange={(e) => save(setTheme, e.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="settings-row">
              <div>
                <label htmlFor="settings-sidebar">Sidebar</label>
                <p>Keep navigation expanded or use compact icons.</p>
              </div>
              <select
                id="settings-sidebar"
                value={sidebar}
                onChange={(e) => save(setSidebar, e.target.value)}
              >
                <option value="false">Expanded</option>
                <option value="true">Compact</option>
              </select>
            </div>
            <div className="settings-row">
              <div>
                <label htmlFor="settings-motion">Motion</label>
                <p>Reduce animation, including the dashboard flame.</p>
              </div>
              <select
                id="settings-motion"
                value={motion}
                onChange={(e) => save(setMotion, e.target.value)}
              >
                <option value="system">Follow device preference</option>
                <option value="reduced">Reduce motion</option>
              </select>
            </div>
          </section>
          <section className="panel settings-section" id="research-defaults">
            <div className="settings-heading">
              <SlidersHorizontal size={21} />
              <div>
                <h2>Research defaults</h2>
                <p>Start new research views with your preferred options.</p>
              </div>
            </div>
            <div className="settings-row">
              <div>
                <label htmlFor="settings-dataset">Default collection</label>
                <p>Used when the explorer has no collection in its link.</p>
              </div>
              <select
                id="settings-dataset"
                value={dataset}
                onChange={(e) => save(setDataset, e.target.value)}
              >
                <option value="curated">Top 150 — most complete</option>
                <option value="all">All experiments</option>
              </select>
            </div>
            <div className="settings-row">
              <div>
                <label htmlFor="settings-page-size">Experiments per page</label>
                <p>Set the number of records in the explorer.</p>
              </div>
              <select
                id="settings-page-size"
                value={pageSize}
                onChange={(e) => save(setPageSize, e.target.value)}
              >
                {[12, 24, 48].map((n) => (
                  <option value={n} key={n}>
                    {n} records
                  </option>
                ))}
              </select>
            </div>
            <div className="settings-row">
              <div>
                <label htmlFor="settings-assistant-mode">
                  Default assistant mode
                </label>
                <p>Document-specific links still open in Paper mode.</p>
              </div>
              <select
                id="settings-assistant-mode"
                value={assistantMode}
                onChange={(e) => save(setAssistantMode, e.target.value)}
              >
                <option value="Paper">Paper</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Multimodal">Multimodal</option>
              </select>
            </div>
          </section>
          <section className="panel settings-section" id="ai-provider">
            <div className="settings-heading">
              <BrainCircuit size={21} />
              <div>
                <h2>AI provider</h2>
                <p>Choose where your questions and media are analyzed.</p>
              </div>
            </div>
            <label>
              Inference provider
              <select
                value={provider}
                onChange={(e) => {
                  save(setProvider, e.target.value);
                  m.reset();
                }}
              >
                <option value="ollama">Local Ollama</option>
                <option value="nim-mixed">
                  NVIDIA chat with local embeddings
                </option>
                <option value="nim">NVIDIA chat and embeddings</option>
              </select>
            </label>
            <p className="muted">
              {provider === "ollama"
                ? "Questions and media are processed by local Ollama models."
                : "Questions and media are sent to the configured NVIDIA service."}{" "}
              The saved visual library uses local Nomic embeddings in every
              mode.
            </p>
            {provider === "nim" && (
              <p className="notice">
                Document search requires embeddings compatible with its existing
                index. Use local embeddings for the current Nomic collection.
              </p>
            )}
            <button disabled={m.isPending} onClick={() => m.mutate()}>
              {m.isPending ? "Testing…" : "Test inference connection"}
            </button>
            {m.error && (
              <p role="alert">Connection test failed. {m.error.message}</p>
            )}
            {m.data && (
              <div className="settings-diagnostics" role="status">
                <strong>
                  {m.data.ok &&
                  Object.values(m.data.checks).every(
                    (check) => check.embed_ok !== false,
                  )
                    ? "Connection checks passed"
                    : "Some services need attention"}
                </strong>
                {Object.entries(m.data.checks).map(([key, check]) => (
                  <div key={key}>
                    <p>
                      <b>
                        {key === "ollama"
                          ? "Local Ollama"
                          : key === "nim"
                            ? "NVIDIA"
                            : key}
                      </b>{" "}
                      · {check.ok ? "Reachable" : "Unavailable"}
                      {check.message ? " — " + check.message : ""}
                    </p>
                    {check.embed_ok === false && (
                      <p>
                        Embedding service unavailable. {check.embed_message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="panel settings-section" id="connections">
            <div className="settings-heading">
              <Server size={21} />
              <div>
                <h2>Connections</h2>
                <p>Check the services behind your research workspace.</p>
              </div>
            </div>
            <div className="settings-service-grid">
              <div className="settings-service">
                <h3>Research API</h3>
                <State query={h} />
                {h.error ? (
                  <p role="alert">Unavailable · {h.error.message}</p>
                ) : (
                  h.data && (
                    <p className="settings-connected">
                      Connected · {h.data.status}
                    </p>
                  )
                )}
                <button
                  disabled={h.isFetching}
                  onClick={() => void h.refetch()}
                >
                  Refresh API
                </button>
              </div>
              <div className="settings-service">
                <h3>Scientific database</h3>
                <State query={d} />
                {d.error ? (
                  <p role="alert">Unavailable · {d.error.message}</p>
                ) : (
                  d.data && (
                    <p className="settings-connected">
                      Connected · {d.data.investigations_in_db} investigations
                    </p>
                  )
                )}
                <button
                  disabled={d.isFetching}
                  onClick={() => void d.refetch()}
                >
                  Refresh database
                </button>
              </div>
            </div>
            {import.meta.env.DEV ? (
              <form
                className="settings-connection-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyConnection(apiDraft);
                }}
              >
                <label>
                  API address
                  <input
                    type="url"
                    value={apiDraft}
                    placeholder="Default workspace connection"
                    onChange={(e) => setApiDraft(e.target.value)}
                  />
                </label>
                <p className="muted">
                  Leave blank to use the workspace proxy. A direct API must
                  allow this site's origin.
                </p>
                {connectionError && <p role="alert">{connectionError}</p>}
                <div className="actions">
                  <button
                    className="primary"
                    type="submit"
                    disabled={apiDraft === apiBase}
                  >
                    Apply connection
                  </button>
                  <button
                    type="button"
                    disabled={!apiBase && !apiDraft}
                    onClick={() => applyConnection("")}
                  >
                    Use default connection
                  </button>
                </div>
              </form>
            ) : (
              <p className="muted">Using the hosted workspace connection.</p>
            )}
          </section>
          <section className="panel settings-section" id="local-data">
            <div className="settings-heading">
              <Database size={21} />
              <div>
                <h2>Local data</h2>
                <p>
                  Manage the preferences and selection stored in this browser.
                </p>
              </div>
            </div>
            <div className="settings-row">
              <div>
                <h3>Experiment selection</h3>
                <p>{codes.length} experiments in your shared shortlist.</p>
              </div>
              <button
                disabled={!codes.length}
                onClick={() => {
                  setSelection([]);
                  setNotice("Experiment selection cleared.");
                }}
              >
                Clear selection
              </button>
            </div>
            <div className="settings-row">
              <div>
                <h3>Restore preferences</h3>
                <p>
                  Reset appearance, research defaults, and AI provider. Your
                  selection and saved research are kept.
                </p>
              </div>
              <button
                onClick={() => {
                  resetWorkspacePreferences();
                  m.reset();
                  setNotice("Default preferences restored.");
                }}
              >
                <RotateCcw size={15} aria-hidden /> Restore defaults
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
export function Sources() {
  const [filter, setFilter] = useState("");
  const documents = useDocuments();
  const matching = documents.data?.filter((d) =>
    d.filename.toLowerCase().includes(filter.trim().toLowerCase()),
  );
  return (
    <>
      <Header section="Library" title="Evidence sources">
        Follow citations from research results to their original records.
      </Header>
      <section className="panel">
        <h2>Indexed research documents</h2>
        <label>
          Find a document
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by filename"
          />
        </label>
        <State query={documents} />
        {matching?.map((d) => (
          <article className="sample" key={d.filename}>
            <h3 className="file-name">{d.filename}</h3>
            <Link to={"/assistant?document=" + encodeURIComponent(d.filename)}>
              Ask about this document →
            </Link>
            <p>
              {d.file_type.toUpperCase()} · {d.passages} indexed passages ·{" "}
              {d.verification_status}
            </p>
            {d.source_url && /^https?:\/\//i.test(d.source_url) && (
              <a href={d.source_url} target="_blank" rel="noreferrer">
                Original source ↗
              </a>
            )}
          </article>
        ))}
        {matching?.length === 0 && <p>No matching indexed documents.</p>}
        <div className="actions">
          <Link to="/assistant">Inspect answer citations →</Link>
          <Link to="/analytics">Inspect measurement sources →</Link>
          <Link to="/media/library">Search visual observations →</Link>
        </div>
      </section>
    </>
  );
}
