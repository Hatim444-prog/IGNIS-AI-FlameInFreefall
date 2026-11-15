"use client";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { z } from "zod";
import { Header, Fields, RunLink, Pending } from "./common";
import { post, evidence, label, download, type Models } from "./api";

const environments = [
  "pressurized_lunar_rover",
  "lunar_habitat",
  "mars_habitat",
  "spacecraft",
  "space_station",
] as const;
const focuses = [
  ["suppression", "Suppression"],
  ["prevention", "Prevention"],
  ["detection", "Detection"],
] as const;
const candidate = z.object({
  investigation_title: z.string(),
  investigation_code: z.string(),
  experiment_code: z.string().nullable(),
  investigation_url: z.string().nullable(),
  ranking_score: z.number(),
  evidence_coverage_percent: z.number(),
  experiment_conditions: evidence,
  score_dimensions: z.record(z.string(), z.number().nullable()),
  source_file_count: z.number(),
  reviewed_source_count: z.number(),
  limitations: z.array(z.string()),
});
const result = z.object({
  scenario: evidence,
  weights: z.record(z.string(), z.number()),
  ranked_nasa_investigations: z.array(candidate),
  related_external_research: z.array(candidate),
  warnings: z.array(z.string()),
  result_status: z.string(),
});
const defaults: Models["MissionRequest"] = {
  environment: "pressurized_lunar_rover",
  research_focus: "suppression",
  oxygen_percent: 32,
  pressure_psi: 12.2,
  max_results: 10,
  fuel_material: "",
  include_external_research: true,
};
function titleCase(value: string) {
  return label(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function percent(value: number) {
  return Math.max(0, Math.min(100, value));
}
function Candidate({
  row,
  rank,
  weights,
}: {
  row: z.infer<typeof candidate>;
  rank: number;
  weights: Record<string, number>;
}) {
  return (
    <article className="panel candidate">
      <div className="candidate-top">
        <span className="rank" aria-hidden>
          {rank}
        </span>
        <span className="sr-only">Rank {rank}.</span>
        <div className="candidate-copy">
          <small>{row.investigation_code}</small>
          <h3>{row.investigation_title}</h3>
        </div>
        <p className="score-readout">
          <strong>{row.ranking_score}</strong>
          <span>/ 100</span>
        </p>
      </div>
      <div className="meter">
        <div className="meter-label">
          <span>Ranking score</span>
          <span>{row.ranking_score} / 100</span>
        </div>
        <div className="coverage-track" aria-hidden="true">
          <span style={{ width: percent(row.ranking_score) + "%" }} />
        </div>
      </div>
      <div className="meter">
        <div className="meter-label">
          <span>Evidence coverage</span>
          <span>{row.evidence_coverage_percent}%</span>
        </div>
        <div className="coverage-track" aria-hidden="true">
          <span style={{ width: percent(row.evidence_coverage_percent) + "%" }} />
        </div>
      </div>
      <p className="muted">
        Reviewed files {row.reviewed_source_count}/{row.source_file_count}
      </p>
      {row.experiment_code && <RunLink code={row.experiment_code} />}
      <details className="picker">
        <summary>Experimental conditions and score breakdown</summary>
        <Fields row={row.experiment_conditions} />
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Weight</th>
                <th>Match</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(weights).map(([k, w]) => (
                <tr key={k}>
                  <td>{label(k)}</td>
                  <td>{w}%</td>
                  <td>
                    {row.score_dimensions[k] == null
                      ? "Unknown"
                      : Math.round(row.score_dimensions[k] * 100) + "%"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {row.limitations.map((s) => (
        <p key={s} className="muted">
          {s}
        </p>
      ))}
      {row.investigation_url && /^https?:\/\//i.test(row.investigation_url) && (
        <a href={row.investigation_url}>Original investigation ↗</a>
      )}
    </article>
  );
}
export default function Mission() {
  const { register, handleSubmit, reset } = useForm<Models["MissionRequest"]>({
    defaultValues: defaults,
  });
  const m = useMutation({
    mutationFn: (data: Models["MissionRequest"]) =>
      post("/ai/mission/analyze", data, result),
  });
  return (
    <div className="tool">
      <Header section="Mission research" title="Mission advisor">
        Rank indexed studies against a scenario and inspect how much evidence
        supports each match.
      </Header>
      <form
        className="panel scenario-form"
        onSubmit={handleSubmit((data) =>
          m.mutate({
            ...data,
            fuel_material: data.fuel_material?.trim() || null,
          }),
        )}
      >
        <div className="scenario-groups">
          <fieldset>
            <legend>Scenario</legend>
            <label>
              Environment
              <select {...register("environment")}>
                {environments.map((v) => (
                  <option value={v} key={v}>
                    {titleCase(v)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Research focus
              <select {...register("research_focus")}>
                {focuses.map(([value, name]) => (
                  <option value={value} key={value}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fuel material (optional)
              <input
                maxLength={120}
                placeholder="For example, cotton"
                {...register("fuel_material")}
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>Atmosphere</legend>
            <label>
              Oxygen (%)
              <input
                type="number"
                required
                min={0}
                max={100}
                step="any"
                aria-describedby="oxygen-hint"
                {...register("oxygen_percent", { valueAsNumber: true })}
              />
            </label>
            <p id="oxygen-hint" className="field-hint">
              From 0 to 100 percent.
            </p>
            <label>
              Pressure (psi)
              <input
                type="number"
                required
                min={0}
                max={30}
                step="any"
                aria-describedby="pressure-hint"
                {...register("pressure_psi", {
                  valueAsNumber: true,
                  validate: (v) => v > 0,
                })}
                onInput={(e) =>
                  e.currentTarget.setCustomValidity(
                    Number(e.currentTarget.value) > 0
                      ? ""
                      : "Enter a positive pressure.",
                  )
                }
              />
            </label>
            <p id="pressure-hint" className="field-hint">
              Greater than 0 and at most 30 psi.
            </p>
          </fieldset>
          <fieldset>
            <legend>Results</legend>
            <label>
              Results per group
              <input
                type="number"
                required
                min={1}
                max={25}
                aria-describedby="results-hint"
                {...register("max_results", { valueAsNumber: true })}
              />
            </label>
            <p id="results-hint" className="field-hint">
              Up to 25 studies in each group.
            </p>
            <label className="inline">
              <input type="checkbox" {...register("include_external_research")} />
              Include external research
            </label>
          </fieldset>
        </div>
        <div className="actions">
          <button className="primary" disabled={m.isPending}>
            {m.isPending ? "Ranking studies…" : "Rank research"}
          </button>
          <button type="button" onClick={() => reset(defaults)}>
            Reset scenario
          </button>
        </div>
        {m.isPending && <Pending tone="ai" label="Ranking studies…" />}
      </form>
      <div className="research-disclaimer">
        <Info size={18} aria-hidden />
        <p>
          <strong>Research relevance only.</strong>
          Scores describe how closely a study matches this scenario. They do
          not estimate fire probability or certify suppression performance.
        </p>
      </div>
      {m.data && (
        <>
          <section className="panel">
            <div className="result-heading">
              <h2>Ranked scenario</h2>
              <button
                type="button"
                onClick={() =>
                  download(
                    "ignis-mission.json",
                    JSON.stringify(
                      { request: m.variables, result: m.data },
                      null,
                      2,
                    ),
                    "application/json",
                  )
                }
              >
                Export scenario and results
              </button>
            </div>
            <Fields row={m.data.scenario} />
            <h3>Scenario weights</h3>
            <ul className="weight-list">
              {Object.entries(m.data.weights).map(([key, weight]) => (
                <li key={key}>
                  <span>{label(key)}</span>
                  <strong>{weight}%</strong>
                </li>
              ))}
            </ul>
          </section>
          {m.data.warnings
            .filter((s) => !/model|ollama|nomic|nemotron|nvidia|embed/i.test(s))
            .map((s) => (
              <p className="notice" key={s}>
                {s}
              </p>
            ))}
          <section aria-labelledby="nasa-results">
            <h2 id="nasa-results">NASA investigations</h2>
            {!m.data.ranked_nasa_investigations.length && (
              <p>Insufficient NASA evidence for this scenario.</p>
            )}
            {m.data.ranked_nasa_investigations.map((r, index) => (
              <Candidate
                key={r.investigation_code}
                rank={index + 1}
                row={r}
                weights={m.data.weights}
              />
            ))}
          </section>
          {m.variables.include_external_research && (
            <section aria-labelledby="external-results">
              <h2 id="external-results">Related external research</h2>
              {!m.data.related_external_research.length && (
                <p>No related external studies returned.</p>
              )}
              {m.data.related_external_research.map((r, index) => (
                <Candidate
                  key={r.investigation_code}
                  rank={index + 1}
                  row={r}
                  weights={m.data.weights}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
