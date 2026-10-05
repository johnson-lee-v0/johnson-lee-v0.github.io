"""Fast stdlib artifact tests, plus optional read-only source regeneration.

python -B -m unittest discover -s tests -p test_nba_export.py
For full source validation, set NBA_SOURCE_ROOT and use its .venv-models Python.
"""
from collections import Counter
import importlib.util
import json
import math
import os
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("export_nba_points", ROOT / "tools/export_nba_points.py")
exporter = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(exporter)
DATA = json.loads((ROOT / "data/nba-shot-patterns.json").read_text())
EXPECTED_ZONES = {
    "2017": [66875, 33243, 40336, 15609, 55120, 524, 0, 0],
    "2025": [62087, 43741, 21945, 23492, 67169, 29, 1090, 0],
}


class ArtifactTests(unittest.TestCase):
    def test_source_provenance_and_exact_schema(self):
        self.assertEqual(DATA["schemaVersion"], 1)
        self.assertEqual(DATA["source"]["revision"], exporter.REVISION)
        self.assertEqual(DATA["source"]["upstreamRevision"], exporter.UPSTREAM_REVISION)
        self.assertEqual(DATA["court"], exporter.COURT)
        self.assertEqual(DATA["zones"], exporter.ZONES)
        self.assertEqual(DATA["source"]["sampling"]["seed"], 20261004)
        files = {entry["path"]: entry for entry in DATA["source"]["sourceFiles"]}
        self.assertIn("data/raw/nbastatsv3_2025.tar.xz", files)
        for source in files.values():
            self.assertRegex(source["sha256"], r"^[a-f0-9]{64}$")
        self.assertEqual(files["data/raw/shotdetail_2017.tar.xz"]["sha256"],
                         "a62d25aa9c9190477f350f06a9a2d808c7908a6720786970319a3b28af184e81")

    def test_full_counts_never_use_the_sample_denominator(self):
        for season in DATA["seasons"]:
            year = season["id"]
            self.assertEqual(season["zoneTotals"], EXPECTED_ZONES[year])
            self.assertEqual(sum(season["zoneTotals"]), season["total"])
            self.assertEqual(season["total"], {"2017": 211707, "2025": 219553}[year])
            self.assertEqual(season["locatedHalfCourt"], {"2017": 211182, "2025": 218434}[year])
            self.assertEqual(season["unlocated"], {"2017": 0, "2025": 1090}[year])
            self.assertEqual(season["total"] - season["locatedHalfCourt"] - season["unlocated"],
                             {"2017": 525, "2025": 29}[year])
            self.assertEqual(season["sampleCount"], 1500)
            self.assertEqual(len(season["points"]), 1500)
            self.assertLess(season["sampleCount"], season["locatedHalfCourt"])
            self.assertEqual(len(season["bins"]), 600)
            for cell in season["bins"]:
                self.assertEqual(len(cell), 8)
                self.assertTrue(all(type(value) is int and value >= 0 for value in cell))
                self.assertEqual(cell[6], 0, "Unlocated heaves must never appear at the basket")
            self.assertEqual(sum(map(sum, season["bins"])), season["locatedHalfCourt"])
            for index in range(8):
                self.assertLessEqual(sum(cell[index] for cell in season["bins"]), season["zoneTotals"][index])
            for x, y, zone in season["points"]:
                self.assertIsNotNone(exporter.bin_index(x, y))
                self.assertIn(zone, range(8))
                self.assertNotEqual(zone, 6)
                self.assertGreater(season["bins"][exporter.bin_index(x, y)][zone], 0)
                self.assertAlmostEqual(x * 10, round(x * 10), places=7)
                self.assertAlmostEqual(y * 10, round(y * 10), places=7)

    def test_boundary_and_invalid_coordinate_semantics(self):
        self.assertEqual(exporter.bin_index(-25, -5.25), 0)
        self.assertEqual(exporter.bin_index(25, 41.75), 599)
        self.assertEqual(exporter.bin_index(-23, -5.25), 1)
        self.assertEqual(exporter.bin_index(0, 0), 62, "An actual zero-coordinate player shot is valid")
        for index in range(24):
            y = -5.25 + index * (47 / 24)
            self.assertEqual(exporter.bin_index(-25, y), index * 25)
        for x, y in [(-25.001, 0), (25.001, 0), (0, -5.251), (0, 41.751),
                     (float("nan"), 0), (0, float("inf"))]:
            self.assertIsNone(exporter.bin_index(x, y))

    def test_sampling_is_repeatable_order_independent_and_preserves_records(self):
        records = [(str(index // 10).zfill(10), index, index / 10, index / 20, index % 5) for index in range(100)]
        sample = exporter.deterministic_sample(records, count=15)
        self.assertEqual(sample, exporter.deterministic_sample(list(reversed(records)), count=15))
        self.assertEqual(sample, exporter.deterministic_sample(records, count=15))
        self.assertEqual(len(sample), 15)
        self.assertTrue(all(tuple(point) in {row[2:] for row in records} for point in sample))
        self.assertNotEqual(sample, exporter.deterministic_sample(records, count=15, seed=1))
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            exporter.deterministic_sample(records + [records[0]])

    def test_cover_contains_exact_sample_without_court_distortion(self):
        text = (ROOT / "image/Project_Cover/NBA-recorded-shots.svg").read_text()
        self.assertEqual(text, exporter.render_svg(DATA))
        svg = ET.fromstring(text)
        ns = {"s": "http://www.w3.org/2000/svg"}
        self.assertEqual(svg.attrib["width"], "1000")
        self.assertEqual(svg.attrib["height"], "1000")
        dots = svg.findall("s:g[@fill='#355846']/s:circle", ns)
        season = DATA["seasons"][1]
        self.assertEqual(len(dots), 1500)
        for dot, (x, y, _) in zip(dots, season["points"]):
            self.assertAlmostEqual(float(dot.attrib["cx"]), 500 + 16 * x, places=2)
            self.assertAlmostEqual(float(dot.attrib["cy"]), 900 - 16 * (y + 5.25), places=2)
        self.assertIn("Sample of recorded shots · 2025–26", text)
        self.assertNotIn("<script", text)
        self.assertNotIn("<animate", text)
        self.assertNotIn("<image", text)


@unittest.skipUnless(os.environ.get("NBA_SOURCE_ROOT"), "Set NBA_SOURCE_ROOT for read-only source validation")
class SourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source_root = Path(os.environ["NBA_SOURCE_ROOT"])
        cls.rebuilt = exporter.build_export(cls.source_root)

    def test_fresh_source_export_is_identical(self):
        # build_export checks all 600 × 8 cells per season against numpy.histogram2d,
        # reconciles shot counts with team-games, and all zone totals with saved CSV.
        self.assertEqual(self.rebuilt, DATA)

    def test_heave_placeholder_cannot_become_a_rim_point(self):
        import pandas as pd
        from nba_outcome.eda import extract_team_heaves
        pbp = pd.DataFrame({"actionType": ["Heave"], "subType": ["Team Field Goal Attempt"],
                            "gameId": [21700001], "actionId": [10], "actionNumber": [14],
                            "location": ["v"], "xLegacy": [0], "yLegacy": [0]})
        games = pd.DataFrame({"game_id": ["0021700001"] * 2, "is_home": [1, 0], "team_id": [1, 2],
                              "team_abbr": ["BOS", "NYK"], "season_start": [2017] * 2,
                              "season_type": ["Regular Season"] * 2, "game_quality": [1, 1]})
        shots = pd.DataFrame({"game_id": ["0021700001"], "GAME_EVENT_ID": [1]})
        restored, audit = extract_team_heaves(pbp, games, shots)
        self.assertEqual(audit["included_team_heaves"], 1)
        self.assertTrue(restored.LOC_X.isna().all())
        self.assertTrue(restored.LOC_Y.isna().all())
        self.assertFalse(restored.halfcourt_map_valid.any())
        self.assertTrue(restored.zone.eq("Unlocated heave").all())


if __name__ == "__main__":
    unittest.main()
