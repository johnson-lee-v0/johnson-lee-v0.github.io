#!/usr/bin/env python3
"""Export the pinned NBA EDA cohort; never train, download, or alter its source.

Run with the source repository's .venv-models/bin/python:
  python -B tools/export_nba_points.py --source-root /path/to/NBA-Games-Outcome
Use --check to compare a fresh export without writing any output.
"""
from __future__ import annotations

import argparse
from bisect import bisect_right
import hashlib
import html
import json
import math
from pathlib import Path
import random
import subprocess
import sys

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]
REVISION = "4e6d2ab76302339d1d6880cce217713877eec3d8"
UPSTREAM_REVISION = "e829d4678be1e075f99e5d41a1c5f97089be446b"
REPOSITORY = "https://github.com/johnson-lee-v0/NBA-Games-Outcome"
SAMPLE_SIZE = 1500
SAMPLE_SEED = 20261004
COURT = {"xMin": -25, "xMax": 25, "yMin": -5.25, "yMax": 41.75, "xBins": 25, "yBins": 24}
ZONES = [
    {"id": "rim", "label": "Rim"},
    {"id": "other-paint", "label": "Other paint"},
    {"id": "midrange", "label": "Midrange"},
    {"id": "corner-3", "label": "Corner 3"},
    {"id": "above-break-3", "label": "Above-break 3"},
    {"id": "backcourt", "label": "Backcourt"},
    {"id": "unlocated-heave", "label": "Unlocated heave"},
    {"id": "unknown", "label": "Unknown"},
]
EXPECTED_TOTALS = {2017: 211707, 2025: 219553}


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def axis_index(value, minimum, maximum, count):
    """numpy.histogram semantics: left-closed cells, with the final edge included."""
    if not math.isfinite(value) or not minimum <= value <= maximum:
        return None
    step = (maximum - minimum) / count
    edges = [minimum + index * step for index in range(count + 1)]
    edges[-1] = maximum
    return min(count - 1, bisect_right(edges, value) - 1)


def bin_index(x, y):
    column = axis_index(x, COURT["xMin"], COURT["xMax"], COURT["xBins"])
    row = axis_index(y, COURT["yMin"], COURT["yMax"], COURT["yBins"])
    if column is None or row is None:
        return None
    return column + row * COURT["xBins"]


def deterministic_sample(records, count=SAMPLE_SIZE, seed=SAMPLE_SEED):
    """Records are (game_id, event_id, x, y, zone); outcome is deliberately absent."""
    ordered = sorted(records, key=lambda row: (row[0], row[1]))
    if len({(row[0], row[1]) for row in ordered}) != len(ordered):
        raise ValueError("Duplicate shot key in visual sample cohort")
    selected = sorted(random.Random(seed).sample(range(len(ordered)), min(count, len(ordered))))
    return [[ordered[index][2], ordered[index][3], ordered[index][4]] for index in selected]


def source_metadata(source_root):
    revision = subprocess.check_output(["git", "-C", str(source_root), "rev-parse", "HEAD"], text=True).strip()
    dirty = subprocess.check_output(["git", "-C", str(source_root), "status", "--porcelain"], text=True).strip()
    if revision != REVISION or dirty:
        raise ValueError("Expected the clean, pinned NBA source checkout " + REVISION)
    manifest = json.loads((source_root / "data/source_manifest.json").read_text())
    if manifest["revision"] != UPSTREAM_REVISION:
        raise ValueError("Unexpected upstream source revision")
    archives = {entry["name"]: entry for entry in manifest["sources"]}
    artifacts = {entry["path"]: entry for entry in manifest["artifacts"]}
    files = []
    for relative in ["nba_outcome/eda.py", "nba_outcome/data.py", "data/source_manifest.json",
                     "artifacts/eda/league_shot_zones.csv", "artifacts/eda/coverage.csv"]:
        files.append({"path": relative, "sha256": sha256(source_root / relative)})
    relative = "data/processed/team_games.csv.gz"
    digest = sha256(source_root / relative)
    if artifacts.get(relative, {}).get("sha256") != digest:
        raise ValueError("Processed team-game checksum mismatch")
    files.append({"path": relative, "sha256": digest})
    for name in ["shotdetail_2017", "shotdetail_2025", "nbastatsv3_2025"]:
        relative = f"data/raw/{name}.tar.xz"
        digest = sha256(source_root / relative)
        if archives.get(name, {}).get("sha256") != digest:
            raise ValueError("Archive checksum mismatch: " + name)
        files.append({"path": relative, "sha256": digest, "url": archives[name]["url"]})
    return {"repository": REPOSITORY, "revision": revision, "upstreamRevision": UPSTREAM_REVISION,
            "sourceFiles": files,
            "sampling": {"method": "random.Random sample of sorted (game_id, GAME_EVENT_ID) keys; no outcome weighting",
                         "seed": SAMPLE_SEED, "perSeason": SAMPLE_SIZE},
            "denominator": "All quality-screened regular-season attempts, including unlocated heaves and shots beyond half court.",
            "binOrder": "xbin + ybin * 25; half-open cells except included maximum edges"}


def build_export(source_root):
    source_root = Path(source_root).resolve()
    provenance = source_metadata(source_root)
    sys.path.insert(0, str(source_root))
    import numpy as np
    import pandas as pd
    from nba_outcome.data import normalized_game_id, read_archive
    from nba_outcome.eda import prepare_shots, extract_team_heaves, ZONES as SOURCE_ZONES

    if SOURCE_ZONES != [zone["label"] for zone in ZONES]:
        raise ValueError("Source zone ordering changed")
    games = pd.read_csv(source_root / "data/processed/team_games.csv.gz", dtype={"game_id": str}).copy()
    if games.duplicated(["game_id", "team_id"]).any() or not games.groupby("game_id").size().eq(2).all():
        raise ValueError("Expected two unique team perspectives per game")
    games["game_quality"] = games.groupby("game_id").data_quality.transform("min")
    saved_zones = pd.read_csv(source_root / "artifacts/eda/league_shot_zones.csv")
    coverage = pd.read_csv(source_root / "artifacts/eda/coverage.csv")
    zone_indices = {zone["label"]: index for index, zone in enumerate(ZONES)}
    seasons = []
    for year in (2017, 2025):
        cohort = games[(games.season_start == year) & (games.season_type == "Regular Season")].copy()
        pbp = None
        if year == 2025:
            pbp = read_archive(source_root / "data/raw/nbastatsv3_2025.tar.xz")
            ambiguous = pbp[pbp.actionType.eq("Heave") & ~pbp.location.isin(["h", "v"])]
            ambiguous_ids = set(normalized_game_id(ambiguous.gameId)) & set(cohort.game_id)
            cohort.loc[cohort.game_id.isin(ambiguous_ids), "game_quality"] = 0
        shots, audit = prepare_shots(read_archive(source_root / f"data/raw/shotdetail_{year}.tar.xz"), cohort)
        for column in ("fga", "fgm", "fg3a", "fg3m", "field_goal_points"):
            actual = shots.groupby(["game_id", "team_id"])[column].sum().sort_index()
            reference = cohort[cohort.game_quality.eq(1)].set_index(["game_id", "team_id"])[column].sort_index()
            if not actual.index.equals(reference.index) or not np.array_equal(actual.values, reference.values):
                raise ValueError(f"Shot archive and processed team data disagree: {year}/{column}")
        if pbp is not None:
            heaves, _ = extract_team_heaves(pbp, cohort, shots)
            if len(heaves):
                shots = pd.concat([shots, heaves], ignore_index=True)
            del pbp
        if len(shots) != EXPECTED_TOTALS[year]:
            raise ValueError("Incorrect full-cohort denominator")
        zone_totals = [int(shots.zone.eq(zone["label"]).sum()) for zone in ZONES]
        saved = saved_zones[(saved_zones.season_start == year) & (saved_zones.season_type == "Regular Season")].set_index("zone")
        if zone_totals != [int(saved.loc[zone["label"], "fga"]) if zone["label"] in saved.index else 0 for zone in ZONES]:
            raise ValueError("Full zone counts disagree with the published EDA CSV")
        spatial = shots[shots.halfcourt_map_valid].copy()
        records = [(str(row.game_id), int(row.GAME_EVENT_ID), float(row.LOC_X) / 10,
                    float(row.LOC_Y) / 10, zone_indices[row.zone]) for row in spatial.itertuples()]
        bins = [[0] * len(ZONES) for _ in range(COURT["xBins"] * COURT["yBins"])]
        for _, _, x, y, zone in records:
            index = bin_index(x, y)
            if index is None:
                raise ValueError("Source half-court record lies outside exported bounds")
            bins[index][zone] += 1
        # Independently reproduce each zone's original numpy histogram, including edge semantics.
        for zone_index, zone in enumerate(ZONES):
            subset = spatial[spatial.zone.eq(zone["label"])]
            reference, _, _ = np.histogram2d(subset.LOC_X / 10, subset.LOC_Y / 10,
                bins=[np.linspace(-25, 25, 26), np.linspace(-5.25, 41.75, 25)])
            if [cell[zone_index] for cell in bins] != reference.T.astype(int).ravel().tolist():
                raise ValueError("Cell counts disagree with source histogram semantics")
        row = coverage[(coverage.season_start == year) & (coverage.season_type == "Regular Season")].iloc[0]
        unlocated = int((~shots.coordinate_valid).sum())
        if len(shots) != row.included_attempts or len(spatial) != len(shots) - unlocated - row.beyond_halfcourt_attempts:
            raise ValueError("Map eligibility does not match the published coverage audit")
        points = deterministic_sample(records)
        seasons.append({"id": str(year), "label": f"{year}–{str(year + 1)[-2:]}",
                        "total": len(shots), "locatedHalfCourt": len(spatial), "unlocated": unlocated,
                        "sampleCount": len(points), "zoneTotals": zone_totals, "points": points, "bins": bins})
        print(f"{year}: total={len(shots):,}, half-court={len(spatial):,}, unlocated={unlocated:,}, sample={len(points):,}", file=sys.stderr)
    return {"schemaVersion": 1, "source": provenance, "court": COURT, "zones": ZONES, "seasons": seasons}


def render_svg(data):
    """A flat, equally scaled court containing only the exported 2025 sample."""
    season = next(season for season in data["seasons"] if season["id"] == "2025")
    # 16 px/foot on both axes: 800 × 752 px court, with basket below center.
    project_x = lambda x: 500 + x * 16
    project_y = lambda y: 900 - (y + 5.25) * 16
    dots = "\n".join(f'    <circle cx="{project_x(x):.2f}" cy="{project_y(y):.2f}" r="2.1"/>' for x, y, _ in season["points"])
    # Arc geometry matches the source court: 23.75-foot arc, 22-foot corner lines.
    arc_x = 23.75 * math.cos(math.radians(22))
    arc_y = 23.75 * math.sin(math.radians(22))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" role="img" aria-labelledby="title description">
  <title id="title">Recorded NBA shot locations, 2025–26</title>
  <desc id="description">A deterministic sample of {season["sampleCount"]:,} recorded regular-season half-court shot origins. Each dot is an actual archived location, not a ball trajectory. This visual sample is not used to calculate statistics.</desc>
  <metadata>{html.escape(json.dumps({"repository": REPOSITORY, "revision": REVISION, "upstreamRevision": UPSTREAM_REVISION, "sampleSeed": SAMPLE_SEED}, separators=(",", ":")))}</metadata>
  <rect width="1000" height="1000" fill="#f3f0e8"/>
  <text x="100" y="72" fill="#202b28" font-family="Georgia,serif" font-size="36">Where the league takes its shots.</text>
  <text x="100" y="109" fill="#53605a" font-family="Arial,sans-serif" font-size="20">Sample of recorded shots · 2025–26</text>
  <g fill="#355846" fill-opacity="0.62">
{dots}
  </g>
  <g fill="none" stroke="#202b28" stroke-width="1.8">
    <rect x="100" y="148" width="800" height="752"/>
    <rect x="372" y="596" width="256" height="304"/>
    <circle cx="500" cy="816" r="12"/>
    <path d="M452 836H548"/>
    <path d="M404 596 A96 96 0 0 1 596 596"/>
    <path d="M148 900V672 M852 900V672"/>
    <path d="M{project_x(-arc_x):.2f} {project_y(arc_y):.2f} A380 380 0 0 1 {project_x(arc_x):.2f} {project_y(arc_y):.2f}"/>
  </g>
  <text x="100" y="952" fill="#53605a" font-family="Arial,sans-serif" font-size="18">{season["sampleCount"]:,} actual locations · regular season · not shot trajectories</text>
</svg>
'''


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", required=True, type=Path)
    parser.add_argument("--check", action="store_true", help="Regenerate and compare in memory; do not write files")
    args = parser.parse_args(argv)
    data = build_export(args.source_root)
    outputs = {ROOT / "data/nba-shot-patterns.json": json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
               ROOT / "image/Project_Cover/NBA-recorded-shots.svg": render_svg(data)}
    for path, content in outputs.items():
        if args.check:
            if not path.exists() or path.read_text() != content:
                raise ValueError("Generated artifact differs: " + str(path))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        print(("Verified " if args.check else "Exported ") + str(path), file=sys.stderr)


if __name__ == "__main__":
    main()
