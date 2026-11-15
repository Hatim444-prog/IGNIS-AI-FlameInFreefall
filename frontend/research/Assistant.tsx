"use client";
import { useEffect, useRef, useState } from "react";
import { Copy, Download, FileText, FlaskConical, ScanLine } from "lucide-react";
import Markdown from "react-markdown";
import { useSearchParams } from "react-router-dom";
import type { z } from "zod";
import { Header, Picker, EvidenceCards, Pending, useSelection } from "./common";
import {
  answer,
  post,
  useVariables,
  useDocuments,
  useAllExperiments,
  download,
  label,
} from "./api";

const modeMeta = {
  Paper: {
    text: "Research document passages",
    Icon: FileText,
  },
  Hybrid: {
    text: "Passages and measured variables",
    Icon: FlaskConical,
  },
  Multimodal: {
    text: "Passages, measurements and visual observations",
    Icon: ScanLine,
  },
} as const;
type Mode = keyof typeof modeMeta;
type Reply = z.infer<typeof answer>;
type Turn = { question: string; mode: Mode; reply?: Reply; error?: string };
const suggested =
  "What limits our confidence in the reported flame spread measurements?";

function citations(r: Reply) {
  return [
    ["Paper passages", r.sources ?? r.paper_sources],
    ["Source measurements", r.measurements ?? r.measurement_sources],
    ["Visual interpretations", r.visual_sources],
  ] as const;
}
function markdown(t: Turn) {
  if (!t.reply) return "";
  return [
    "# " + t.question,
    t.reply.answer,
    ...citations(t.reply).flatMap(([name, rows]) =>
      rows?.length
        ? [
            "## " + name,
            ...rows.map((r) =>
              Object.entries(r)
                .filter(([, v]) => v != null)
                .map(([k, v]) => label(k) + " " + v)
                .join(" · "),
            ),
          ]
        : [],
    ),
    ...(t.reply.warnings || []),
    ...(t.reply.limitations || []),
  ].join("\n\n");
}
function documentScope(names: string[]) {
  if (!names.length) return "All indexed documents";
  if (names.length === 1) return names[0];
  return names.length + " documents";
}

export default function Assistant() {
  const documents = useDocuments();
  const experiments = useAllExperiments();
  const [params, setParams] = useSearchParams();
  const documentNames = [...new Set(params.getAll("document").filter(Boolean))];
  function scope(names: string[]) {
    const next = new URLSearchParams(params);
    next.delete("document");
    names.forEach((name) => next.append("document", name));
    setParams(next, { replace: true });
  }
  const { codes } = useSelection(),
    vars = useVariables();
  const [mode, choose] = useState<Mode>(
      documentNames.length ? "Paper" : "Hybrid",
    ),
    [question, edit] = useState(""),
    [variable, select] = useState(""),
    [turns, setTurns] = useState<Turn[]>([]),
    [busy, wait] = useState(false),
    [copied, copy] = useState<number | null>(null);
  const pending = useRef<AbortController | null>(null);
  const thread = useRef<HTMLElement>(null);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    const last = thread.current?.lastElementChild;
    if (!last) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    last.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [turns]);
  async function ask() {
    const text = question.trim();
    if (text.length < 3 || busy) return;
    const turn = { question: text, mode };
    const controller = new AbortController();
    pending.current = controller;
    wait(true);
    edit("");
    setTurns((t) => [...t, turn]);
    try {
      const signal = controller.signal;
      let reply: Reply;
      switch (mode) {
        case "Paper":
          reply = await post(
            "/ai/ask",
            { question: text, document_names: documentNames },
            answer,
            signal,
          );
          break;
        case "Hybrid":
          reply = await post(
            "/ai/ask-hybrid",
            {
              question: text,
              document_names: documentNames,
              experiment_codes: codes,
              variable_name: variable || null,
              dataset_prefix: "",
              max_experiments: 20,
              top_k_papers: 4,
            },
            answer,
            signal,
          );
          break;
        case "Multimodal":
          reply = await post(
            "/ai/ask-multimodal",
            {
              question: text,
              document_names: documentNames,
              experiment_codes: codes,
              top_k_visual: 3,
              top_k_papers: 4,
            },
            answer,
            signal,
          );
          break;
        default: {
          const unreachable: never = mode;
          throw new Error(unreachable);
        }
      }
      setTurns((t) => [...t.slice(0, -1), { ...turn, reply }]);
    } catch (e) {
      setTurns((t) => [
        ...t.slice(0, -1),
        { ...turn, error: (e as Error).message },
      ]);
      edit(text);
    } finally {
      pending.current = null;
      wait(false);
    }
  }
  const max = mode === "Multimodal" ? 10 : 25;
  const overLimit = mode !== "Paper" && codes.length > max;
  const scopeError =
    documents.error ||
    experiments.error ||
    (mode === "Hybrid" ? vars.error : null);
  const scopePending =
    !scopeError &&
    (documents.isPending ||
      experiments.isPending ||
      (mode === "Hybrid" && vars.isPending));
  const variables = [
    ...new Set(vars.data?.variables.map((v) => v.variable_name)),
  ];
  return (
    <div className="tool">
      <Header section="Evidence workspace" title="Research assistant">
        Ask a question and inspect the passages, measurements and visual
        observations behind the answer.
      </Header>
      <div className="mode-grid" role="group" aria-label="Evidence mode">
        {(Object.keys(modeMeta) as Mode[]).map((m) => {
          const Icon = modeMeta[m].Icon;
          return (
            <button
              key={m}
              type="button"
              className={"mode-card" + (mode === m ? " is-selected" : "")}
              aria-pressed={mode === m}
              onClick={() => choose(m)}
            >
              <Icon size={18} strokeWidth={1.7} aria-hidden />
              <span>
                <b>{m}</b>
                {modeMeta[m].text}
              </span>
            </button>
          );
        })}
      </div>
      <div className="tool-split">
        <form
          className="panel composer"
          aria-busy={busy}
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
        >
          <label>
            Research question
            <textarea
              placeholder="What do the selected measurements show?"
              value={question}
              minLength={3}
              maxLength={1500}
              required
              aria-describedby="question-hint"
              onChange={(e) => edit(e.target.value)}
            />
          </label>
          <p id="question-hint" className="field-hint">
            <span>
              {question.trim().length < 3
                ? "Enter at least 3 characters."
                : modeMeta[mode].text}
            </span>
            <span>
              {question.length} / 1500
            </span>
          </p>
          <button
            type="button"
            className="prompt"
            onClick={() => edit(suggested)}
          >
            <span className="prompt-label">Use suggested question</span>
            <span className="prompt-text">{suggested}</span>
          </button>
          {overLimit && (
            <p role="alert">Select at most {max} runs for this mode.</p>
          )}
          <div className="actions composer-actions">
            {busy && (
              <button type="button" onClick={() => pending.current?.abort()}>
                Cancel
              </button>
            )}
            {turns.length > 0 && !busy && (
              <button type="button" onClick={() => setTurns([])}>
                Clear conversation
              </button>
            )}
            <button className="primary" disabled={busy || overLimit}>
              {busy ? "Waiting for evidence…" : "Send question"}
            </button>
          </div>
        </form>
        <section className="panel scope-panel" aria-labelledby="evidence-scope">
          <h2 id="evidence-scope">Evidence scope</h2>
          <p className="muted">{modeMeta[mode].text}</p>
          {scopeError && (
            <div role="alert" className="notice">
              {scopeError.message}{" "}
              <button
                type="button"
                onClick={() => {
                  void documents.refetch();
                  void experiments.refetch();
                  void vars.refetch();
                }}
              >
                Retry
              </button>
            </div>
          )}
          {scopePending && <Pending />}
          <details className="picker">
            <summary>Document search · {documentScope(documentNames)}</summary>
            <div className="checks">
              {documents.data?.map((d) => (
                <label key={d.filename}>
                  <input
                    type="checkbox"
                    checked={documentNames.includes(d.filename)}
                    onChange={(e) =>
                      scope(
                        e.target.checked
                          ? [...documentNames, d.filename]
                          : documentNames.filter((n) => n !== d.filename),
                      )
                    }
                  />
                  {d.filename}
                </label>
              ))}
            </div>
            {documentNames.length > 0 && (
              <button type="button" onClick={() => scope([])}>
                Search all documents
              </button>
            )}
          </details>
          {mode !== "Paper" && (
            <>
              <Picker suppressStatus />
              {!codes.length && (
                <p className="muted">
                  Select experiment codes to ground the question in specific
                  runs.
                </p>
              )}
            </>
          )}
          {mode === "Hybrid" && (
            <label>
              Measurement focus
              <select
                value={variable}
                onChange={(e) => select(e.target.value)}
                disabled={vars.isPending || Boolean(vars.error)}
              >
                <option value="">Infer from question</option>
                {variables.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          )}
        </section>
      </div>
      {turns.length > 0 && (
        <section className="thread" ref={thread} aria-label="Answers">
          {turns.map((t, i) => (
            <article key={i} className="panel">
              <small>
                {t.mode} · Your question
              </small>
              <h2 className="question">{t.question}</h2>
              {!t.reply && !t.error && (
                <Pending tone="ai" label="Waiting for evidence…" />
              )}
              {t.error && (
                <p className="notice" role="alert">
                  {t.error}
                </p>
              )}
              {t.reply && (
                <>
                  <small>AI interpretation · {t.reply.model}</small>
                  <div className="prose">
                    <Markdown>{t.reply.answer}</Markdown>
                  </div>
                  {citations(t.reply).map(([name, rows]) =>
                    rows?.length ? (
                      <section key={name}>
                        <h3>{name}</h3>
                        <EvidenceCards rows={rows} />
                      </section>
                    ) : null,
                  )}
                  {[
                    ...(t.reply.warnings || []),
                    ...(t.reply.limitations || []),
                  ].map((w) => (
                    <p className="notice" key={w}>
                      {w}
                    </p>
                  ))}
                  <div className="actions">
                    <button
                      type="button"
                      onClick={() =>
                        void navigator.clipboard
                          .writeText(markdown(t))
                          .then(() => copy(i))
                      }
                    >
                      <Copy size={15} aria-hidden />
                      {copied === i ? "Copied" : "Copy with citations"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        download(
                          "ignis-answer.md",
                          markdown(t),
                          "text/markdown",
                        )
                      }
                    >
                      <Download size={15} aria-hidden />
                      Export Markdown
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
