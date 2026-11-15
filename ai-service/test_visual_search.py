"""Visual search contract checks and optional rollback-only integration test."""
import os
import tempfile
import unittest
import psycopg
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
from llm_client import InferenceError, consume_retrieval_note
import stage4_multimodal_api as visual


def search_endpoint():
    router = visual.build_stage4_router(lambda *args: [])
    return next(route.endpoint for route in router.routes if route.path == "/ai/vision/search")


class VisualSearchTest(unittest.TestCase):
    def setUp(self):
        consume_retrieval_note()

    def test_empty_library_skips_embedding_and_reports_how_to_populate(self):
        conn = MagicMock()
        conn.__enter__.return_value.execute.return_value.fetchone.return_value = {"count": 0}
        with patch.object(visual, "connect_db", return_value=conn), patch.object(visual, "find_visual_evidence") as find:
            result = search_endpoint()("flame", 10)
        self.assertEqual(result["search_mode"], "empty")
        self.assertEqual(result["total_observations"], 0)
        self.assertEqual(result["results"], [])
        find.assert_not_called()

    def test_embedding_failure_is_disclosed_as_keyword_search(self):
        conn = MagicMock()
        conn.__enter__.return_value.execute.return_value.fetchone.return_value = {"count": 1}
        with patch.object(visual, "connect_db", return_value=conn), patch.object(visual, "_visual_embedding", side_effect=InferenceError("offline")), patch.object(visual, "_keyword_visual", return_value=[{"filename": "flame.png"}]):
            result = search_endpoint()("flame", 10)
        self.assertEqual(result["search_mode"], "keyword")
        self.assertEqual(result["warnings"], [visual.VISUAL_KEYWORD_NOTE])
        self.assertEqual(result["results"][0]["filename"], "flame.png")

    def test_invalid_queries_and_limits_are_rejected(self):
        for query, limit in [(" ", 10), ("x" * 1501, 10), ("flame", 0), ("flame", 11)]:
            with self.assertRaises(HTTPException) as error:
                search_endpoint()(query, limit)
            self.assertEqual(error.exception.status_code, 422)

    def test_database_failure_returns_a_recoverable_service_error(self):
        with patch.object(visual, "connect_db", side_effect=psycopg.OperationalError("offline")):
            with self.assertRaises(HTTPException) as error:
                search_endpoint()("flame", 10)
        self.assertEqual(error.exception.status_code, 503)
        self.assertIn("retry", error.exception.detail)

    def test_visual_vectors_always_use_the_existing_nomic_space(self):
        with patch.object(visual, "embed_text", return_value="vector") as embed:
            self.assertEqual(visual._visual_embedding("flame", "query"), "vector")
        self.assertEqual(embed.call_args.kwargs["cfg"].embed_backend, "ollama")

    @unittest.skipUnless(os.getenv("IGNIS_LIVE_DB") == "1", "Set IGNIS_LIVE_DB=1 for rollback-only integration")
    def test_live_save_semantic_retrieval_and_metadata_without_retaining_test_data(self):
        from db_config import connect_db
        with connect_db() as conn:
            before = conn.execute("SELECT COUNT(*) AS count FROM visual_observations").fetchone()["count"]
            record = conn.execute("SELECT experiment_code FROM experiments GROUP BY experiment_code HAVING COUNT(*)=1 ORDER BY experiment_code LIMIT 1").fetchone()
            self.assertIsNotNone(record)
            code = record["experiment_code"]

            @contextmanager
            def transaction():
                yield conn

            try:
                with tempfile.TemporaryDirectory(dir=visual.MEDIA_DIR) as directory, patch.object(visual, "MEDIA_DIR", Path(directory)), patch.object(visual, "connect_db", side_effect=transaction):
                    saved = visual._save_observation(
                        b"rollback-only-visual-search-test", "image", ".png", "integration-fixture.png",
                        "Integration test: spherical blue flame surrounding a small sample in a dark chamber.",
                        "qualitative_visual_description", code, None,
                    )
                    result = search_endpoint()("spherical blue flame surrounding a sample", 10)
                    self.assertEqual(result["search_mode"], "semantic")
                    row = next(row for row in result["results"] if row["observation_id"] == saved["observation_id"])
                    self.assertEqual(row["review_status"], "pending_review")
                    self.assertEqual(row["verification_status"], "unverified")
                    self.assertEqual(row["experiment_code"], code)
                    self.assertIsNotNone(row["investigation_code"])
                    self.assertGreater(float(row["similarity"]), 0)
            finally:
                conn.rollback()
            after = conn.execute("SELECT COUNT(*) AS count FROM visual_observations").fetchone()["count"]
            self.assertEqual(after, before)


if __name__ == "__main__":
    unittest.main()
