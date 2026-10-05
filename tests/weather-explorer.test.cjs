/* Run with node --test tests/weather-explorer.test.cjs. No browser or packages required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('projects/Max_Temperature.html');
const css = read('css/weather-explorer.css');
const script = read('js/weather-explorer.js');
const data = JSON.parse(read('data/weather-comparison.json'));
const commit = '8d8b132f5228c4002780c29d6da13ce4c8686af7';
const candidates = ['original_raw', 'original_local', 'original_pooled', 'original_fedavg', 'n00_local_ridge_compact', 'n06_pooled_ridge_compact'];
// Independently transcribed from the pinned regional_metrics, later/all subset.
const expected = {
  NYC: [2.490522088353413, 2.398203827836488, 2.457563862449967, 2.459852875712725, 2.276265477427706, 2.37287811049986],
  LAX: [3.32112449799197, 2.000782666193286, 2.23379347688563, 2.058091484755259, 1.760921482461634, 1.898179313632752],
  DFW: [2.84273092369478, 2.429310713211832, 2.313915230693547, 2.464337482691421, 1.928625782461181, 1.97401555490729]
};
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const buttonTags = [...html.matchAll(/<button\b[^>]*data-weather-station[^>]*>/g)].map(match => match[0]);
const panelTags = [...html.matchAll(/<section\b[^>]*data-weather-panel[^>]*>/g)].map(match => match[0]);
const panelsMarkup = [...html.matchAll(/<section class="weather-station"[^>]*>[\s\S]*?\n          <\/section>/g)].map(match => match[0]);

test('weather evidence retains the exact pinned data and matched window', () => {
  assert.equal(data.source.commit, commit);
  assert.equal(data.source.path, 'regional_metrics');
  assert.deepEqual(data.source.filter, { period: 'later', season: 'all' });
  assert.equal(data.start, '2026-01-08');
  assert.equal(data.end, '2026-09-13');
  assert.equal(data.nPerStation, 249);
  assert.equal(data.metric, 'mae');
  assert.equal(data.unit, '°F');
  assert.equal(data.lowerIsBetter, true);
  assert.deepEqual(data.scale, [0, 4]);
  assert.deepEqual(data.models.map(model => model.id), candidates);
  assert.deepEqual(data.models.map(model => model.group), ['original', 'original', 'original', 'original', 'nbs', 'nbs']);
  assert.deepEqual(data.stations.map(station => station.id), ['NYC', 'LAX', 'DFW']);
  for (const station of data.stations) {
    assert.deepEqual(candidates.map(id => station.mae[id]), expected[station.id]);
    const panel = panelsMarkup.find(markup => markup.includes(`data-weather-panel="${station.id}"`));
    assert.ok(panel.includes(station.name));
    for (const [index, candidate] of candidates.entries()) {
      const value = expected[station.id][index];
      const row = panel.match(new RegExp(`<tr data-weather-candidate="${candidate}"[^>]*>[\\s\\S]*?<\\/tr>`))[0];
      assert.ok(row.includes(`data-weather-mae="${value}"`));
      assert.ok(row.includes(`--weather-value: ${value}`));
      assert.ok(row.includes(`>${value.toFixed(3)} <span>°F</span>`));
      assert.ok(value >= 0 && value <= 4);
    }
  }
  for (const source of [data.source.metrics, data.source.protocol]) assert.ok(html.includes(`href="${source}"`));
  assert.match(html, /January 8–September 13, 2026 · 249 dates per station/);
});

test('all stations and separate experiments remain complete without JavaScript', () => {
  assert.equal(panelTags.length, 3);
  assert.equal(panelsMarkup.length, 3);
  for (const tag of panelTags) assert.doesNotMatch(tag, /\bhidden\b|aria-hidden/);
  for (const panel of panelsMarkup) {
    const groups = [...panel.matchAll(/<section class="weather-experiment[^>]*>[\s\S]*?<\/section>/g)].map(match => match[0]);
    assert.equal(groups.length, 2);
    assert.deepEqual([...groups[0].matchAll(/data-weather-candidate="([^"]+)"/g)].map(match => match[1]), candidates.slice(0, 4));
    assert.deepEqual([...groups[1].matchAll(/data-weather-candidate="([^"]+)"/g)].map(match => match[1]), candidates.slice(4));
    for (const group of groups) {
      assert.match(group, /<caption>[^<]+mean absolute error in degrees Fahrenheit\.<\/caption>/);
      assert.match(group, /<th scope="col">Model<\/th><th scope="col">MAE \(°F\)<\/th>/);
      assert.match(group, /class="weather-axis" aria-hidden="true"><span>0<\/span><span>2<\/span><span>4°F<\/span>/);
    }
  }
  assert.match(html, /id="weather-controls"[^>]*role="group"[^>]*hidden/);
  assert.match(html, /id="weather-status" role="status" aria-live="polite" aria-atomic="true"/);
  assert.equal((html.match(/class="weather-track" aria-hidden="true"/g) || []).length, 18);
  assert.equal((html.match(/<colgroup><col class="weather-model-column"><col><\/colgroup>/g) || []).length, 6);
  assert.match(html, /Retrospective comparison on identical dates; not an untouched holdout\./);
  assert.match(html, /<details class="weather-methods">[\s\S]*six-hour forecast-arrival[\s\S]*seven days[\s\S]*refit weekly[\s\S]*already been examined/);
  assert.match(html, /different inputs and fits from experiment 01/);
  assert.match(html, /same-input improvement from sharing/);
  assert.ok(html.indexOf('id="weather-explorer"') < html.indexOf('<figure class="project-figure">'));
  assert.match(html, /Max-temperature-landscape\.png/);
  assert.match(html, /class="project-continuation"[\s\S]*\.\/University_Twitter\.html/);
});

function setup(options = {}) {
  const make = tag => {
    const attributes = attrs(tag);
    return {
      attributes, id: attributes.id, hidden: /\shidden(?:\s|>)/.test(tag), dataset: {}, listeners: {},
      getAttribute(name) { return this.attributes[name]; },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); },
      click() { for (const callback of this.listeners.click || []) callback(); }
    };
  };
  const buttons = buttonTags.slice(0, options.buttonCount ?? 3).map(tag => {
    const button = make(tag); button.dataset.weatherStation = button.attributes['data-weather-station']; return button;
  });
  const panels = panelTags.slice(0, options.panelCount ?? 3).map(tag => {
    const panel = make(tag);
    panel.dataset.weatherPanel = panel.attributes['data-weather-panel'];
    panel.dataset.weatherName = panel.attributes['data-weather-name'];
    return panel;
  });
  if (options.duplicateStation) buttons[1].dataset.weatherStation = 'NYC';
  if (options.badTarget) buttons[1].attributes['aria-controls'] = 'missing';
  const explorer = make('<section id="weather-explorer">');
  explorer.querySelectorAll = selector => selector === '[data-weather-station]' ? buttons : panels;
  const controls = make('<div id="weather-controls" hidden>');
  let statusWrites = 0, statusValue = '';
  const status = { get textContent() { return statusValue; }, set textContent(value) { statusWrites++; statusValue = value; } };
  const elements = { 'weather-explorer': explorer, 'weather-controls': controls, 'weather-status': status };
  const document = { getElementById: id => id === options.missing ? null : elements[id] };
  const run = () => vm.runInNewContext(script, { document });
  run();
  return { buttons, panels, explorer, controls, status, run, get statusWrites() { return statusWrites; } };
}

test('station enhancement is native, deterministic, and idempotent', () => {
  const app = setup();
  assert.equal(app.controls.hidden, false);
  assert.equal(app.explorer.dataset.weatherInitialized, 'true');
  assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.dataset.weatherPanel), ['NYC']);
  for (const id of ['DFW', 'LAX', 'NYC', 'NYC', 'DFW']) {
    const button = app.buttons.find(button => button.dataset.weatherStation === id);
    assert.equal(button.attributes.type, 'button');
    button.click();
    assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.dataset.weatherPanel), [id]);
    assert.deepEqual(app.buttons.filter(button => button.attributes['aria-pressed'] === 'true').map(button => button.dataset.weatherStation), [id]);
    assert.match(app.status.textContent, new RegExp(`Showing .*${id}.*Two separate experiments`));
  }
  const writes = app.statusWrites;
  app.buttons.find(button => button.dataset.weatherStation === 'DFW').click();
  assert.equal(app.statusWrites, writes, 'Repeated selection does not repeat the live announcement');
  app.run();
  assert.equal(app.statusWrites, writes, 'Reinitialization preserves the selected station');
  for (const button of app.buttons) assert.equal(button.listeners.click.length, 1, 'No duplicate event listeners');
  app.buttons[1].click();
  assert.equal(app.statusWrites, writes + 1);
});

test('partial or invalid markup leaves every result visible and controls hidden', () => {
  for (const options of [{ missing: 'weather-explorer' }, { missing: 'weather-controls' }, { missing: 'weather-status' }, { buttonCount: 2 }, { panelCount: 2 }, { duplicateStation: true }, { badTarget: true }]) {
    const app = setup(options);
    assert.equal(app.controls.hidden, true);
    assert.ok(app.panels.every(panel => !panel.hidden));
    assert.ok(app.buttons.every(button => !button.listeners.click));
    assert.equal(app.statusWrites, 0);
  }
});

test('shared scales and responsive controls need no animation, network or dependencies', () => {
  assert.match(css, /width: calc\(var\(--weather-value\) \* 25%\)/);
  assert.match(css, /\.weather-experiments \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/);
  assert.match(css, /\.weather-controls button \{[\s\S]*?min-height: 44px/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.weather-experiments \{ grid-template-columns: 1fr/);
  assert.match(css, /\[hidden\] \{ display: none !important/);
  assert.doesNotMatch(css, /(?:^|[;{\n])\s*(?:animation|transition|transform)\s*:/m);
  assert.doesNotMatch(script, /fetch\(|XMLHttpRequest|import\s|require\(|setInterval|setTimeout|requestAnimationFrame|innerHTML/);
  assert.match(html, /<script defer src="\.\.\/js\/weather-explorer\.js/);
});
