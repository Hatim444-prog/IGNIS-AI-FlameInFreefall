"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Header, State, EvidenceCards } from "./common";
import {
  request,
  observation,
  useExperiments,
  visuals,
  uploadObservation,
} from "./api";
export function Media() {
  const ex = useExperiments();
  const [file, pick] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [code, select] = useState(""),
    [error, fail] = useState(""),
    [result, show] = useState<z.infer<typeof observation> | null>(null),
    [busy, wait] = useState(false);
  const [progress, setProgress] = useState(0);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  function choose(f?: File) {
    if (busy) return;
    show(null);
    fail("");
    pick(null);
    setPreview("");
    if (!f) return;
    const video = f.type === "video/mp4";
    if (
      !["image/jpeg", "image/png", "video/mp4"].includes(f.type) ||
      (video && !f.name.toLowerCase().endsWith(".mp4"))
    )
      return fail("Choose a JPEG, PNG or MP4 file.");
    if (!f.size || f.size > (video ? 30 : 10) * 1024 * 1024)
      return fail("File is empty or exceeds the size limit.");
    pick(f);
    setPreview(URL.createObjectURL(f));
  }
  async function analyze(save: boolean) {
    if (!file || busy) return;
    wait(true);
    setProgress(0);
    fail("");
    show(null);
    const controller = new AbortController();
    pending.current = controller;
    const body = new FormData();
    body.append("file", file);
    if (code) body.append("experiment_code", code);
    const kind = file.type === "video/mp4" ? "video" : "image";
    try {
      show(
        await uploadObservation(
          save ? `/ai/vision/store-${kind}` : `/ai/vision/${kind}`,
          body,
          controller.signal,
          setProgress,
        ),
      );
    } catch (e) {
      fail((e as Error).message);
    } finally {
      wait(false);
      pending.current = null;
    }
  }
  return (
    <>
      <Header title="Media laboratory" section="Visual evidence">
        Inspect qualitative observations from combustion imagery. Calibrated
        measurements require instrumentation.
      </Header>
      <section className="panel">
        <label
          className="drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            choose(e.dataTransfer.files[0]);
          }}
        >
          Drop media or choose a file
          <span className="muted">
            JPEG or PNG up to 10 MiB · MP4 up to 30 MiB
          </span>
          <input
            type="file"
            disabled={busy}
            accept="image/jpeg,image/png,video/mp4"
            onChange={(e) => {
              choose(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {preview && file && (
          <>
            {file.type === "video/mp4" ? (
              <video controls className="preview" src={preview} />
            ) : (
              <img
                className="preview"
                src={preview}
                alt={"Selected upload: " + file.name}
              />
            )}
            <p>{file.name}</p>
          </>
        )}
        <State query={ex} />
        <label>
          Associated experiment
          <select
            value={code}
            disabled={busy}
            onChange={(e) => select(e.target.value)}
          >
            <option value="">Unverified · no association</option>
            {ex.data?.experiments.map((r) => (
              <option key={r.experiment_code}>{r.experiment_code}</option>
            ))}
          </select>
        </label>
        <div className="actions">
          <button
            className="primary"
            disabled={!file || busy}
            onClick={() => analyze(false)}
          >
            Analyze only
          </button>
          <button disabled={!file || busy} onClick={() => analyze(true)}>
            Analyze and save
          </button>
          {busy ? (
            <button onClick={() => pending.current?.abort()}>
              Cancel request
            </button>
          ) : (
            <button disabled={!file} onClick={() => choose()}>
              Reset
            </button>
          )}
        </div>
        {busy && (
          <p role="status">
            {progress === 100
              ? "Upload complete. Waiting for visual analysis…"
              : "Uploading media · " + progress + "%"}
          </p>
        )}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
      </section>
      {result && (
        <section className="panel">
          <small>Qualitative observation</small>
          <h2>{result.file_name}</h2>
          <p>{result.description}</p>
          <p>
            {result.persisted_to_database
              ? "Saved · " + (result.review_status || "Unverified")
              : "Analysis only"}
          </p>
          {result.approx_timestamps_s && (
            <p>Sample times (s) · {result.approx_timestamps_s.join(", ")}</p>
          )}
        </section>
      )}
      <Link href="/media/library">Search visual evidence →</Link>
    </>
  );
}
export function Library() {
  const [query, edit] = useState(""),
    [filter, select] = useState("");
  const m = useMutation({
    mutationFn: (q: string) =>
      request(
        "/ai/vision/search",
        visuals,
        {},
        "?limit=10&q=" + encodeURIComponent(q),
      ),
  });
  const rows = m.data?.results || [];
  const shown = rows.filter((r) => !filter || r.verification_status === filter);
  return (
    <>
      <Header section="Library" title="Visual evidence">
        Search stored observations by semantic similarity. Review status and
        experiment linkage accompany each returned source.
      </Header>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          select("");
          m.mutate(query.trim());
        }}
      >
        <label>
          Describe a visual observation
          <input
            type="search"
            required
            maxLength={1500}
            value={query}
            onChange={(e) => edit(e.target.value)}
          />
        </label>
        <div className="actions">
          <button className="primary" disabled={!query.trim() || m.isPending}>
            {m.isPending ? "Searching…" : "Search library"}
          </button>
          <Link href="/media">Analyze media →</Link>
        </div>
      </form>
      {m.error && (
        <p role="alert" className="notice">
          {m.error.message}
        </p>
      )}
      {m.data && (
        <section className="panel">
          <h2>Results for “{m.variables}”</h2>
          <label>
            Verification
            <select value={filter} onChange={(e) => select(e.target.value)}>
              <option value="">All statuses</option>
              {[
                ...new Set(
                  rows.flatMap((r) =>
                    typeof r.verification_status === "string"
                      ? [r.verification_status]
                      : [],
                  ),
                ),
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {shown.length ? (
            <EvidenceCards rows={shown} />
          ) : (
            <p>No matching visual observations.</p>
          )}
        </section>
      )}
    </>
  );
}
