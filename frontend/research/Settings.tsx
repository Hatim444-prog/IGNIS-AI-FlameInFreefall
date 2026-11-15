"use client";
import { useMutation } from "@tanstack/react-query";
import { usePreference } from "./preferences";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Header, State } from "./common";
import { useHealth, useDatabase, request, useDocuments } from "./api";
import { useState } from "react";
export function Settings() {
  const [provider, setProvider] = usePreference("ignis_infer_mode", "nim-mixed");
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
              .object({ ok: z.boolean(), message: z.string().optional() })
              .passthrough(),
          ),
        }),
        { method: "POST" },
      ),
  });
  return (
    <>
      <Header section="Integrations" title="Service status">
        Check the API, scientific database and configured inference providers
        independently.
      </Header>
      <div className="grid">
        <section className="panel">
          <h2>FastAPI</h2>
          <p>Same-origin proxy · /ai</p>
          <State query={h} />
          {h.data && <p>API responded · {h.data.status}</p>}
          <button onClick={() => h.refetch()}>Refresh API</button>
        </section>
        <section className="panel">
          <h2>Scientific database</h2>
          <State query={d} />
          {d.data && (
            <p>{d.data.investigations_in_db} investigations indexed</p>
          )}
          <button onClick={() => d.refetch()}>Refresh database</button>
        </section>
      </div>
      <section className="panel">
        <h2>Inference</h2>
        <label>
          Inference provider
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);

              m.reset();
            }}
          >
            <option value="ollama">Local Ollama</option>
            <option value="nim-mixed">NVIDIA chat with local embeddings</option>
            <option value="nim">NVIDIA chat and embeddings</option>
          </select>
        </label>
        <p>
          Answers use NVIDIA when a key is configured. Document search stays on
          the local 768-d index, and falls back to keyword matching if that
          embedding model is offline.
        </p>
        {h.data && (
          <p>
            Configured local models · {h.data.text_model}, {h.data.vision_model}
            , {h.data.embedding_model}
          </p>
        )}
        <button disabled={m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? "Testing…" : "Test inference connection"}
        </button>
        {m.error && <p role="alert">{m.error.message}</p>}
        {m.data &&
          Object.entries(m.data.checks).map(([k, v]) => (
            <p key={k}>
              {k} · {v.ok ? "Reachable" : "Unavailable"} · {v.message}
            </p>
          ))}
      </section>
    </>
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
            <h3>{d.filename}</h3>
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
