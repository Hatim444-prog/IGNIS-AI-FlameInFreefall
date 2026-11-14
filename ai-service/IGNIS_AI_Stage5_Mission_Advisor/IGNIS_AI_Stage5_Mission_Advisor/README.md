# IGNIS AI — Stage 5 Mission Advisor (add-on)

**Compatible with the existing Windows service**, Python 3.12, PostgreSQL on port 5433, and your current five tables. No schema migration, model redownload, vector rebuild, or source file changes required.

## 1. Install

Copy `mission_advisor_api.py` to `C:\IGNIS_AI\ai-service\` alongside your existing `main.py`.

In `main.py`, after your other router registrations, append:

```python
from mission_advisor_api import router as mission_router
app.include_router(mission_router)
```

## 2. Run

```powershell
cd C:\IGNIS_AI\ai-service
.\.venv\Scripts\Activate.ps1
python -m py_compile mission_advisor_api.py main.py
uvicorn main:app --reload --port 8001
```

Open `http://127.0.0.1:8001/docs` and test `GET /ai/mission/health`, then `POST /ai/mission/analyze`:

```json
{
  "environment": "pressurized_lunar_rover",
  "research_focus": "suppression",
  "oxygen_percent": 32,
  "pressure_psi": 12.2,
  "fuel_material": null,
  "max_results": 10,
  "include_external_research": true
}
```

No relevant imported NASA experiment means `ranked_nasa_investigations: []` and `result_status: insufficient_nasa_evidence` — **this is correct**. Your ZARM data remains clearly separated under `related_external_research` if it has relevant metadata. It is not a NASA PSI investigation.

## 3. Scientific limitations

- These scores are **engineering heuristics of research relevance**, not predicted fire-risk probabilities, extinction likelihoods, or validated suppression performance. The displayed weights and proximity tolerances need scientific review.
- NASA source metadata is identified by the official `nasa.gov` domain; this is not an authenticity check of each record. The `verified` flag denotes your team's review, not NASA certification.
- Suppression outcomes are considered present only when the measurement variable name explicitly indicates extinction or suppression. Additional field mappings may be needed for NASA experiment-specific terminology.
- Unknown oxygen, pressure, fuel, gravity and outcome data reduce score coverage; missing values never turn into measurements.
- For Mars and Moon scenarios, microgravity evidence is not direct partial-gravity validation.
- Not all studies have experiment rows yet; investigation-only records can be ranked with low completeness.
- This version intentionally does **not** call Llama. It establishes scientifically transparent retrieval/ranking first; in the next integration step, Llama can explain the returned evidence when verified source passages are available. The existing `/ai/ask-multimodal` continues serving multimodal questions.

## 4. Offline tests

Copy `test_mission_advisor.py` beside the module, then run:

```powershell
python -m unittest test_mission_advisor.py -v
```

## 5. Team integration contract

Your backend developer can call `POST /ai/mission/analyze` and display `ranked_nasa_investigations`, `related_external_research` and `warnings`. The frontend should label `ranking_score` as a **relevance heuristic**, not a probability or scientifically validated risk score.

Next integration: your NASA data engineer should import and review actual FLEX, BASS, SoFIE etc. records with correct `nasa_url` and source verification status before any actual NASA suppression research ranking is claimed.
