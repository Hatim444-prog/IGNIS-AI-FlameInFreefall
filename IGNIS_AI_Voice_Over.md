# IGNIS AI — Feature Walkthrough Voice-Over

**Purpose:** A spoken walkthrough of the project's implemented features.

**Delivery:** Clear, curious, and confident. Read at a comfortable pace and pause briefly between sections.

**Recording note:** Read only the narration. Section headings and italicized screen directions are production notes. This script describes implemented behavior; confirm the API, database, models, and indexed data are available before recording the demonstration.

## 1. Introduction

*On screen: Open the dashboard and show the main research tools.*

What happens to fire when gravity changes? And how can we use existing research to understand combustion in space?

IGNIS AI is a research workspace designed to help explore those questions. It brings experiment records, scientific measurements, research documents, and visual observations into one place.

You can explore experiments, compare their measurements, ask questions about the evidence, analyze images and videos, and find studies relevant to a space mission scenario.

## 2. Dashboard

*On screen: Highlight the workflow cards, experiment preview, and featured PDFs.*

The dashboard is the starting point for the workspace.

It provides direct access to the experiment explorer, data comparison, research assistant, media laboratory, and mission advisor.

A preview of the experiment collection shows recorded fuel, gravity conditions, and research origin. Featured research documents can also be opened directly from this page.

The flame animation and Earth-versus-microgravity illustration introduce the subject visually. They are conceptual graphics, rather than experimental measurements.

## 3. Experiment Explorer

*On screen: Search for experiments, change filters, sort results, and open the column controls.*

The experiment explorer turns the research collection into a searchable catalog.

Search by experiment code, investigation, or fuel. Then narrow the results by investigation, fuel material, gravity condition, or whether airflow was reported.

For more specific searches, set minimum and maximum values for oxygen, pressure, and airflow.

You can browse the curated collection of the most complete records, or switch to all experiments. Sorting, pagination, and optional table columns help organize the results.

Catalog statistics show the available experiments, investigations, measurements, and verified sources.

## 4. Experiment Details

*On screen: Open an experiment and expand its measurement groups.*

Opening an experiment reveals its scientific record.

Available information includes the investigation, date, fuel, gravity, oxygen, pressure, airflow, and other recorded experimental conditions.

Measurements are organized into experimental conditions, gas composition, combustion results, and other recorded values.

Each measurement can include its unit, source filename, source row or page, and verification status. Missing information remains visible as missing.

From this page, you can copy the experiment code, add the run to a comparison, or ask the assistant about it.

## 5. Shared Experiment Selection

*On screen: Select multiple experiments and navigate to Data comparison.*

The experiment selection acts as a shared research shortlist.

Select runs in the explorer and carry that selection into data comparison or the assistant. The selection stays available when you move between pages, and it survives a browser reload.

The experiment picker also lets you filter codes, review the selection count, and clear the shortlist.

## 6. Data Comparison

*On screen: Select two experiments, inspect the measured-variable dropdown, then run a comparison.*

Data comparison helps you examine measurements across two to twenty-five selected experiments.

The measured-variable dropdown updates with your selection. It shows only numeric variables recorded for every selected experiment in the same reported unit.

This helps prevent choosing a variable that is unrelated to one of the selected runs.

When the experiments have no shared variable, the page explains the issue and disables comparison. You can then choose a different combination of experiments.

After submitting a comparison, you can inspect the numerical summaries, available charts, and original measurement rows.

## 7. Charts and Statistics

*On screen: Show a bar chart, hover over observations, and switch the horizontal axis where data allows.*

Charts help make patterns in the recorded measurements easier to inspect.

A bar chart represents individual observations. Where uncertainty is reported, error bars show that additional information.

You can also plot measurements against available conditions, such as oxygen, pressure, airflow, or time, using a scatterplot.

When the returned measurements belong to one experiment and have distinct timestamps, the chart can display a time-series line.

Summary statistics show the observation count, range, mean, and median. Measurements remain grouped by their original unit.

The current chart display supports two to eighty observations. Larger result sets remain available through the source table and export.

## 8. Measurement and Chart Export

*On screen: Show Export CSV and Download chart.*

The comparison results can be taken into other research tools.

Export the source measurement rows as a CSV file for further analysis, or download a displayed chart as an SVG image.

The source table includes experiment codes, values, uncertainty, units, source references, and verification status, so the displayed comparison can be traced back to its records.

## 9. AI Research Assistant

*On screen: Switch between Paper, Hybrid, and Multimodal modes.*

The research assistant provides three ways to ask questions about the indexed evidence.

Paper mode retrieves passages from research documents to help explain findings and limitations.

Hybrid mode combines document passages with numerical measurements, connecting written research to experimental values.

Multimodal mode brings together document passages, measurements, and stored visual observations.

The assistant uses retrieved evidence to produce its answer. It does not perform a new experiment or generate new scientific measurements.

## 10. Evidence Scope and Answer Tools

*On screen: Choose document and experiment scopes, submit a question, expand citations, and show export controls.*

You can control which evidence the assistant searches.

Choose specific documents, select experiment codes, and, in Hybrid mode, set a measurement focus. A suggested question offers a starting point.

Answers can include expandable evidence cards, document and page references, source measurements, and visual interpretations.

You can cancel a pending request, copy an answer with its citations, or export it as Markdown.

Questions remain visible in the current view, but each question is submitted independently. The full displayed conversation is not sent as continuing model context.

## 11. Media Laboratory

*On screen: Choose an image, show its preview, then demonstrate a video preview.*

The media laboratory supports qualitative analysis of combustion images and videos.

Upload a JPEG, PNG, or MP4 file, preview it, and optionally associate it with an experiment.

Image analysis describes visible features. Video analysis samples four frames at different points in the recording and describes changes across those frames, with approximate sample timestamps.

These descriptions are visual observations. Temperature, oxygen concentration, pressure, and flame-spread rate require appropriate measurements and cannot be established from appearance alone.

## 12. Analyze Only and Analyze and Save

*On screen: Highlight the two analysis actions and the upload progress controls.*

The media laboratory offers two distinct actions.

Analyze only returns a description for the current page without storing an observation in the scientific database.

Analyze and save stores the media and its generated description, optionally links it to an experiment, and makes the observation available for later search.

Saved observations are marked as unverified. Their experiment association is supplied by the uploader.

Progress, cancellation, replacement, and reset controls support the upload workflow.

## 13. Visual Evidence Library

*On screen: Search for a visual observation, expand a result, and change the verification filter.*

The visual evidence library helps retrieve saved observations by description.

For example, you might search for a spherical flame around a thin fuel sample.

The system searches for related stored observation descriptions and returns the available source information, experiment links, and verification status.

A verification filter helps narrow the returned results. This library searches the stored collection, rather than images across the internet.

## 14. Mission Advisor

*On screen: Configure a scenario, rank research, and inspect a result's score breakdown.*

The mission advisor connects a proposed space scenario with relevant studies in the indexed collection.

Choose an environment, such as a lunar rover, lunar habitat, Mars habitat, spacecraft, or space station.

Then specify a research focus: suppression, prevention, or detection. Set the oxygen level, pressure, optional fuel material, and number of results.

The advisor ranks research using a defined scoring method covering the research objective, fuel, recorded outcome, evidence, oxygen, pressure, and gravity.

Each result shows its ranking score, evidence coverage, reviewed-source counts, experimental conditions, and available limitations. Expand the breakdown to inspect how each dimension contributed.

NASA investigations and related external research appear in separate groups. You can also export the submitted scenario and results as JSON.

The ranking score expresses research relevance within the collection. It does not predict fire probability, establish suppression effectiveness, or certify safety.

### Optional detailed narration: scoring weights

*Use this passage only when presenting the scoring method in detail.*

The research objective contributes twenty-five percent of the score. Fuel match, recorded outcome, and evidence each contribute fifteen percent. Oxygen, pressure, and gravity each contribute ten percent.

Evidence coverage shows how much of the weighted scoring information is available for a candidate.

## 15. Investigations

*On screen: Browse investigation cards and open their experiment records.*

The investigations page organizes the collection at the study level.

Each investigation shows its title, code, experiment count, and measurement count, with a link to explore its records.

The page also lists indexed research documents and provides shortcuts for asking the assistant about their evidence.

## 16. Sources and References

*On screen: Search for a document and inspect its metadata and original-source link.*

Sources and references provides a searchable view of the documents available to the assistant.

Each entry shows the filename, file type, indexed passage count, and verification status. An original-source link appears when one has been recorded.

You can also open an assistant question scoped to a particular document.

This makes it easier to identify the evidence behind the research workflow and return to its original source.

## 17. Personal Settings

*On screen: Change the theme, adjust research defaults, and show saved preferences.*

Settings helps you personalize your research workspace.

Choose a dark or light theme, or follow your device. Keep the sidebar expanded or use compact icons, and reduce animation if you prefer less movement.

Set your preferred research collection, number of experiments per page, and default assistant mode.

Preferences save automatically in this browser. You can clear your experiment shortlist or restore the default preferences while keeping saved research.

## 18. Workspace Controls

*On screen: Collapse the sidebar, use global search, enter fullscreen, and show mobile navigation.*

The workspace includes a collapsible desktop sidebar, a mobile navigation drawer, active-page indicators, and global experiment search.

Control or Command plus K focuses the search field. Fullscreen controls provide more viewing space, while the connection indicator shows whether the workspace is available.

The layout adapts to smaller screens, and animation behavior accounts for reduced-motion preferences.

## 19. Closing

*On screen: Return to the dashboard, then show the IGNIS AI logo.*

IGNIS AI brings the research workflow together: explore experiments, compare measurements, ask questions, inspect visual observations, and find relevant studies for a mission scenario.

Throughout that workflow, the goal is to keep interpretations connected to their evidence, with sources and limitations available for inspection.

IGNIS AI. Exploring fire in microgravity through scientific evidence.

---

## Pronunciation guide — not spoken

| Term | Suggested pronunciation |
|---|---|
| IGNIS AI | IG-niss, A-I |
| NASA | NASS-uh |
| ZARM | Zarm |
| Microgravity | My-crow-gravity |
| Multimodal | Mul-tee-moh-dul |
| Ollama | Oh-lah-mah |
| NVIDIA | En-vid-ee-uh |
| CSV | C-S-V |
| SVG | S-V-G |
| JSON | Jay-sun |
| OCR | O-C-R |
| API | A-P-I |

## Production notes — not spoken

- For a shorter product demo, omit the optional scoring passage then shorten the explorer, chart, and settings descriptions.
- Prepare a pair of experiments with shared measured variables before recording Data comparison.
- Prepare a successful assistant answer and a saved visual observation for the evidence walkthrough.
- Use actual indexed records for the demonstration. Label any illustrative or sample data clearly.
- The backend supports images up to 10 MiB and videos up to 30 MiB, while the current frontend applies a 4 MiB limit in proxy mode. Use a small file for the recording and avoid narrating a universal upload limit.
- The current chart limit is 80 observations. Use a smaller comparison to keep the chart readable.
- The current display has known feedback and layout issues documented in `artifacts/ux-review/UX-REVIEW.md`; this script does not imply those issues have all been fixed.
