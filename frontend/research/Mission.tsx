"use client";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Header, Fields, RunLink } from "./common";
import { post, evidence, label, download, type Models } from "./api";
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
function Candidate({
  row,
  weights,
}: {
  row: z.infer<typeof candidate>;
  weights: Record<string, number>;
}) {
  return (
    <article className="panel">
      <small>{row.investigation_code}</small>
      <h3>{row.investigation_title}</h3>
      <p>
        Ranking score <strong>{row.ranking_score} / 100</strong> · Evidence
        coverage {row.evidence_coverage_percent}% · Reviewed files{" "}
        {row.reviewed_source_count}/{row.source_file_count}
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
    <>
      <Header section="Mission research" title="Mission advisor">
        Rank indexed studies against a scenario and inspect how much evidence
        supports each match.
      </Header>
      <form
        className="panel"
        onSubmit={handleSubmit((data) =>
          m.mutate({
            ...data,
            fuel_material: data.fuel_material?.trim() || null,
          }),
        )}
      >
        <div className="fields">
          <label>
            Environment
            <select {...register("environment")}>
              {[
                "pressurized_lunar_rover",
                "lunar_habitat",
                "mars_habitat",
                "spacecraft",
                "space_station",
              ].map((v) => (
                <option value={v} key={v}>
                  {label(v)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Research focus
            <select {...register("research_focus")}>
              {["suppression", "prevention", "detection"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Oxygen (%)
            <input
              type="number"
              required
              min={0}
              max={100}
              step="any"
              {...register("oxygen_percent", { valueAsNumber: true })}
            />
          </label>
          <label>
            Pressure (psi)
            <input
              type="number"
              required
              min={0}
              max={30}
              step="any"
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
          <label>
            Fuel material (optional)
            <input maxLength={120} {...register("fuel_material")} />
          </label>
          <label>
            Results per group
            <input
              type="number"
              required
              min={1}
              max={25}
              {...register("max_results", { valueAsNumber: true })}
            />
          </label>
        </div>
        <p>
          <label className="inline">
            <input type="checkbox" {...register("include_external_research")} />
            Include external research
          </label>
        </p>
        <div className="actions">
          <button className="primary" disabled={m.isPending}>
            {m.isPending ? "Ranking studies…" : "Rank research"}
          </button>
          <button type="button" onClick={() => reset(defaults)}>
            Reset scenario
          </button>
        </div>
      </form>
      <p className="notice">
        Scores describe research relevance. They do not estimate fire
        probability or certify suppression performance.
      </p>
      {m.error && (
        <p role="alert" className="notice">
          {m.error.message}
        </p>
      )}
      {m.data && (
        <>
          <section className="panel">
            <h2>Ranked scenario</h2>
            <Fields row={m.data.scenario} />
            <button
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
          </section>
          {m.data.warnings.map((s) => (
            <p className="notice" key={s}>
              {s}
            </p>
          ))}
          <h2>NASA investigations</h2>
          {!m.data.ranked_nasa_investigations.length && (
            <p>Insufficient NASA evidence for this scenario.</p>
          )}
          {m.data.ranked_nasa_investigations.map((r) => (
            <Candidate
              key={r.investigation_code}
              row={r}
              weights={m.data.weights}
            />
          ))}
          {m.variables.include_external_research && (
            <>
              <h2>Related external research</h2>
              {!m.data.related_external_research.length && (
                <p>No related external studies returned.</p>
              )}
              {m.data.related_external_research.map((r) => (
                <Candidate
                  key={r.investigation_code}
                  row={r}
                  weights={m.data.weights}
                />
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}
