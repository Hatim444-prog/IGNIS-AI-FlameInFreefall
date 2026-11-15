"""Vérification de non-régression du catalogue IGNIS AI.

Lance contre le backend local :
    python verify_catalog.py [--base http://127.0.0.1:8001]

Contrôles :
- pagination et totaux de /ai/data/experiments
- filtres investigation / recherche
- endpoint détail avec mesures
- /ai/data/stats et /ai/data/facets
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request


def get(base: str, path: str, params: dict | None = None):
    url = base + path
    if params:
        url += "?" + urllib.parse.urlencode(
            {k: v for k, v in params.items() if v is not None}
        )
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def check(name: str, condition: bool, detail: str = ""):
    status = "OK " if condition else "FAIL"
    print(f"[{status}] {name}" + (f" — {detail}" if detail else ""))
    return condition


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:8001")
    args = parser.parse_args()
    base = args.base.rstrip("/")

    failures = 0

    # --- Pagination / totaux -------------------------------------
    # Références constatées dans Neon après import PSI-69 :
    # ZARM-FLARE 31/98, PSI-25 129/752, PSI-69 274/3176.
    EXPECTED = {
        "ZARM-FLARE": (31, 98),
        "PSI-25": (129, 752),
        "PSI-69": (274, 3176),
    }
    expected_total = sum(v[0] for v in EXPECTED.values())
    expected_measurements = sum(v[1] for v in EXPECTED.values())

    page1 = get(base, "/ai/data/experiments", {"limit": 12, "offset": 0})
    failures += not check(
        f"total global = {expected_total}",
        page1.get("total") == expected_total,
        f"total={page1.get('total')}",
    )
    failures += not check(
        "page size respecté",
        len(page1.get("experiments", [])) == 12,
    )

    page2 = get(base, "/ai/data/experiments", {"limit": 12, "offset": 12})
    codes1 = {e["experiment_code"] for e in page1["experiments"]}
    codes2 = {e["experiment_code"] for e in page2["experiments"]}
    failures += not check(
        "pas de chevauchement entre pages",
        not (codes1 & codes2),
    )

    # --- Filtres par investigation --------------------------------
    zarm = get(
        base, "/ai/data/experiments",
        {"investigation": "ZARM-FLARE", "limit": 100},
    )
    failures += not check(
        "ZARM-FLARE = 31 expériences",
        zarm.get("total") == 31,
        f"total={zarm.get('total')}",
    )
    failures += not check(
        "toutes les lignes ZARM ont investigation_code=ZARM-FLARE",
        all(
            e["investigation_code"] == "ZARM-FLARE"
            for e in zarm["experiments"]
        ),
    )

    psi25 = get(
        base, "/ai/data/experiments",
        {"investigation": "PSI-25", "limit": 100},
    )
    failures += not check(
        "PSI-25 = 129 expériences",
        psi25.get("total") == EXPECTED["PSI-25"][0],
        f"total={psi25.get('total')}",
    )

    psi69 = get(
        base, "/ai/data/experiments",
        {"investigation": "PSI-69", "limit": 100},
    )
    failures += not check(
        "PSI-69 = 274 expériences",
        psi69.get("total") == EXPECTED["PSI-69"][0],
        f"total={psi69.get('total')}",
    )

    # --- Tri Airflow en premier ------------------------------------
    ordered = get(base, "/ai/data/experiments", {"limit": 100})
    rows = ordered.get("experiments", [])
    seen_null = False
    airflow_order_ok = True
    for e in rows:
        is_null = e.get("airflow_m_s") is None
        if is_null:
            seen_null = True
        elif seen_null:
            airflow_order_ok = False
            break
    failures += not check(
        "tri par défaut : Airflow rapporté avant non rapporté",
        airflow_order_ok,
    )

    reported = get(
        base, "/ai/data/experiments",
        {"airflow_availability": "reported", "limit": 100},
    )
    not_reported = get(
        base, "/ai/data/experiments",
        {"airflow_availability": "not_reported", "limit": 1},
    )
    failures += not check(
        "filtre disponibilité Airflow : reported + not_reported = total",
        reported.get("total", 0) + not_reported.get("total", 0)
        == ordered.get("total"),
        f"{reported.get('total')} + {not_reported.get('total')}",
    )
    failures += not check(
        "filtre 'reported' ne retourne que des valeurs non nulles",
        all(
            e.get("airflow_m_s") is not None
            for e in reported.get("experiments", [])
        ),
    )

    # --- Sélection curée top-150 ------------------------------------
    curated_rows = []
    for offset in (0, 100):
        page = get(
            base, "/ai/data/experiments",
            {"curated": "true", "limit": 100, "offset": offset},
        )
        curated_rows.extend(page.get("experiments", []))
    curated_total = get(
        base, "/ai/data/experiments",
        {"curated": "true", "limit": 1},
    ).get("total")
    failures += not check(
        "curated : total = 150",
        curated_total == 150,
        f"total={curated_total}",
    )
    curated_by_inv = {}
    for e in curated_rows:
        curated_by_inv[e["investigation_code"]] = (
            curated_by_inv.get(e["investigation_code"], 0) + 1
        )
    failures += not check(
        "curated : 31 ZARM + PSI-25 + PSI-69 présents",
        curated_by_inv.get("ZARM-FLARE") == 31
        and curated_by_inv.get("PSI-25", 0) > 0
        and curated_by_inv.get("PSI-69", 0) > 0,
        str(curated_by_inv),
    )

    # --- Recherche -------------------------------------------------
    search = get(
        base, "/ai/data/experiments",
        {"q": "ZARM-144", "limit": 10},
    )
    failures += not check(
        "recherche retrouve ZARM-144",
        any(
            e["experiment_code"] == "ZARM-144"
            for e in search.get("experiments", [])
        ),
    )

    # --- Tri --------------------------------------------------------
    desc = get(
        base, "/ai/data/experiments",
        {"sort": "desc", "limit": 5},
    )
    codes = [e["experiment_code"] for e in desc.get("experiments", [])]
    failures += not check(
        "tri descendant appliqué",
        codes == sorted(codes, reverse=True),
        str(codes[:3]),
    )

    # --- Détail -----------------------------------------------------
    detail = get(base, "/ai/data/experiments/ZARM-144")
    failures += not check(
        "détail ZARM-144 rattaché à ZARM-FLARE",
        detail.get("experiment", {}).get("investigation_code")
        == "ZARM-FLARE",
    )
    failures += not check(
        "détail contient des mesures sourcées",
        len(detail.get("measurements", [])) > 0
        and all("filename" in m for m in detail["measurements"]),
        f"{len(detail.get('measurements', []))} mesures",
    )

    # --- Stats ------------------------------------------------------
    stats = get(base, "/ai/data/stats")
    totals = stats.get("totals", {})
    failures += not check(
        f"stats: {expected_total} expériences / "
        f"{expected_measurements} mesures",
        totals.get("experiments") == expected_total
        and totals.get("measurements") == expected_measurements,
        json.dumps(totals),
    )
    per_inv = {
        i["code"]: i for i in stats.get("investigations", [])
    }
    inv_ok = all(
        per_inv.get(code, {}).get("experiment_count") == exp
        and per_inv.get(code, {}).get("measurement_count") == meas
        for code, (exp, meas) in EXPECTED.items()
    )
    failures += not check(
        "stats par investigation correctes",
        inv_ok,
    )

    # --- Facettes ----------------------------------------------------
    facets = get(base, "/ai/data/facets")
    inv_codes = {i["code"] for i in facets.get("investigations", [])}
    failures += not check(
        "facettes listent les investigations",
        set(EXPECTED) <= inv_codes,
        str(sorted(inv_codes)),
    )

    print()
    if failures:
        print(f"{failures} vérification(s) en échec")
        return 1
    print("Toutes les vérifications sont passées")
    return 0


if __name__ == "__main__":
    sys.exit(main())
