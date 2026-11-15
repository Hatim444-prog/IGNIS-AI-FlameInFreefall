"""Exercise variable intersection against real fixture rows without a service DB."""
import re
import sqlite3
import unittest
from unittest.mock import patch

from hybrid_api import get_variables


class FixtureConnection:
    def __init__(self):
        self.db = sqlite3.connect(":memory:")
        self.db.row_factory = sqlite3.Row
        self.db.executescript("""
            CREATE TABLE experiments (id INTEGER, experiment_code TEXT);
            CREATE TABLE measurements (experiment_id INTEGER, variable_name TEXT, unit TEXT, value REAL);
            INSERT INTO experiments VALUES (1, 'A'), (2, 'B'), (3, 'C');
            INSERT INTO measurements VALUES
              (1, 'spread', 'mm/s', 1), (1, 'spread', 'mm/s', 2),
              (2, 'spread', 'mm/s', 3), (3, 'temperature', 'K', 300),
              (1, 'only_a', 's', 1),
              (1, 'different_units', 'Pa', 1), (2, 'different_units', 'psi', 2),
              (1, 'missing_value', 's', 1), (2, 'missing_value', 's', NULL),
              (1, 'missing_unit', NULL, 1), (2, 'missing_unit', NULL, 2),
              (1, 'blank_unit', '', 1), (2, 'blank_unit', '', 2);
        """)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.db.close()

    def execute(self, sql, params):
        # Adapt PostgreSQL placeholders/casts only; execute the production query.
        sql = re.sub(r"COUNT\((.*?)\)::int", r"COUNT(\1)", sql)
        sql = sql.replace("BTRIM", "TRIM")
        if "ANY(%s::text[])" in sql:
            codes = params[1]
            sql = sql.replace("= ANY(%s::text[])", "IN (" + ",".join("?" for _ in codes) + ")")
            params = [params[0], *codes, params[2]]
        return self.db.execute(sql.replace("%s", "?"), params)


class ComparisonVariablesTest(unittest.TestCase):
    def variables(self, codes=None):
        with patch("hybrid_api.connect_db", side_effect=FixtureConnection):
            return [dict(row) for row in get_variables("", codes)]

    def test_only_numeric_variables_with_a_shared_unit_are_returned(self):
        rows = self.variables(["A", "B"])
        self.assertEqual([row["variable_name"] for row in rows], ["spread"])
        self.assertEqual(rows[0]["experiment_count"], 2)
        self.assertEqual(rows[0]["observation_count"], 3)

    def test_every_selected_experiment_must_have_the_variable(self):
        self.assertEqual(self.variables(["A", "B", "C"]), [])
        self.assertEqual(self.variables(["A", "missing"]), [])

    def test_duplicate_selection_does_not_change_intersection(self):
        self.assertEqual(self.variables(["B", "A", "A"]), self.variables(["A", "B"]))

    def test_unscoped_catalog_remains_available_for_assistant(self):
        self.assertIn("only_a", [row["variable_name"] for row in self.variables()])


if __name__ == "__main__":
    unittest.main()
