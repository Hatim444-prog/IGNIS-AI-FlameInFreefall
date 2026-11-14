"""IGNIS AI Stage 5: explainable, source-aware Mission Advisor (no schema changes).

Uses the existing investigations / experiments / sources / measurements tables.
Scores represent retrieval relevance, NEVER fire probability or suppression efficacy.
Register in main.py:
    from mission_advisor_api import router as mission_router
    app.include_router(mission_router)
"""
from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlparse
from typing import Literal

import psycopg
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from psycopg.rows import dict_row
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT.parent / ".env")
load_dotenv(ROOT / ".env", override=False)

router = APIRouter(prefix="/ai/mission", tags=["Mission Advisor"])
PA_PER_PSI = 6894.757293168
WEIGHTS = {
    "objective": 25,
    "fuel": 15,
    "oxygen": 10,
    "pressure": 10,
    "outcome": 15,
    "evidence": 15,
    "gravity": 10,
}


class MissionRequest(BaseModel):
    environment: Literal[
        "pressurized_lunar_rover", "lunar_habitat", "mars_habitat",
        "spacecraft", "space_station",
    ] = "pressurized_lunar_rover"
    research_focus: Literal["suppression", "prevention", "detection"] = "suppression"
    oxygen_percent: float = Field(default=32.0, ge=0, le=100)
    pressure_psi: float = Field(default=12.2, gt=0, le=30)
    fuel_material: str | None = Field(default=None, max_length=120)
    max_results: int = Field(default=10, ge=1, le=25)
    include_external_research: bool = True


def get_connection():
    password = os.getenv("POSTGRES_PASSWORD")
    if not password:
        raise HTTPException(500, "POSTGRES_PASSWORD missing from project .env")
    try:
        return psycopg.connect(
            host=os.getenv("IGNIS_DB_HOST", "127.0.0.1"),
            port=int(os.getenv("IGNIS_DB_PORT", "5433")),
            dbname=os.getenv("IGNIS_DB_NAME", "ignis_db"),
            user=os.getenv("IGNIS_DB_USER", "ignis"),
            password=password,
            row_factory=dict_row,
            connect_timeout=8,
        )
    except psycopg.Error as exc:
        raise HTTPException(503, "Cannot reach scientific PostgreSQL database") from exc


def is_nasa_url(url: str | None) -> bool:
    if not url:
        return False
    try:
        hostname = (urlparse(url).hostname or "").lower()
    except ValueError:
        return False
    return hostname == "nasa.gov" or hostname.endswith(".nasa.gov")


def gravity_score(condition: str | None, environment: str) -> float | None:
    if not condition:
        return None
    c = condition.lower().replace("-", " ").replace("_", " ")
    lunar_target = environment.startswith("lunar") or environment.startswith("pressurized_lunar")
    mars_target = environment == "mars_habitat"
    target = "lunar" if lunar_target else "mars" if mars_target else "microgravity"
    if target in c or (target == "microgravity" and ("microgravity" in c or "zero gravity" in c)):
        return 1.0
    if "partial" in c and target in ("lunar", "mars"):
        # A generic partial-g experiment does not establish matching g-level.
        return 0.55
    if any(word in c for word in ("microgravity", "zero gravity", "earth", "normal gravity", "1 g")):
        return 0.35 if target != "microgravity" else 0.25
    return None


def objective_score(row: dict, focus: str) -> float | None:
    text = " ".join(str(row.get(k) or "") for k in ("title", "objective_text", "description", "research_focus")).lower()
    terms = {
        "suppression": ("suppression", "suppressant", "extinction", "extinguish"),
        "prevention": ("flammability", "ignition", "material selection", "fire prevention"),
        "detection": ("smoke", "aerosol", "detection", "sensor"),
    }
    if any(t in text for t in terms[focus]):
        return 1.0
    if focus == "suppression" and any(t in text for t in ("flame spread", "flame growth", "burning rate")):
        return 0.50
    if any(t in text for t in ("combustion", "flame", "fire", "burning")):
        return 0.25
    return None


def fuel_score(row: dict, fuel_material: str | None) -> float | None:
    # No material requested means fuel match is unknown, not automatically perfect.
    if not fuel_material or not row.get("fuel_material"):
        return None
    got, want = row["fuel_material"].strip().casefold(), fuel_material.strip().casefold()
    if got == want:
        return 1.0
    if got in want or want in got:
        return 0.70
    return 0.20  # Different materials may still offer mechanistic evidence.


def similarity(actual: float | None, target: float, tolerance: float) -> float | None:
    if actual is None:
        return None
    return round(max(0.0, 1.0 - abs(float(actual) - target) / tolerance), 4)


def score_candidate(row: dict, request: MissionRequest) -> dict | None:
    objective = objective_score(row, request.research_focus)
    if objective is None:
        return None  # Unrelated to fire-safety research.
    source_count = int(row["source_count"] or 0)
    verified_count = int(row["verified_count"] or 0)
    outcome_count = int(row["outcome_measurements"] or 0)

    scores = {
        "objective": objective,
        "fuel": fuel_score(row, request.fuel_material),
        "oxygen": similarity(row.get("oxygen_percent"), request.oxygen_percent, 15.0),
        "pressure": similarity(row.get("pressure_pa"), request.pressure_psi * PA_PER_PSI, 35000.0),
        "outcome": 1.0 if outcome_count else None,
        "evidence": 1.0 if verified_count else (0.2 if source_count else None),
        "gravity": gravity_score(row.get("gravity_condition"), request.environment),
    }
    known = sum(WEIGHTS[k] for k, v in scores.items() if v is not None)
    score = sum(WEIGHTS[k] * v for k, v in scores.items() if v is not None)
    observed = round(100 * score / known, 1) if known else None
    return {
        "experiment_code": row.get("experiment_code"),
        "investigation_code": row["investigation_code"],
        "investigation_title": row["title"],
        "investigation_url": row.get("nasa_url"),
        "origin": "NASA_LINKED_METADATA" if is_nasa_url(row.get("nasa_url")) else "EXTERNAL_OR_UNVERIFIED_ORIGIN",
        "experiment_conditions": {
            "oxygen_percent": row.get("oxygen_percent"),
            "pressure_pa": row.get("pressure_pa"),
            "airflow_m_s": row.get("airflow_m_s"),
            "gravity_condition": row.get("gravity_condition"),
            "fuel_material": row.get("fuel_material"),
        },
        "relevance_score_observed": observed,
        "evidence_coverage_percent": known,
        "ranking_score": round(score, 1),
        "score_dimensions": scores,
        "source_file_count": source_count,
        "reviewed_source_count": verified_count,
        "relevant_measurement_count": outcome_count,
        "limitations": candidate_limitations(row, scores, request),
    }


def candidate_limitations(row: dict, scores: dict, request: MissionRequest) -> list[str]:
    limitations = []
    if not is_nasa_url(row.get("nasa_url")):
        limitations.append("Not identified as NASA-origin investigation metadata; do not present as NASA research.")
    if scores["evidence"] != 1.0:
        limitations.append("No team-reviewed source file is linked to this experiment/investigation.")
    if scores["outcome"] is None:
        limitations.append("No recorded suppression/extinction outcome measurement is linked.")
    if scores["oxygen"] is None or scores["pressure"] is None:
        limitations.append("Oxygen and/or total pressure conditions are missing.")
    if scores["fuel"] is None:
        limitations.append("Material applicability is unknown; specify a fuel and import its metadata.")
    if scores["gravity"] is None or scores["gravity"] < 1.0:
        limitations.append("Gravity conditions are not verified as matching the destination environment.")
    if row.get("airflow_m_s") is None:
        limitations.append("Airflow is unspecified; ventilation may affect suppression behavior.")
    return limitations


CANDIDATE_QUERY = """
SELECT i.id AS investigation_id, i.code AS investigation_code,
       i.title, i.objective AS objective_text, i.description, i.nasa_url,
       e.id AS experiment_id, e.experiment_code, e.research_focus,
       e.fuel_material, e.fuel_phase, e.oxygen_percent, e.pressure_pa,
       e.airflow_m_s, e.gravity_condition,
       (SELECT count(*) FROM sources s
         WHERE (s.experiment_id = e.id AND e.id IS NOT NULL)
            OR (s.investigation_id = i.id AND s.experiment_id IS NULL)
       )::int AS source_count,
       (SELECT count(*) FROM sources s
         WHERE s.verification_status = 'verified'
           AND ((s.experiment_id = e.id AND e.id IS NOT NULL)
              OR (s.investigation_id = i.id AND s.experiment_id IS NULL))
       )::int AS verified_count,
       (SELECT count(*) FROM measurements m
         WHERE m.experiment_id = e.id
           AND (m.variable_name ILIKE '%%extinct%%'
             OR m.variable_name ILIKE '%%suppress%%')
       )::int AS outcome_measurements
FROM investigations i
LEFT JOIN experiments e ON e.investigation_id = i.id
WHERE (
  i.title ILIKE ANY(%s::text[])
  OR i.objective ILIKE ANY(%s::text[])
  OR i.description ILIKE ANY(%s::text[])
  OR e.research_focus ILIKE ANY(%s::text[])
)
ORDER BY i.id, e.id
LIMIT 10000
"""


def keyword_patterns(focus: str) -> list[str]:
    focus_terms = {
        "suppression": ("suppress", "extinct", "extinguish", "flame spread"),
        "prevention": ("flammab", "ignit", "material", "flame spread"),
        "detection": ("smoke", "aerosol", "detect", "sensor"),
    }[focus]
    # Include broader combustion records to avoid missing indirect evidence.
    return [f"%{term}%" for term in (*focus_terms, "combust", "flame", "fire")]



@router.get("/health")
def mission_health():
    with get_connection() as conn:
        row = conn.execute("SELECT count(*)::int AS total FROM investigations").fetchone()
    return {"status": "ok", "investigations_in_db": row["total"],
            "note": "This checks database access, not model inference or evidence validation."}


@router.post("/analyze")
def mission_analyze(request: MissionRequest):
    patterns = keyword_patterns(request.research_focus)
    with get_connection() as conn:
        rows = conn.execute(CANDIDATE_QUERY, (patterns, patterns, patterns, patterns)).fetchall()

    scored = []
    for row in rows:
        result = score_candidate(row, request)
        if result is not None:
            scored.append(result)

    # Rank experiment-level candidates then retain the strongest per investigation
    # to avoid a long investigation with many tests monopolizing the ranking.
    by_investigation = {}
    for candidate in scored:
        key = candidate["investigation_code"]
        if key not in by_investigation or candidate["ranking_score"] > by_investigation[key]["ranking_score"]:
            by_investigation[key] = candidate

    ranked = sorted(by_investigation.values(), key=lambda c: (
        -c["ranking_score"], -c["evidence_coverage_percent"], c["investigation_code"]
    ))
    nasa = [c for c in ranked if c["origin"] == "NASA_LINKED_METADATA"]
    external = [c for c in ranked if c["origin"] != "NASA_LINKED_METADATA"]

    warnings = [
        "Ranking scores express research relevance and metadata coverage, not fire risk, suppression efficacy, or safety certification.",
        "NASA-linked metadata is not itself validation of individual measurements; check source review status and original files.",
    ]
    if request.environment in ("pressurized_lunar_rover", "lunar_habitat", "mars_habitat"):
        warnings.append("Do not extrapolate microgravity results to lunar/Martian partial gravity without validated transfer evidence.")
    if request.research_focus == "suppression":
        warnings.append("Suppression performance and astronaut/vehicle safety cannot be established from combustion experiments alone.")
    if not nasa:
        warnings.append("No relevant NASA-linked investigation record has been imported; import and verify NASA PSI studies before making NASA-specific conclusions.")

    return {
        "scenario": {
            "environment": request.environment,
            "research_focus": request.research_focus,
            "oxygen_percent": request.oxygen_percent,
            "pressure_psi": request.pressure_psi,
            "pressure_pa": round(request.pressure_psi * PA_PER_PSI, 2),
            "fuel_material": request.fuel_material,
        },
        "method": "deterministic_research_relevance_v1",
        "weights": WEIGHTS,
        "ranked_nasa_investigations": nasa[:request.max_results],
        "related_external_research": (external[:request.max_results] if request.include_external_research else []),
        "warnings": warnings,
        "result_status": "candidate_evidence_found" if nasa else "insufficient_nasa_evidence",
        "llm_generated": False,
    }
