"use client";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ScanLine } from "lucide-react";
import type { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Header, State, EvidenceCards, Pending } from "./common";
import { isDirectApiConfigured } from "../src/lib/inference.js";
import {
  request,
  observation,
  useAllExperiments,
  visuals,
  uploadObservation,
} from "./api";

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function Media() {
  const ex = useAllExperiments();
  const [file, pick] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [code, select] = useState(""),
    [error, fail] = useState(""),
    [result, show] = useState<z.infer<typeof observation> | null>(null),
    [busy, wait] = useState(false),
    [over, setOver] = useState(false);
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
    setOver(false);
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
    if (!isDirectApiConfigured() && f.size > 4 * 1024 * 1024)
      return fail(
        "Uploads through the Vercel proxy must be under 4 MiB. Compress or trim the file and try again.",
      );
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
    <div className="tool">
      <Header title="Media laboratory" section="Visual evidence">
        Inspect qualitative observations from combustion imagery. Calibrated
        measurements require instrumentation.
      </Header>
      <div className="tool-split media-split">
        <section className="panel">
          <label
            className={"drop" + (over ? " is-over" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              if (!busy) setOver(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                setOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              choose(e.dataTransfer.files[0]);
            }}
          >
            <ScanLine size={22} strokeWidth={1.6} aria-hidden />
            <strong>{file ? "Replace media" : "Drop media or choose a file"}</strong>
            <span className="muted">
              JPEG or PNG up to 10 MiB · MP4 up to 30 MiB
            </span>
            <input
              type="file"
              className="sr-only"
              disabled={busy}
              accept="image/jpeg,image/png,video/mp4"
              onChange={(e) => {
                choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {preview && file && (
            <div className="stage">
              {file.type === "video/mp4" ? (
                <video controls className="preview" src={preview} />
              ) : (
                <img
                  className="preview"
                  src={preview}
                  alt={"Selected upload: " + file.name}
                />
              )}
            </div>
          )}
          {file && (
            <p className="file-meta">
              {file.name}
              <span>
                {file.type === "video/mp4" ? "MP4" : "Image"} · {formatSize(file.size)}
              </span>
            </p>
          )}
          {busy && (
            <>
              <div
                className="upload-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Upload progress"
              >
                <span style={{ transform: `scaleX(${progress / 100})` }} />
              </div>
              <Pending
                tone={progress === 100 ? "ai" : "data"}
                label={
                  progress === 100
                    ? "Upload complete. Waiting for visual analysis…"
                    : "Uploading media · " + progress + "%"
                }
              />
            </>
          )}
          {error && (
            <p className="notice" role="alert">
              {error}
            </p>
          )}
        </section>
        <section className="panel">
          <h2>Analysis</h2>
          <p className="muted">
            Analyze only keeps the observation on this page. Analyze and save
            stores an unverified record.
          </p>
          <State query={ex} />
          <label>
            Associated experiment
            <select
              value={code}
              disabled={busy}
              onChange={(e) => select(e.target.value)}
            >
              <option value="">Unverified · no association</option>
              {ex.data?.map((r) => (
                <option key={r.experiment_code}>{r.experiment_code}</option>
              ))}
            </select>
          </label>
          <div className="choice-actions">
            <div>
              <button
                className="primary"
                disabled={!file || busy}
                aria-describedby="analyze-only-hint"
                onClick={() => analyze(false)}
              >
                Analyze only
              </button>
              <p id="analyze-only-hint">Does not write to the database.</p>
            </div>
            <div>
              <button
                disabled={!file || busy}
                aria-describedby="analyze-save-hint"
                onClick={() => analyze(true)}
              >
                Analyze and save
              </button>
              <p id="analyze-save-hint">Stores an unverified observation.</p>
            </div>
          </div>
          <div className="actions">
            {busy ? (
              <button type="button" onClick={() => pending.current?.abort()}>
                Cancel request
              </button>
            ) : (
              <button type="button" disabled={!file} onClick={() => choose()}>
                Reset
              </button>
            )}
          </div>
        </section>
      </div>
      {result && (
        <section className="panel result-panel">
          <div className="result-heading">
            <div>
              <small>Qualitative observation</small>
              <h2>{result.file_name}</h2>
            </div>
            <p className="status-pill">
              {result.persisted_to_database
                ? "Saved · " + (result.review_status || "Unverified")
                : "Analysis only"}
            </p>
          </div>
          <p>{result.description}</p>
          {result.approx_timestamps_s && (
            <p className="muted">
              Sample times (s) · {result.approx_timestamps_s.join(", ")}
            </p>
          )}
        </section>
      )}
      <Link className="library-link" to="/media/library">
        Search visual evidence
        <ArrowRight size={16} aria-hidden />
      </Link>
    </div>
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
    <div className="tool">
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
            placeholder="Spherical flame around a thin fuel sample"
            onChange={(e) => edit(e.target.value)}
          />
        </label>
        <div className="actions">
          <button className="primary" disabled={!query.trim() || m.isPending}>
            {m.isPending ? "Searching…" : "Search library"}
          </button>
          <Link to="/media">Analyze media →</Link>
        </div>
        {m.isPending && <Pending tone="ai" label="Searching the visual library…" />}
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
            <p className="empty-result">No matching visual observations.</p>
          )}
        </section>
      )}
    </div>
  );
}
