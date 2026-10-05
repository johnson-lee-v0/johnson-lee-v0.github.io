(function () {
  "use strict";

  const COURT = { xMin: -25, xMax: 25, yMin: -5.25, yMax: 41.75, xBins: 25, yBins: 24 };
  const ZONES = ["rim", "other-paint", "midrange", "corner-3", "above-break-3", "backcourt", "unlocated-heave", "unknown"];
  const sum = values => values.reduce((total, value) => total + value, 0);
  const count = value => Number.isSafeInteger(value) && value >= 0;

  function validate(data) {
    if (!data || data.schemaVersion !== 1 || !data.court ||
        Object.keys(COURT).some(key => data.court[key] !== COURT[key]) ||
        !Array.isArray(data.zones) || data.zones.length !== ZONES.length ||
        data.zones.some((zone, index) => !zone || zone.id !== ZONES[index] || typeof zone.label !== "string" || !zone.label.trim()) ||
        !Array.isArray(data.seasons) || data.seasons.length !== 2) return false;
    return data.seasons.every((season, index) => {
      if (!season || season.id !== ["2017", "2025"][index] || typeof season.label !== "string" || !season.label.trim() ||
          !count(season.total) || season.total === 0 ||
          !count(season.locatedHalfCourt) || season.locatedHalfCourt > season.total ||
          !count(season.unlocated) || !Array.isArray(season.zoneTotals) ||
          season.zoneTotals.length !== ZONES.length || !season.zoneTotals.every(count) ||
          sum(season.zoneTotals) !== season.total || season.zoneTotals[6] !== season.unlocated ||
          !count(season.sampleCount) || season.sampleCount === 0 || season.sampleCount > season.locatedHalfCourt ||
          !Array.isArray(season.points) || season.points.length !== season.sampleCount ||
          !Array.isArray(season.bins) || season.bins.length !== 600) return false;
      const totals = Array(ZONES.length).fill(0);
      for (const bin of season.bins) {
        if (!Array.isArray(bin) || bin.length !== ZONES.length || !bin.every(count) || bin[6] !== 0) return false;
        bin.forEach((value, zone) => { totals[zone] += value; });
      }
      if (sum(totals) !== season.locatedHalfCourt || totals.some((value, zone) => value > season.zoneTotals[zone])) return false;
      return season.points.every(point => Array.isArray(point) && point.length === 3 &&
        Number.isFinite(point[0]) && Number.isFinite(point[1]) &&
        point[0] >= COURT.xMin && point[0] <= COURT.xMax &&
        point[1] >= COURT.yMin && point[1] <= COURT.yMax &&
        Number.isInteger(point[2]) && point[2] >= 0 && point[2] < ZONES.length && point[2] !== 6);
    });
  }

  function summarize(data, zoneId) {
    const zone = zoneId === "all" ? -1 : ZONES.indexOf(zoneId);
    if (zone < 0 && zoneId !== "all") throw new RangeError("Unknown shot zone");
    const seasons = data.seasons.map(season => {
      const attempts = zone === -1 ? season.total : season.zoneTotals[zone];
      return { attempts, share: attempts / season.total * 100 };
    });
    return { seasons, change: seasons[1].share - seasons[0].share };
  }

  function binIndex(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < COURT.xMin ||
        x > COURT.xMax || y < COURT.yMin || y > COURT.yMax) return -1;
    const column = Math.min(24, Math.floor((x - COURT.xMin) / 2));
    // Compare with the actual edges: dividing a boundary coordinate can round
    // just below its integer row and put an on-edge shot in the wrong cell.
    const step = (COURT.yMax - COURT.yMin) / COURT.yBins;
    let row = 0;
    while (row < COURT.yBins - 1 && y >= COURT.yMin + (row + 1) * step) row++;
    return column + row * 25;
  }

  if (typeof module === "object" && module.exports) module.exports = { validate, summarize, binIndex };
  if (typeof document === "undefined") return;

  const root = document.getElementById("nba-pattern");
  if (!root || root.dataset.ready === "true") return;
  const canvas = root.querySelector("canvas");
  const controls = root.querySelector("[data-pattern-controls]");
  const zoneControls = root.querySelector("[data-pattern-zones]");
  const surface = root.querySelector("[data-pattern-surface]");
  const fallback = root.querySelector("[data-pattern-fallback]");
  const failure = root.querySelector("[data-pattern-failure]");
  const retry = root.querySelector("[data-pattern-retry]");
  const seasonButtons = Array.from(root.querySelectorAll("[data-pattern-season]"));
  const viewButtons = Array.from(root.querySelectorAll("[data-pattern-view]"));
  const zoneButtons = Array.from(root.querySelectorAll("[data-pattern-zone]"));
  const mapLabel = root.querySelector("[data-pattern-map-label]");
  const mapHelp = root.querySelector("[data-pattern-map-help]");
  const zoneLabel = root.querySelector("[data-pattern-zone-label]");
  const shares = Array.from(root.querySelectorAll("[data-pattern-share]"));
  const attempts = Array.from(root.querySelectorAll("[data-pattern-attempts]"));
  const change = root.querySelector("[data-pattern-change]");
  const status = root.querySelector("[data-pattern-status]");
  const hasChoices = (buttons, key, choices) => buttons.length === choices.length &&
    choices.every(choice => buttons.filter(button => button.dataset[key] === choice).length === 1);
  if (!canvas || !controls || !zoneControls || !surface || !fallback || !failure || !retry ||
      !mapLabel || !mapHelp || !zoneLabel || !change || !status || shares.length !== 2 || attempts.length !== 2 ||
      !hasChoices(seasonButtons, "patternSeason", ["2017", "2025"]) ||
      !hasChoices(viewButtons, "patternView", ["sample", "pattern"]) ||
      !hasChoices(zoneButtons, "patternZone", ["all", ...ZONES.slice(0, 5)])) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  let loading = false;

  async function initialize() {
    if (loading || root.dataset.ready === "true") return;
    loading = true;
    try {
      const response = await fetch(root.dataset.source);
      if (!response.ok) throw new Error("Unavailable data");
      const data = await response.json();
      if (!validate(data)) throw new Error("Invalid data");
      const state = { season: "2025", view: "sample", zone: "midrange" };
      const maxShare = Math.max(...data.seasons.flatMap(season => season.bins.map(bin => sum(bin) / season.total)));
      let geometry;
      let resizeFrame = 0;
      const forcedColors = window.matchMedia("(forced-colors: active)");

      function project(x, y) {
        return [geometry.left + (x - COURT.xMin) * geometry.scale,
          geometry.top + (COURT.yMax - y) * geometry.scale];
      }

      function drawCourt() {
        const line = points => {
          context.beginPath();
          points.forEach((point, index) => {
            const coordinates = project(point[0], point[1]);
            if (index === 0) context.moveTo(coordinates[0], coordinates[1]);
            else context.lineTo(coordinates[0], coordinates[1]);
          });
          context.stroke();
        };
        const arc = (x, y, radius, first, last) => {
          const points = [];
          for (let i = 0; i <= 64; i++) {
            const angle = (first + (last - first) * i / 64) * Math.PI / 180;
            points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
          }
          line(points);
        };
        context.globalAlpha = 0.7;
        context.strokeStyle = forcedColors.matches ? "CanvasText" : "#53605a";
        context.lineWidth = 1;
        line([[-25, -5.25], [-25, 41.75], [25, 41.75], [25, -5.25], [-25, -5.25]]);
        line([[-8, -5.25], [-8, 13.75], [8, 13.75], [8, -5.25]]);
        line([[-3, -1.25], [3, -1.25]]);
        line([[-22, -5.25], [-22, 9]]);
        line([[22, -5.25], [22, 9]]);
        arc(0, 0, 0.75, 0, 360);
        arc(0, 13.75, 6, 0, 180);
        arc(0, 0, 23.75, 22, 158);
        context.globalAlpha = 1;
      }

      function dot(x, y, radius, selected) {
        const point = project(x, y);
        context.fillStyle = forcedColors.matches ? "CanvasText" : selected ? "#355846" : "#839180";
        context.globalAlpha = selected ? 0.76 : 0.18;
        context.beginPath();
        context.arc(point[0], point[1], radius, 0, Math.PI * 2);
        context.fill();
      }

      function draw() {
        if (document.hidden) return;
        const bounds = canvas.getBoundingClientRect();
        if (bounds.width < 1 || bounds.height < 1) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.round(bounds.width * ratio), height = Math.round(bounds.height * ratio);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width; canvas.height = height;
        }
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, bounds.width, bounds.height);
        const padding = Math.max(20, bounds.width * 0.055);
        const scale = Math.min((bounds.width - padding * 2) / 50, (bounds.height - padding * 2) / 47);
        geometry = { scale, left: (bounds.width - scale * 50) / 2, top: (bounds.height - scale * 47) / 2 };
        const season = data.seasons.find(item => item.id === state.season);
        const zone = ZONES.indexOf(state.zone);
        if (state.view === "sample") {
          for (const selected of [false, true]) {
            season.points.forEach(point => {
              const matches = zone === -1 || point[2] === zone;
              if (matches === selected) dot(point[0], point[1], Math.max(1, scale * 0.13), matches);
            });
          }
        } else {
          season.bins.forEach((bin, index) => {
            const x = -24 + index % 25 * 2;
            const y = COURT.yMin + (Math.floor(index / 25) + 0.5) * 47 / 24;
            const total = sum(bin);
            if (zone !== -1 && total > 0) dot(x, y, 0.85 * scale * Math.sqrt(total / season.total / maxShare), false);
            const value = zone === -1 ? total : bin[zone];
            if (value > 0) dot(x, y, 0.85 * scale * Math.sqrt(value / season.total / maxShare), true);
          });
        }
        drawCourt();
      }

      function update(announce) {
        const season = data.seasons.find(item => item.id === state.season);
        const label = state.zone === "all" ? "All areas" : data.zones.find(zone => zone.id === state.zone).label;
        const comparison = summarize(data, state.zone);
        const description = season.label + " · " + (state.view === "sample" ? season.sampleCount.toLocaleString("en-US") + " sampled locations" : "Complete half-court cell counts");
        seasonButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.patternSeason === state.season)));
        viewButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.patternView === state.view)));
        zoneButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.patternZone === state.zone)));
        mapLabel.textContent = description;
        mapHelp.textContent = state.view === "sample"
          ? "Each dot is one sampled shot. Select a shot or use the zone buttons to inspect its source-labelled area."
          : "Each circle groups shots in one court cell. Its area represents that cell’s share of all attempts, on the same scale for both seasons.";
        zoneLabel.textContent = label;
        comparison.seasons.forEach((result, index) => {
          shares[index].textContent = result.share.toFixed(2) + "%";
          attempts[index].textContent = result.attempts.toLocaleString("en-US") + " attempts";
        });
        const direction = comparison.change < -0.005 ? "Down " : comparison.change > 0.005 ? "Up " : "";
        change.textContent = direction + Math.abs(comparison.change).toFixed(2) + " percentage points";
        surface.setAttribute("aria-label", description + ". Highlighting " + label + ".");
        if (announce) status.textContent = description + ". " + label + ": " +
          comparison.seasons[0].share.toFixed(2) + " percent in 2017–18, " +
          comparison.seasons[1].share.toFixed(2) + " percent in 2025–26. " + change.textContent + ".";
        draw();
      }

      function select(key, value) {
        if (state[key] === value) return;
        state[key] = value;
        update(true);
      }
      seasonButtons.forEach(button => button.addEventListener("click", () => select("season", button.dataset.patternSeason)));
      viewButtons.forEach(button => button.addEventListener("click", () => select("view", button.dataset.patternView)));
      zoneButtons.forEach(button => button.addEventListener("click", () => select("zone", button.dataset.patternZone)));
      canvas.addEventListener("click", event => {
        if (state.view !== "sample" || !geometry) return;
        const bounds = canvas.getBoundingClientRect();
        let closest = null, distance = 16;
        const season = data.seasons.find(item => item.id === state.season);
        season.points.forEach(point => {
          const position = project(point[0], point[1]);
          const separation = Math.hypot(position[0] - (event.clientX - bounds.left), position[1] - (event.clientY - bounds.top));
          if (separation < distance && point[2] < 5) { closest = point; distance = separation; }
        });
        if (closest) select("zone", data.zones[closest[2]].id);
      });
      const resized = () => {
        if (resizeFrame) return;
        resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; draw(); });
      };
      if ("ResizeObserver" in window) new ResizeObserver(resized).observe(canvas);
      else window.addEventListener("resize", resized);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) draw(); });
      forcedColors.addEventListener("change", draw);
      controls.hidden = false;
      zoneControls.hidden = false;
      surface.hidden = false;
      fallback.hidden = true;
      failure.hidden = true;
      retry.hidden = true;
      root.dataset.ready = "true";
      update(false);
    } catch {
      failure.hidden = false;
      retry.hidden = false;
    } finally {
      loading = false;
    }
  }
  retry.addEventListener("click", initialize);
  initialize();
})();
