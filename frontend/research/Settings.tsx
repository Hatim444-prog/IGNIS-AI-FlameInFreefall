"use client";
import { usePreference, resetWorkspacePreferences } from "./preferences";
import { Palette, SlidersHorizontal, Database, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Header, State, useSelection } from "./common";
import { useDocuments } from "./api";
import { useState } from "react";
export function Settings() {
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
  const [notice, setNotice] = useState("");
  const { codes, set: setSelection } = useSelection();
  function save(set: (value: string) => void, value: string) {
    set(value);
    setNotice("Changes saved to this browser.");
  }
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
          <a href="#local-data">
            <Database size={17} /> Saved preferences
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
          <section className="panel settings-section" id="local-data">
            <div className="settings-heading">
              <Database size={21} />
              <div>
                <h2>Saved preferences</h2>
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
                  Reset appearance and research defaults. Your selection and
                  saved research are kept.
                </p>
              </div>
              <button
                onClick={() => {
                  resetWorkspacePreferences();
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
        <h2>Research documents</h2>
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
              {d.file_type.toUpperCase()} · {d.passages} searchable passages ·{" "}
              {d.verification_status}
            </p>
            {d.source_url && /^https?:\/\//i.test(d.source_url) && (
              <a href={d.source_url} target="_blank" rel="noreferrer">
                Original source ↗
              </a>
            )}
          </article>
        ))}
        {matching?.length === 0 && <p>No matching documents.</p>}
        <div className="actions">
          <Link to="/assistant">Inspect answer citations →</Link>
          <Link to="/analytics">Inspect measurement sources →</Link>
          <Link to="/media/library">Search visual observations →</Link>
        </div>
      </section>
    </>
  );
}
