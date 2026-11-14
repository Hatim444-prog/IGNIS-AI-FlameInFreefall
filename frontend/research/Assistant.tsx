"use client";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import type { z } from "zod";
import { Header, Picker, EvidenceCards, State, useSelection } from "./common";
import { answer, post, useVariables, download, label } from "./api";
const modes = {
  Paper: "Research document passages",
  Hybrid: "Passages and measured variables",
  Multimodal: "Passages, measurements and visual observations",
};
type Mode = keyof typeof modes;
type Reply = z.infer<typeof answer>;
type Turn = { question: string; mode: Mode; reply?: Reply; error?: string };
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
export default function Assistant() {
  const { codes } = useSelection(),
    vars = useVariables();
  const [mode, choose] = useState<Mode>("Hybrid"),
    [question, edit] = useState(""),
    [variable, select] = useState(""),
    [turns, setTurns] = useState<Turn[]>([]),
    [busy, wait] = useState(false),
    [copied, copy] = useState<number | null>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
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
      const reply =
        mode === "Paper"
          ? await post("/ai/ask", { question: text }, answer, signal)
          : mode === "Hybrid"
            ? await post(
                "/ai/ask-hybrid",
                {
                  question: text,
                  experiment_codes: codes,
                  variable_name: variable || null,
                  dataset_prefix: "",
                  max_experiments: 20,
                  top_k_papers: 4,
                },
                answer,
                signal,
              )
            : await post(
                "/ai/ask-multimodal",
                {
                  question: text,
                  experiment_codes: codes,
                  top_k_visual: 3,
                  top_k_papers: 4,
                },
                answer,
                signal,
              );
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
  return (
    <>
      <Header section="Evidence workspace" title="Research assistant">
        Ask a question and inspect the passages, measurements and visual
        observations behind the answer.
      </Header>
      <section className="panel">
        <div className="grid">
          {(Object.keys(modes) as Mode[]).map((m) => (
            <button
              key={m}
              className={mode === m ? "primary" : ""}
              aria-pressed={mode === m}
              onClick={() => choose(m)}
            >
              <b>{m}</b>
              <br />
              {modes[m]}
            </button>
          ))}
        </div>
        {mode !== "Paper" && (
          <>
            <Picker />
            {!codes.length && (
              <p className="muted">
                Select experiment codes to ground the question in specific runs.
              </p>
            )}
            {codes.length > max && (
              <p role="alert">Select at most {max} runs for this mode.</p>
            )}
          </>
        )}
        {mode === "Hybrid" && (
          <>
            <State query={vars} />
            <label>
              Measurement focus
              <select value={variable} onChange={(e) => select(e.target.value)}>
                <option value="">Infer from question</option>
                {[
                  ...new Set(vars.data?.variables.map((v) => v.variable_name)),
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </>
        )}
      </section>
      {turns.map((t, i) => (
        <article key={i} className="panel">
          <small>{t.mode} · Your question</small>
          <h2 className="question">{t.question}</h2>
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
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(markdown(t))
                      .then(() => copy(i))
                  }
                >
                  {copied === i ? "Copied" : "Copy with citations"}
                </button>
                <button
                  onClick={() =>
                    download("ignis-answer.md", markdown(t), "text/markdown")
                  }
                >
                  Export Markdown
                </button>
              </div>
            </>
          )}
        </article>
      ))}
      <form
        className="panel"
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
            onChange={(e) => edit(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() =>
            edit(
              "What limits our confidence in the reported flame spread measurements?",
            )
          }
        >
          Use suggested question
        </button>
        <div className="actions">
          <button
            className="primary"
            disabled={busy || (mode !== "Paper" && codes.length > max)}
          >
            {busy ? "Waiting for evidence…" : "Send question"}
          </button>
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
        </div>
      </form>
    </>
  );
}
