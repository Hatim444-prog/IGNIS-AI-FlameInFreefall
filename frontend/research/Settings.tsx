"use client";
import { useMutation } from "@tanstack/react-query";
import { usePreference } from "./preferences";
import Link from "next/link";
import { z } from "zod";
import { Header, State } from "./common";
import { useHealth, useDatabase, request } from "./api";
export function Settings() {
  const [provider, setProvider] = usePreference("ignis_infer_mode", "ollama");
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
  return (
    <>
      <Header section="Library" title="Evidence sources">
        Follow citations from research results to their original records.
      </Header>
      <section className="panel">
        <h2>Source access</h2>
        <p>
          The installed API provides citations with answers and measurements. A
          searchable inventory of all files and secure PDF page links require
          additional backend endpoints.
        </p>
        <div className="actions">
          <Link href="/assistant">Inspect answer citations →</Link>
          <Link href="/analytics">Inspect measurement sources →</Link>
          <Link href="/media/library">Search visual observations →</Link>
        </div>
      </section>
    </>
  );
}
