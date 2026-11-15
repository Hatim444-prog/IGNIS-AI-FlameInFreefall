# IGNIS AI — Pitch Report

**NASA Space Apps Challenge 2026 · Local event: Meknès**  
**Challenge:** Flame in Freefall — AI-powered fire safety insights from microgravity combustion data  
**Product:** IGNIS AI, a research dashboard that summarizes, compares, interprets, and ranks combustion evidence for Moon, Mars, and spacecraft fire safety.

Local lead Charifa Dahhassi set the weekend clock in the 13 November kickoff email. Official Space Apps judging uses five scores, each from 1 to 5: Impact, Creativity, Validity, Relevance, and Presentation. This report is written for that clock and those scores. Claims below match what the repository implements.

---

## 1. The weekend, in order

Times are local to Meknès, Sunday 15 November 2026.

| When | What happens | What the team does |
|---|---|---|
| Saturday 14 Nov | Hacking day. Mentors are on Discord, in the team channel. | Build, rehearse the 3-minute script out loud with a timer, and capture backup screenshots. |
| Sunday morning | Final mentoring. Pitch order is drawn at random with the team leaders. | The script must work from a cold start. Any slot can be first. |
| Sunday 12:30 | **Meknès deadline for the pitch.** Submit the project on the Space Apps website. | The page, the 7-slide demo or 30-second video, the references, and the AI note are already in. Judges can open the project before 14:00. |
| Sunday 14:00 | Pitches on Google Meet. **3 minutes to pitch, 2 minutes of questions.** | Join early. Test camera, microphone, and screen sharing before the draw. |
| Sunday 18:30 | Local winners announced, then close. | Stay on the call. |
| Sunday 23:59 | Official global submission deadline. Late projects are not accepted. | Use this window only to repair a broken link or add a missing citation. Do not rewrite the story after the pitch. |

Space Apps opens project editing on Saturday 14 November at 09:00 and closes it on Sunday 15 November at 23:59 **local time**. Meknès is stricter for the live pitch: **12:30**. A project submitted at 18:00 can still meet the global deadline and miss the room that decides the local winner.

Eligibility, from the kickoff email and the Space Apps submission rules:

- The team on the website has **1 to 6 members**, all registered for the **Meknès** event, all visible on the Members tab.
- New members cannot be added after submission closes.
- The project page and linked materials are in **English**. A demo video may use another language only with English subtitles.
- Every external resource is listed in References: code, text, images, open-source libraries, and NASA pages.
- AI tools are allowed. The submission explains how they were used.
- The project responds to this one challenge.

---

## 2. What the challenge asks, and what IGNIS answers

Public challenge wording for Flame in Freefall asks for an interactive, AI-powered dashboard that **summarizes, ranks, and interprets** NASA’s microgravity combustion record, so the findings can inform fire safety for human exploration of the Moon and Mars.

| Challenge verb | Where the judge sees it in IGNIS |
|---|---|
| Summarize | Overview, experiment explorer, and investigation pages. Counts, conditions, and provenance come from the database. |
| Compare | Analytics. Real measurements, original units, scatter and time series, CSV and SVG export. |
| Interpret | Research assistant, in paper, hybrid, and multimodal modes. Citations are typed: paper page, measurement, or visual note. |
| Rank | Mission Advisor. A lunar, Martian, spacecraft, or station scenario returns a weighted relevance ranking. NASA-linked records and external research stay in separate lists. |

Say that mapping once, in the first minute. It is the Relevance score.

The dashboard is decision support for a spacecraft fire-safety researcher. It is a research prototype. It is not a flight-certified fire-safety system, a hazard probability, or a suppression controller.

---

## 3. How judges score, and the line that earns each point

Each criterion is 1 to 5, at local judging and again if the project advances. Presentation is scored from the live pitch **and** the submitted project.

| Criterion | A 5 looks like | The sentence to land | What drops the score |
|---|---|---|---|
| **Impact** | A real problem, a named user, a reach beyond the demo. | “A researcher designing a lunar cabin can see which studies match this oxygen, this pressure, and this gravity, and which questions are still open. The same materials story already returned detectors and firefighter gear to Earth.” | A tool with no user. “AI for space” with no decision it changes. |
| **Creativity** | A new approach, not a chat window on top of PDFs. | “Numbers are computed in SQL. The model only explains them. Papers, measurements, and image notes are cited as different evidence. The ranking engine does not call a language model at all.” | A generic chatbot. Hidden weights. |
| **Validity** | Scientifically careful, technically real, usable. | “Missing data stays missing. External experiments stay labeled external. A score is relevance inside our index, and the limits are on the screen.” | Calling the score a fire risk. Relabeling ZARM as NASA data. Claiming a photo is a temperature. |
| **Relevance** | The challenge, answered, with NASA data doing real work. | “We summarized NASA combustion documents — the ISS researcher’s guide, SoFIE, FLARE, and the lunar FM2 payload — and we rank a mission atmosphere against that record.” | NASA mentioned only on the title slide. The demo shows only an external table. |
| **Presentation** | A clear story in the time allowed. | Three minutes, one speaker, the live app, then two minutes of short answers. The project page tells the same story in English. | A 12-slide tour that never reaches the demo. Two people talking over each other. |

Aim the live pitch at Relevance, Validity, and Presentation. The project page carries Impact and Creativity in writing, where the judge can reread them.

---

## 4. Lines to memorize

**One sentence**

IGNIS AI is the dashboard this challenge asks for: it summarizes, compares, interprets, and ranks microgravity combustion evidence for a real lunar or Martian cabin, and it leaves the gap visible when the evidence is not there.

**Thirty seconds, if the draw cuts you short**

Fire on the way to the Moon does not behave like fire on Earth. NASA has decades of microgravity combustion results, and they are scattered. IGNIS AI puts them in one research dashboard: summarize the studies, compare the measurements, interpret a question with citations, and rank which investigations match a mission atmosphere. The ranking is relevance, computed in code, with NASA-linked records kept apart from external data.

**The closer**

The next cabin should be designed with the evidence in view. IGNIS is how a researcher keeps that evidence honest.

---

## 5. The 3-minute pitch

Google Meet, one speaker, screen sharing the running app. A second person advances the mouse and stays quiet. Rehearse with a timer until the ranking result is on screen before 2:20.

Practice pace is about 140 words a minute. The words below are about 430, with pointing time built into the beats. If you run long in rehearsal, cut the assistant beat, not the ranking beat.

### 0:00–0:25 — Problem (Impact)

Share the Overview.

> Fire in a spacecraft does not look like fire on Earth. Cabins headed for the Moon and Mars are being designed with more oxygen and less pressure, and lunar gravity can make some materials burn that go out here. NASA has studied this for decades, on the station and on the ground. The results sit in separate papers, tables, and images. The person who needs them is a fire-safety researcher with a cabin concept and a short week.

### 0:25–0:45 — The challenge, answered (Relevance)

> This challenge asks for a dashboard that summarizes, ranks, and interprets that record for human exploration. IGNIS AI is that dashboard. It is decision support. It is not a flight alarm.

### 0:45–1:25 — Summarize, and show NASA in the product (Relevance)

Stay on Overview, then open one NASA-linked investigation or a paper answer you have already tested.

> This is the research command center. These counts are live. Each source is reported on its own, and external experiments stay labeled external. Behind it is a NASA document set we prepared for retrieval: the ISS Researcher’s Guide to Combustion Science, SoFIE on solid-fuel ignition and extinction, FLARE on flammability limits at reduced gravity, and FM2, the lunar payload that burns materials in exploration atmospheres. Ask a question, and the answer comes back with the page it used.

If the live paper search is slow, use a screenshot of a citation and keep talking.

### 1:25–2:25 — Rank (Creativity + Validity)

Open Mission Advisor. Submit the saved scenario the moment you arrive. Do not fill the form live.

> Ranking is the part the challenge names, so we did not leave it to a language model. I set a pressurized lunar rover, a suppression question, 32 percent oxygen, 12.2 psi. Seven weights are published: objective 25, fuel 15, oxygen 10, pressure 10, outcome 15, evidence 15, gravity 10. NASA-linked studies and external research come back in two lists. Coverage shows how many of those weights had data. If the NASA list is empty, the status is insufficient NASA evidence. That is the honest result, and we show it on purpose. The number is relevance inside this index. It is not a fire probability, and a microgravity test is not treated as a lunar proof.

Read one limitation from the screen.

### 2:25–2:45 — Interpret (Creativity)

Only if the clock is under 2:25. Otherwise skip to the close.

> A question can also mix a paper, a measurement, and an image. Those three stay labeled, because a caption is an observation waiting for a human, not a measured temperature. The measurement itself was computed in SQL.

### 2:45–3:00 — Close (Impact)

> The same research already came home as a shuttle fire detector, firefighter clothing from suit materials, and lighter air tanks. What we are asking the judges to see is the loop: summarize, compare, interpret, and rank, with the gap left on the screen. Next we load reviewed NASA numerical campaigns the same way, so the ranking gets deeper without getting less honest.

Stop when the three minutes end, even if the last sentence is unfinished. A hard stop scores better than talking over the judges.

---

## 6. The 2-minute questions

You will get about two questions, sometimes three short ones. Answer in two or three sentences. Then stop.

**Does this replace NASA’s flammability standard?**  
No. Screening standards stay the authority. IGNIS helps a researcher find and compare the evidence those standards have to live beside. It does not pass or fail a material.

**Why trust the score?**  
Trust it as an audit, not as a prediction. The weights are on screen, missing data lowers coverage, and an external experiment cannot move into the NASA list. We want combustion scientists to argue with the weights. That review is the next step, and the code already says so.

**Where is the NASA data?**  
In the document layer: the combustion researcher’s guide, SoFIE, FLARE, FM2, and the NASA case studies of Apollo 1 and the 1997 Mir fire. Structured numbers in the first import are the external ZARM flame-spread set, labeled as external. PSI campaigns such as BASS, FLEX, Saffire, and SoFIE are the next numerical load. A title in a paper is not a dataset, so we did not invent those rows.

**Is the model making up the measurements?**  
Measurements and the mission score are Python and SQL. The model explains retrieved pages and writes qualitative image notes. Those notes stay pending review.

**Can it run without the internet?**  
Yes. Ollama, local embeddings, and local Postgres. NVIDIA NIM is the optional hosted path for chat and vision. Search stays on the local 768-dimensional index.

**How did you use AI?**  
Two different ways, and we wrote both on the project page. Inside the product, a local model explains documents and images, and a hosted NVIDIA model is optional. The ranking does not use a generative model. To build the software, the team used the coding tools named in the submission.

**Is it ready to deploy for a crew?**  
It is a localhost research prototype. Uploads are not authenticated. That is why we are not putting it on the public internet this weekend.

If you do not know, say: “That number is not in the index, and the product is built to show the gap rather than fill it.” Then stop.

---

## 7. Google Meet, Sunday 14:00

- Join early. Test camera, microphone, and screen sharing on the same machine that will run the demo.
- Share the browser window with the app, not the whole desktop. Close mail, Discord, and the editor.
- One speaker. The second person only drives the mouse.
- Zoom the browser so a judge on a laptop can read the ranking score.
- Have a screenshot folder in slide order: Overview, one NASA citation, Analytics with units, Mission Advisor with both lists and one limitation. If a model is cold, narrate the screenshots and keep the clock.
- The pitch order is random. The opening line must work with no warm-up from the previous team.
- English for the pitch. The project page is English too.

---

## 8. The submission, due 12:30

On the team page, open the Project tab, edit, and submit. The official demo attached to that page is **either** a slide deck of at most **7 slides**, including the title, **or** a video of at most **30 seconds**. The live 3-minute Meet pitch is separate. Judges score both.

### Seven slides

The deck is the artifact on the project page. Large type. One idea a slide.

1. **Title.** IGNIS AI. Flame in Freefall, NASA Space Apps Meknès 2026. One line: summarize, compare, interpret, and rank combustion evidence for a lunar or Martian cabin.
2. **Problem.** Higher oxygen, lower pressure, a different gravity. The user is a fire-safety researcher. Apollo 1 and the Mir fire of 24 February 1997 are the stakes. FM2 is why the Moon is not “just microgravity.”
3. **The dashboard.** Four verbs, four screens: Overview, Analytics, Research assistant, Mission Advisor. A real screenshot.
4. **NASA data, doing the work.** Name the guide, SoFIE, FLARE, FM2, and the incident record. Say ZARM is external and labeled. Name PSI and NTRS as the path for the next numerical import.
5. **How a ranking stays honest.** The seven weights. Two result lists. Insufficient evidence as a successful result. “Relevance, not risk.”
6. **Impact.** Cabin design now. Earth return: incipient fire detector, Project FIRES protective clothing, lighter firefighter air tanks.
7. **Built, next, team.** The loop runs. Next: reviewed NASA numerical campaigns, a human review queue, authentication before any shared deployment. Team name and Meknès.

### Thirty-second video, if you choose video instead of slides

One take. English, or subtitles in English.

- 0:00–0:05. “Fire on a lunar rover will not look like fire on Earth. The studies are scattered.”
- 0:05–0:12. Overview, with the provenance line visible.
- 0:12–0:22. Mission Advisor result, finger on the two lists and the coverage.
- 0:22–0:30. “IGNIS summarizes, compares, interprets, and ranks. The gap stays on the screen.”

### Project-page text you can paste

**Title:** IGNIS AI — Evidence for fire safety when gravity lets go

**Summary:** IGNIS AI is an interactive research dashboard for the Flame in Freefall challenge. It summarizes NASA and partner combustion documents, compares real experimental measurements with their units, interprets questions with separate citations for papers, measurements, and images, and ranks indexed studies against a lunar, Martian, spacecraft, or station atmosphere. Ranking is deterministic and explained. NASA-linked records stay separate from external data. Missing evidence stays missing. The tool supports researchers. It does not certify a material or predict a fire.

**AI disclosure, fill the blanks before you submit:**

> Inside the product, answers and image descriptions are generated by a local Ollama model (Llama for text, a Gemma vision model, Nomic embeddings) or, optionally, by NVIDIA NIM hosted models. Embeddings used for search are 768-dimensional and stored in PostgreSQL with pgvector. Mission Advisor does not call a generative model. Its score is a weighted relevance heuristic computed in Python and SQL. While building the software, the team used [name the coding assistants, design tools, and any model that wrote or revised code or text]. Those tools drafted and edited. The team decided the architecture, checked the scientific claims, and is responsible for the submission.

**References to list, at minimum:**

- NASA ISS *Researcher’s Guide to Combustion Science*.
- SoFIE, Solid Fuel Ignition and Extinction, project briefing.
- FLARE, Flammability Limits at Reduced-g.
- FM2, Flammability of Materials on the Moon, Glenn Space Technology Symposium material.
- NASA Safety Center, Apollo 1 (AS-204), https://sma.nasa.gov/sma-disciplines/accllp/apollo-1
- NASA History, fire aboard Mir, https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/
- NASA Spinoff pages used: fire detector, Project FIRES, firefighter air tanks.
- The external ZARM flame-spread source, with its Zenodo or dataset URL, labeled external.
- Open-source libraries you actually ship: FastAPI, PostgreSQL / pgvector, React, and the rest of `requirements.txt` and `package.json`.
- Ollama and NVIDIA NIM, as inference providers.

Tick both confirmation boxes only after References is complete. Space Apps can remove a nomination if sources are missing.

---

## 9. Demo path, in case the clock is kind

The 3-minute script is the whole live pitch. This longer path is for a mentor on Saturday, not for Sunday.

1. Overview. Read the provenance line about external data out loud.
2. Explorer. Filter by gravity or oxygen. Open one real experiment code.
3. Analytics. Compare one real variable across two real codes. Point at the unit. If units differ, they stay in separate groups.
4. Assistant. One prepared question. Open one evidence card and name its type: paper, measurement, or visual note.
5. Mission Advisor. The lunar-rover scenario. One score breakdown. One limitation, read from the screen.

Write the two experiment codes and the variable name on a card tonight. Do not search for them on stage.

---

## 10. The product, fully

### Who it is for

A combustion or spacecraft-safety researcher, a NASA or partner engineer preparing a materials or suppression trade, or a student team checking which experiment actually applies to a habitat concept.

The job: “I have a cabin concept. Show me the studies that match this atmosphere and this question, show me the numbers you used, and show me what you cannot say.”

### What the user can do

The workspace is Vite + React, served on loopback port 5173. The API is FastAPI on port 8001.

| Screen | Route | What the user gets |
|---|---|---|
| Overview | `/` | Each data source reported on its own. Counts of experiments, measured variables, and investigations. External ZARM rows labeled as external. |
| Experiment explorer | `/experiments` | Search, filter, sort, and paginate up to 100 returned experiments. Oxygen, pressure, airflow, fuel, gravity, investigation, origin. A shortlist survives reload. |
| Experiment detail | `/experiments/:code` | One run, opened by its real code. |
| Analytics | `/analytics` | Measurements grouped by original unit. Observations, condition scatterplots, time series. Export rows to CSV or the chart to SVG. |
| Research assistant | `/assistant` | Paper, hybrid, and multimodal questions. Each turn is its own request. Evidence cards and an export with citations. |
| Media laboratory | `/media` | Preview JPEG, PNG, or MP4. Analyze-only, or save. Analyze-only does not write to the scientific database. |
| Visual evidence | `/media/library` | Semantic search over saved visual descriptions. |
| Mission Advisor | `/mission-advisor` | Validated scenario. NASA-linked and external groups. Coverage, weights, limitations, export. |
| Investigations | `/investigations` | Investigation records currently in the database. |
| Sources | `/sources` | The evidence inventory today’s endpoints can show. |
| Settings | `/settings` | Local, hosted, or mixed inference. |

### The rule that makes the architecture matter

Language models explain. They do not own the numbers.

Comparisons, summaries, and mission scores are computed in Python and SQL from stored rows. Paper passages, visual descriptions, and measurements are cited as different evidence: `P`, `V`, and `M`.

```text
Research workspace (Vite + React, 127.0.0.1:5173)
        |
        |  HTTP JSON, or multipart for images and video
        v
IGNIS AI service (FastAPI, 127.0.0.1:8001)
        |
        +-- PostgreSQL 17 + pgvector (Docker, host port 5433)
        |     investigations, experiments, measurements, sources,
        |     document_chunks (768-d vectors), visual_observations
        |
        +-- Inference, chosen per request
        |     Local:  Ollama — Llama answers, Gemma vision, Nomic embeddings
        |     Hosted: NVIDIA NIM for chat and vision
        |             Search stays on the local 768-d index
        |
        +-- Files
              images and video under data/visual/
              document extracts under data/raw and data/processed
```

### Five stages, one product

| Stage | What it added | Pitch use |
|---|---|---|
| 1. Document retrieval | Chunks, embeddings, cosine search, answers with document and page. `POST /ai/ask`. | “The page is attached.” |
| 2. Scientific data | Experiment schema, variable list, numeric comparison, hybrid Q&A. | “The model does not write the SQL. Units that differ are not averaged.” |
| 3. Vision | Qualitative read of JPEG/PNG. Up to four frames from an MP4. | “A picture is an observation, not a sensor.” |
| 4. Multimodal memory | Originals stored by hash. Descriptions embedded. Search. Citations stay typed. | “Saved visual notes start at pending review.” |
| 5. Mission Advisor | Deterministic ranking. This endpoint does not call the language model. | “The score is a published heuristic. Thin NASA coverage is reported.” |

### Mission Advisor, in plain language

The user describes a cabin:

- Environment: pressurized lunar rover, lunar habitat, Mars habitat, spacecraft, or space station.
- Focus: suppression, prevention, or detection.
- Atmosphere: oxygen percent and pressure in psi.
- Optional fuel, and whether external research may appear beside NASA-linked records.

| Dimension | Weight | Meaning |
|---|---|---|
| Objective | 25 | Does the study match suppression, prevention, or detection? |
| Fuel | 15 | Does the material match, when a fuel was given? |
| Oxygen | 10 | How close is the experiment oxygen? |
| Pressure | 10 | How close is the experiment pressure? |
| Outcome | 15 | Is there a real extinction or suppression measurement? |
| Evidence | 15 | Are there source files, and have any been reviewed? |
| Gravity | 10 | Is the gravity condition in the right family for this destination? |

Missing values lower coverage. They are never filled in. The default demo scenario is a pressurized lunar rover, suppression, 32% oxygen, 12.2 psi.

A `nasa.gov` link marks NASA-linked metadata. It is not, by itself, a certification of every number in the row. The documented numerical seed is the external ZARM flame-spread set, prefix `ZARM-`, 31 experiment records at the initial import. Live counts are whatever Overview shows on the demo machine. Quote a count only after you have read it off the screen.

### Knowledge base

Narrative extracts prepared in this repository:

| Source | Why it is in the pitch |
|---|---|
| NASA *Researcher’s Guide to Combustion Science* | Why microgravity combustion research exists, and which station facilities support it. |
| SoFIE — Solid Fuel Ignition and Extinction | Ignition of real spacecraft materials, cabin-material selection, early fire growth, suppression by diluent, flow, and venting. |
| FLARE — Flammability Limits at Reduced-g | Whether Earth material-screening methods are the right standard for space. NASA White Sands, JAXA, and ESA appear in the extract. |
| FM2 — Flammability of Materials on the Moon | Lunar gravity can widen flammability. Test points called out in the extract: about 21% oxygen at 14.7 psia, and 34% oxygen at 8.2 psia, for the Human Lander System and a lunar rover. CLPS flight context. |
| Apollo 1 (AS-204), NASA Safety Center | The ground lesson of an oxygen-rich cabin. |
| Apollo 13, NASA Safety Center | Safety culture and investigation discipline. Use it that way, not as a cabin-fire dataset. |
| Mir, 24 February 1997, NASA History | The in-orbit fire: an oxygen-generator canister, a blocked path to a Soyuz, smoke, extinguishers, lessons carried into station operations. |
| NASA Spinoff — incipient fire detector | Detection that tries to tell combustion particles from dust. |
| NASA Spinoff — Project FIRES | Suit thermal materials applied to firefighter clothing. |
| NASA Spinoff — firefighter air tanks | Lighter, higher-pressure breathing apparatus with Johnson Space Center. |

Retrieval only “knows” a passage after it has been embedded into PostgreSQL. Before the pitch, confirm that a paper-mode question hits the NASA document you plan to name.

The challenge’s data path, which the Resources section on the challenge page is there to confirm, centers on NASA’s Physical Sciences Informatics repository (combustion investigations such as BASS, Saffire, SAME, FLEX, ACME, SoFIE) and the NASA Technical Reports Server. IGNIS is built so those campaigns can be imported with units, uncertainty, and a source hash. Say that as the roadmap. Say they are loaded only if Overview shows them.

### What we will say, and what we will not upgrade it into

| We say | We do not upgrade it into |
|---|---|
| Relevance of indexed studies to a scenario. | A probability that this rover will have a fire. |
| A qualitative description of a frame. | A measured flame temperature. |
| NASA-linked metadata. | A verified NASA experimental result, unless the review state says a person checked it. |
| External ZARM flame-spread measurements. | NASA Physical Sciences Informatics data. |
| Microgravity evidence is a clue for the Moon. | Proof the material is safe in lunar gravity. |
| The weights are a heuristic scientists should challenge. | A validated hazard model. |
| A prepared NASA document set, plus a labeled external table. | “Every NASA combustion dataset is loaded.” |
| A prototype for researchers. | A crew tool, or a certification. |

---

## 11. Saturday checklist

- [ ] Discord joined. Mentor knows the team channel.
- [ ] Team page shows 1 to 6 members, all on the Meknès event.
- [ ] API health and mission health both return.
- [ ] One NASA document question has been run, and the citation is screenshot.
- [ ] Two real experiment codes and one real variable are written on a card.
- [ ] The lunar-rover scenario has been run on this database. You know whether the NASA column will be empty, and you will present that on purpose.
- [ ] The 3-minute script has been timed out loud, twice.
- [ ] Screenshot folder matches the four beats: Overview, NASA citation, Analytics, Mission Advisor.
- [ ] The 7-slide deck is exported to PDF, in English, within the 7-slide limit.
- [ ] Project page draft is in English: summary, AI disclosure with the real tool names, references, demo attached.
- [ ] Sunday 12:30 is on someone’s phone as the submit alarm. Sunday 14:00 is the Meet alarm, with an earlier alarm to test camera, mic, and sharing.
- [ ] No slide and no spoken line says certified, probability, or predicts suppression.

---

## 12. Technical appendix

For a mentor or a written question, not for the three minutes.

**Stack.** Vite, React 19, TypeScript, React Router, TanStack Query, Zod, Recharts, Tailwind. FastAPI, Pydantic, Uvicorn. PostgreSQL 17 with pgvector, Docker service `ignis-postgres`, database `ignis_db`, host port 5433. Ollama defaults and optional NVIDIA NIM. PyMuPDF, OpenCV, Pillow.

**Endpoints.** `GET /ai/health`. `POST /ai/ask`. `GET /ai/data/variables`, `GET /ai/data/experiments`. `POST /ai/data/compare`. `POST /ai/ask-hybrid`. `POST /ai/vision/image`, `POST /ai/vision/video`. `POST /ai/vision/store-image`, `POST /ai/vision/store-video`. `GET /ai/vision/search`. `POST /ai/ask-multimodal`. `GET /ai/mission/health`, `POST /ai/mission/analyze`.

**Limits to remember if asked.**

- Ranking weights are not a validated hazard model.
- A NASA link identifies metadata. It does not review every field.
- Suppression credit requires a measurement whose name indicates extinction or suppression.
- Unknown oxygen, pressure, fuel, gravity, or outcome reduces coverage.
- For Moon and Mars, microgravity evidence is flagged, not treated as partial-gravity proof.
- Image descriptions are not temperatures, spread rates, or suppressant effectiveness.
- Uploaded associations and user-supplied URLs stay unverified until a person reviews them.
- The service is bound to localhost. Authentication comes before any public deployment.

**Roadmap, matching the code’s own notes.**

1. Import reviewed NASA numerical records from PSI campaigns with URLs, units, and verification status.
2. Let the language model explain a ranking only after the ranked passages exist. Ranking stays deterministic.
3. Add a human-reviewed filter for visual notes and source URLs.
4. Serve original media only through an authenticated endpoint.
5. Ask combustion researchers to accept or revise the seven weights.

---

## 13. Sources for the story slides

Re-read the page before quoting a detail that is not in this report. Full URLs belong in the project References field.

- NASA Safety Center, Apollo 1 (AS-204): https://sma.nasa.gov/sma-disciplines/accllp/apollo-1
- NASA Safety Center, Apollo 13: https://sma.nasa.gov/sma-disciplines/accllp/apollo-13
- NASA History, “25 Years Ago: Fire Aboard Space Station Mir” (John Uri, Johnson Space Center, 23 February 2022): https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/
- NASA ISS *Researcher’s Guide to Combustion Science*, Program Science Office. Authors in the extract include Suleyman A. Gokoglu, Daniel L. Dietrich, Dennis P. Stocker, Paul V. Ferkul, Sandra L. Olson, and Michael C. Hicks.
- SoFIE briefing, Solid Fuel Ignition and Extinction. Paul Ferkul and co-authors, NASA Glenn and partner institutions.
- FLARE, Flammability Limits at Reduced-g. International task-group material involving NASA White Sands Test Facility and partner agencies.
- FM2, “Flammability of Materials on the Moon.” Jennifer Zayac, Michael Johnston, Gary Ruff, Paul Ferkul.
- NASA Spinoff, incipient fire detector: https://spinoff.nasa.gov/node/9407
- NASA Spinoff, Project FIRES: https://spinoff.nasa.gov/node/9918
- NASA Spinoff, firefighter air tanks: https://spinoff.nasa.gov/node/9582
- Physical Sciences Informatics: https://psi.nasa.gov/
- NASA Technical Reports Server search API: https://ntrs.nasa.gov/api/citations/search

ZARM rows stay labeled external. They are not NASA Physical Sciences Informatics data.

Judging definitions used here are the Space Apps criteria published for this cycle: Impact, Creativity, Validity, Relevance, and Presentation, each scored from 1 to 5. Confirm the challenge Resources list on your challenge page before you freeze the References field. That list is the one the Relevance judges will expect.
