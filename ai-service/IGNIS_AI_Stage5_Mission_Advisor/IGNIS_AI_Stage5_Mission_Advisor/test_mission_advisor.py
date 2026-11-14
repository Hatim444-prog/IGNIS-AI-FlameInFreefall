"""Offline unit tests for ranking logic; does not access PostgreSQL or Ollama."""
import unittest
from mission_advisor_api import (
    MissionRequest, PA_PER_PSI, is_nasa_url, score_candidate,
)


def sample(**changes):
    base = {
        "investigation_code": "SAMPLE", "title": "Fire suppression laboratory experiment",
        "objective_text": "Study fire suppression", "description": "",
        "research_focus": "suppression", "nasa_url": "https://psi.nasa.gov/test",
        "experiment_code": "TEST-1", "oxygen_percent": 32.0,
        "pressure_pa": 12.2 * PA_PER_PSI, "airflow_m_s": None,
        "gravity_condition": "microgravity", "fuel_material": None,
        "source_count": 1, "verified_count": 1,
        "outcome_measurements": 1,
    }
    base.update(changes)
    return base


class RankingTests(unittest.TestCase):
    def setUp(self):
        self.q = MissionRequest()

    def test_nasa_host_rejects_spoof(self):
        self.assertTrue(is_nasa_url("https://psi.nasa.gov/physci"))
        self.assertFalse(is_nasa_url("https://nasa.gov.attacker.example/"))
        self.assertFalse(is_nasa_url("https://zenodo.org/records/1"))

    def test_exact_conditions_score_higher(self):
        same = score_candidate(sample(), self.q)
        mismatch = score_candidate(sample(oxygen_percent=21.0, pressure_pa=101325), self.q)
        self.assertGreater(same["ranking_score"], mismatch["ranking_score"])

    def test_missing_values_are_not_assumed_zero_measurements(self):
        result = score_candidate(sample(
            oxygen_percent=None, pressure_pa=None,
            source_count=0, verified_count=0, outcome_measurements=0
        ), self.q)
        self.assertIsNone(result["score_dimensions"]["oxygen"])
        self.assertIsNone(result["score_dimensions"]["outcome"])
        self.assertLess(result["evidence_coverage_percent"], 100)

    def test_origin_distinct(self):
        result = score_candidate(sample(nasa_url="https://zenodo.org/records/1"), self.q)
        self.assertEqual(result["origin"], "EXTERNAL_OR_UNVERIFIED_ORIGIN")

    def test_unknown_fuel_not_assumed_match(self):
        result = score_candidate(sample(), self.q)
        self.assertIsNone(result["score_dimensions"]["fuel"])


if __name__ == "__main__":
    unittest.main()
