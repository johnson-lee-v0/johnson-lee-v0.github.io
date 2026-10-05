/* Run with node --test tests/nba-pattern.test.cjs. Uses the real data, script and HTML; no packages or browser. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const site = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(site, file), 'utf8');
const script = read('js/nba-pattern.js');
const html = read('projects/NBA_Games_Outcome.html');
const data = JSON.parse(read('data/nba-shot-patterns.json'));
const { validate, summarize, binIndex } = require('../js/nba-pattern.js');
const zoneIds = ['rim', 'other-paint', 'midrange', 'corner-3', 'above-break-3', 'backcourt', 'unlocated-heave', 'unknown'];
const clone = value => structuredClone(value);
const add = numbers => numbers.reduce((total, number) => total + number, 0);
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} != ${expected}`);
// Counts reconciled with the pinned league_shot_zones.csv and coverage.csv, not sampled dots.
const expected = [
  { total: 211707, located: 211182, unlocated: 0, zones: [66875, 33243, 40336, 15609, 55120, 524, 0, 0], offMap: [0, 0, 0, 0, 1, 524, 0, 0] },
  { total: 219553, located: 218434, unlocated: 1090, zones: [62087, 43741, 21945, 23492, 67169, 29, 1090, 0], offMap: [0, 0, 0, 0, 0, 29, 1090, 0] }
];

test('the shipped data conserves full attempts, per-zone cells and the sample separately', () => {
  assert.equal(validate(data), true);
  assert.deepEqual(data.zones.map(zone => zone.id), zoneIds);
  assert.deepEqual(data.seasons.map(season => season.id), ['2017', '2025']);
  for (const [index, season] of data.seasons.entries()) {
    const counts = expected[index];
    assert.equal(season.total, counts.total);
    assert.equal(season.locatedHalfCourt, counts.located);
    assert.equal(season.unlocated, counts.unlocated);
    assert.deepEqual(season.zoneTotals, counts.zones);
    assert.equal(add(season.zoneTotals), season.total);
    assert.equal(season.bins.length, 25 * 24);
    const binnedByZone = Array(8).fill(0);
    for (const cell of season.bins) {
      assert.equal(cell.length, 8);
      assert.ok(cell.every(value => Number.isSafeInteger(value) && value >= 0));
      cell.forEach((count, zone) => { binnedByZone[zone] += count; });
      assert.equal(cell[6], 0, 'Unlocated heaves cannot become rim dots or court cells');
    }
    assert.equal(add(binnedByZone), counts.located);
    assert.deepEqual(season.zoneTotals.map((total, zone) => total - binnedByZone[zone]), counts.offMap);
    assert.equal(add(counts.offMap), season.total - season.locatedHalfCourt);
    assert.equal(season.sampleCount, 1500);
    assert.equal(season.points.length, season.sampleCount);
    const sampledByZone = Array(8).fill(0);
    for (const [x, y, zone] of season.points) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
      assert.ok(Number.isInteger(zone) && zone >= 0 && zone < 8 && zone !== 6);
      const cell = binIndex(x, y);
      assert.ok(cell >= 0 && cell < 600);
      assert.ok(season.bins[cell][zone] > 0, 'Every sampled location belongs to a populated cell of its source-labelled zone');
      sampledByZone[zone]++;
    }
    assert.equal(add(sampledByZone), 1500);
    assert.ok(sampledByZone.every((count, zone) => count <= binnedByZone[zone]));
    assert.equal(sampledByZone[6], 0);
  }
});

test('both-season percentages and percentage-point changes use all attempts, never the map or sample', () => {
  for (const [zone, id] of zoneIds.entries()) {
    const result = summarize(data, id);
    const shares = expected.map(season => season.zones[zone] * 100 / season.total);
    for (let index = 0; index < 2; index++) {
      assert.equal(result.seasons[index].attempts, expected[index].zones[zone]);
      close(result.seasons[index].share, shares[index], `${id}, season ${index}`);
      if (expected[index].zones[zone] > 0) {
        assert.notEqual(result.seasons[index].share, expected[index].zones[zone] * 100 / expected[index].located);
        assert.notEqual(result.seasons[index].share, expected[index].zones[zone] * 100 / 1500);
      }
    }
    close(result.change, shares[1] - shares[0], `${id} percentage-point change`);
  }
  assert.deepEqual(summarize(data, 'all'), {
    seasons: expected.map(season => ({ attempts: season.total, share: 100 })), change: 0
  });
  const withoutPoints = clone(data);
  withoutPoints.seasons.forEach(season => { season.points = []; season.sampleCount = 0; });
  assert.deepEqual(summarize(withoutPoints, 'midrange'), summarize(data, 'midrange'), 'Changing the display sample cannot change league-level percentages');
  assert.ok(summarize(data, 'midrange').change < 0);
  assert.ok(summarize(data, 'corner-3').change > 0);
  assert.throws(() => summarize(data, 'not-a-zone'), RangeError);
});

test('cell centers and every boundary follow half-open bins with included maximum edges', () => {
  const xEdges = Array.from({ length: 26 }, (_, column) => -25 + column * 2);
  const yEdges = Array.from({ length: 25 }, (_, row) => -5.25 + row * (47 / 24));
  for (let row = 0; row < 24; row++) {
    for (let column = 0; column < 25; column++) {
      assert.equal(binIndex((xEdges[column] + xEdges[column + 1]) / 2, (yEdges[row] + yEdges[row + 1]) / 2), column + row * 25);
    }
  }
  for (let column = 0; column <= 25; column++) {
    assert.equal(binIndex(xEdges[column], -5.25), Math.min(column, 24));
    if (column > 0) assert.equal(binIndex(xEdges[column] - 1e-8, -5.25), column - 1);
    if (column < 25) assert.equal(binIndex(xEdges[column] + 1e-8, -5.25), column);
  }
  for (let row = 0; row <= 24; row++) {
    assert.equal(binIndex(-25, yEdges[row]), Math.min(row, 23) * 25, `Horizontal boundary ${row}`);
    if (row > 0) assert.equal(binIndex(-25, yEdges[row] - 1e-8), (row - 1) * 25);
    if (row < 24) assert.equal(binIndex(-25, yEdges[row] + 1e-8), row * 25);
  }
  assert.equal(binIndex(25, 41.75), 599);
  assert.equal(binIndex(25, -5.25), 24);
  assert.equal(binIndex(-25, 41.75), 575);
  assert.equal(binIndex(0, 0), 62, 'An actual recorded shot at (0, 0) is not a missing-location placeholder');
  for (const [x, y] of [[-25.001, 0], [25.001, 0], [0, -5.251], [0, 41.751], [NaN, 0], [0, NaN], [Infinity, 0], [0, -Infinity], ['0', 0], [null, 0]]) {
    assert.equal(binIndex(x, y), -1);
  }
});

test('validation rejects malformed structure, corrupt counts, non-finite coordinates and located heaves safely', () => {
  for (const value of [null, undefined, {}, [], 'data']) assert.equal(validate(value), false);
  const corruptions = {
    'schema version': draft => { draft.schemaVersion = 2; },
    'court geometry': draft => { draft.court.xMax = 24; },
    'zone order': draft => { [draft.zones[0], draft.zones[1]] = [draft.zones[1], draft.zones[0]]; },
    'null zone': draft => { draft.zones[0] = null; },
    'blank zone label': draft => { draft.zones[0].label = ' '; },
    'missing zone': draft => { draft.zones.pop(); },
    'null season': draft => { draft.seasons[0] = null; },
    'missing season label': draft => { delete draft.seasons[0].label; },
    'season order': draft => { draft.seasons.reverse(); },
    'zero denominator': draft => { draft.seasons[0].total = 0; },
    'fractional total': draft => { draft.seasons[0].total += 0.5; },
    'non-finite total': draft => { draft.seasons[0].total = NaN; },
    'broken zone sum': draft => { draft.seasons[0].zoneTotals[0]++; },
    'negative zone count': draft => { draft.seasons[0].zoneTotals[0] = -1; },
    'unlocated mismatch': draft => { draft.seasons[1].unlocated--; },
    'map count mismatch': draft => { draft.seasons[0].locatedHalfCourt--; },
    'missing cell': draft => { draft.seasons[0].bins.pop(); },
    'missing cell zone': draft => { draft.seasons[0].bins[0].pop(); },
    'fractional cell': draft => { draft.seasons[0].bins[0][0] = 0.5; },
    'non-finite cell': draft => { draft.seasons[0].bins[0][0] = Infinity; },
    'negative cell': draft => { draft.seasons[0].bins[0][0] = -1; },
    'cell zone overflow': draft => {
      const season = draft.seasons[0];
      const cell = season.bins.find(bin => bin[0] > 0);
      cell[0]--; cell[7]++;
    },
    'heave cell': draft => {
      const cell = draft.seasons[1].bins.find(bin => bin[0] > 0);
      cell[0]--; cell[6]++;
    },
    'sample count mismatch': draft => { draft.seasons[0].points.pop(); },
    'empty sample': draft => { draft.seasons[0].points = []; draft.seasons[0].sampleCount = 0; },
    'fractional sample count': draft => { draft.seasons[0].sampleCount = 1500.5; },
    'malformed point': draft => { draft.seasons[0].points[0] = null; },
    'non-finite point': draft => { draft.seasons[0].points[0][0] = NaN; },
    'infinite point': draft => { draft.seasons[0].points[0][1] = Infinity; },
    'out-of-court point': draft => { draft.seasons[0].points[0][0] = 25.01; },
    'invalid zone': draft => { draft.seasons[0].points[0][2] = 8; },
    'fractional zone': draft => { draft.seasons[0].points[0][2] = 1.5; },
    'heave at the rim': draft => { draft.seasons[1].points[0] = [0, 0, 6]; }
  };
  for (const [name, corrupt] of Object.entries(corruptions)) {
    const draft = clone(data);
    corrupt(draft);
    assert.doesNotThrow(() => validate(draft), name);
    assert.equal(validate(draft), false, name);
  }
});

// A deliberately small DOM implementation: it parses the actual page and executes the actual script.
// It records canvas operations so rendering is checked numerically, not by source-string matching.
const decode = value => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const datasetKey = key => key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
class Element {
  constructor(tag, attributes = {}) {
    this.tagName = tag.toUpperCase(); this.attributes = attributes; this.children = [];
    this.parentElement = null; this.listeners = {}; this.dataset = {}; this.textWrites = 0;
    for (const [key, value] of Object.entries(attributes)) if (key.startsWith('data-')) this.dataset[datasetKey(key)] = value;
  }
  get id() { return this.attributes.id || ''; }
  get hidden() { return Object.hasOwn(this.attributes, 'hidden'); }
  set hidden(value) { if (value) this.attributes.hidden = ''; else delete this.attributes.hidden; }
  get textContent() { return this.children.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
  set textContent(value) { this.children = [String(value)]; this.textWrites++; }
  getAttribute(key) { return Object.hasOwn(this.attributes, key) ? this.attributes[key] : null; }
  setAttribute(key, value) { this.attributes[key] = String(value); if (key.startsWith('data-')) this.dataset[datasetKey(key)] = String(value); }
  removeAttribute(key) { delete this.attributes[key]; }
  hasAttribute(key) { return Object.hasOwn(this.attributes, key); }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  dispatch(name, event = {}) { for (const callback of this.listeners[name] || []) callback(event); }
  click(event) { this.dispatch('click', event); }
  contains(node) { return this === node || this.children.some(child => typeof child !== 'string' && child.contains(node)); }
  matches(selector) {
    if (selector.includes(',')) return selector.split(',').some(part => this.matches(part.trim()));
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    const tag = selector.match(/^[\w-]+/);
    if (tag && this.tagName !== tag[0].toUpperCase()) return false;
    for (const [, key, value] of selector.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)) {
      if (!this.hasAttribute(key) || (value !== undefined && this.getAttribute(key) !== value)) return false;
    }
    return Boolean(tag || selector.startsWith('['));
  }
  querySelectorAll(selector) {
    const nodes = [];
    const visit = parent => {
      for (const child of parent.children) if (typeof child !== 'string') {
        if (child.matches(selector)) nodes.push(child);
        visit(child);
      }
    };
    visit(this); return nodes;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  remove() { this.parentElement.children = this.parentElement.children.filter(child => child !== this); }
}
function parsePage(markup) {
  const page = new Element('document'), stack = [page];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  for (const token of markup.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || []) {
    if (token.startsWith('<!--') || token.startsWith('<!')) continue;
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/([\w-]+)/)?.[1]?.toUpperCase();
      const index = stack.findLastIndex(node => node.tagName === tag);
      if (index > 0) stack.length = index;
    } else if (token.startsWith('<')) {
      const tag = token.match(/^<([\w-]+)/)?.[1];
      if (!tag) continue;
      const attributes = {};
      for (const [, key, quoted, single, bare] of token.slice(tag.length + 1, -1).matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attributes[key] = decode(quoted ?? single ?? bare ?? '');
      const node = new Element(tag, attributes), parent = stack.at(-1);
      node.parentElement = parent; parent.children.push(node);
      if (!voidTags.has(tag.toLowerCase()) && !token.endsWith('/>')) stack.push(node);
    } else stack.at(-1).children.push(decode(token));
  }
  return page;
}
function setup({ outcomes = [], mutate, noContext = false, hidden = false, width = 500, height = 500, ratio = 1 } = {}) {
  const page = parsePage(html), root = page.querySelector('#nba-pattern');
  assert.ok(root, 'The actual page contains the shot-pattern explorer');
  const canvas = root.querySelector('canvas'), requests = [], frameQueue = [], mediaListeners = {};
  const drawing = { circles: [], clears: 0, transforms: [] };
  const context = {
    globalAlpha: 1, fillStyle: '',
    beginPath() { this.arcValue = null; },
    arc(x, y, radius) { this.arcValue = { x, y, radius }; },
    fill() { if (this.arcValue) drawing.circles.push({ ...this.arcValue, alpha: this.globalAlpha, color: this.fillStyle }); },
    moveTo() {}, lineTo() {}, stroke() {}, closePath() {},
    setTransform(...args) { drawing.transforms.push(args); },
    clearRect() { drawing.circles = []; drawing.clears++; }
  };
  canvas.getContext = () => noContext ? null : context;
  canvas.getBoundingClientRect = () => ({ left: 40, top: 30, width, height });
  const media = { matches: false, addEventListener(name, callback) { (mediaListeners[name] ||= []).push(callback); } };
  const document = {
    hidden, getElementById: id => page.querySelector(`#${id}`), listeners: {},
    addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  };
  const window = { devicePixelRatio: ratio, matchMedia: () => media, listeners: {}, addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); } };
  const response = body => ({ ok: true, json: async () => body });
  const fetch = async url => {
    const outcome = outcomes[requests.length]; requests.push(url);
    if (outcome instanceof Error) throw outcome;
    if (outcome && typeof outcome.then === 'function') return outcome;
    if (outcome) return outcome;
    return response(clone(data));
  };
  if (mutate) mutate(root, page);
  const sandbox = vm.createContext({ document, window, fetch, requestAnimationFrame: callback => { frameQueue.push(callback); return frameQueue.length; } });
  const run = () => vm.runInContext(script, sandbox);
  run();
  return {
    root, page, canvas, drawing, context, requests, document, window, media, run, response,
    one: selector => root.querySelector(selector), all: selector => root.querySelectorAll(selector),
    settle: () => new Promise(resolve => setImmediate(resolve)),
    resize() { window.listeners.resize?.forEach(callback => callback()); while (frameQueue.length) frameQueue.shift()(); },
    forcedColors(value) { media.matches = value; mediaListeners.change?.forEach(callback => callback()); },
    visibility(value) { document.hidden = value; document.listeners.visibilitychange?.forEach(callback => callback()); }
  };
}
function pressed(app, selector, key) {
  return app.all(selector).filter(button => button.getAttribute('aria-pressed') === 'true').map(button => button.dataset[key]);
}
function select(app, selector, key, value) {
  const button = app.all(selector).find(node => node.dataset[key] === value);
  assert.ok(button, `Actual native control exists for ${value}`);
  assert.equal(button.tagName, 'BUTTON'); assert.equal(button.getAttribute('type'), 'button');
  button.click(); return button;
}
function expectedProjection(canvas, x, y) {
  const bounds = canvas.getBoundingClientRect(), padding = Math.max(20, bounds.width * 0.055);
  const scale = Math.min((bounds.width - 2 * padding) / 50, (bounds.height - 2 * padding) / 47);
  return { x: (bounds.width - 50 * scale) / 2 + (x + 25) * scale, y: (bounds.height - 47 * scale) / 2 + (41.75 - y) * scale, scale };
}
function assertComparison(app, zone) {
  const index = zoneIds.indexOf(zone), shares = app.all('[data-pattern-share]'), attempts = app.all('[data-pattern-attempts]');
  const values = expected.map(season => index < 0 ? { attempts: season.total, share: 100 } : { attempts: season.zones[index], share: season.zones[index] * 100 / season.total });
  assert.equal(shares.length, 2); assert.equal(attempts.length, 2);
  values.forEach((value, season) => {
    assert.equal(shares[season].textContent, `${value.share.toFixed(2)}%`);
    assert.equal(attempts[season].textContent, `${value.attempts.toLocaleString('en-US')} attempts`);
  });
  const delta = values[1].share - values[0].share;
  assert.ok(app.one('[data-pattern-change]').textContent.includes(Math.abs(delta).toFixed(2)));
  if (delta < -0.005) assert.match(app.one('[data-pattern-change]').textContent, /Down/);
  if (delta > 0.005) assert.match(app.one('[data-pattern-change]').textContent, /Up/);
}

test('actual markup keeps the static figure and complete table before successful loading', async () => {
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const app = setup({ outcomes: [pending] });
  assert.equal(app.one('[data-pattern-controls]').hidden, true);
  assert.equal(app.one('[data-pattern-zones]').hidden, true);
  assert.equal(app.one('[data-pattern-surface]').hidden, true);
  assert.equal(app.one('[data-pattern-fallback]').hidden, false);
  const image = app.one('[data-pattern-fallback]').querySelector('img');
  assert.ok(image && image.getAttribute('alt'));
  assert.ok(fs.existsSync(path.resolve(site, 'projects', image.getAttribute('src'))));
  const table = app.root.querySelector('table');
  assert.ok(table && !table.hidden && table.querySelector('caption'));
  for (const season of expected) assert.ok(app.root.textContent.includes(season.total.toLocaleString('en-US')), 'The full season denominator is available without JavaScript');
  const rows = table.querySelector('tbody').querySelectorAll('tr');
  assert.equal(rows.length, 8, 'Every source-labelled zone remains available without JavaScript');
  rows.forEach((row, zone) => {
    assert.equal(row.querySelector('th').textContent, data.zones[zone].label);
    assert.equal(row.querySelector('th').getAttribute('scope'), 'row');
    assert.deepEqual(row.querySelectorAll('td').map(cell => cell.textContent), expected.map(season => `${(season.zones[zone] * 100 / season.total).toFixed(2)}%`));
  });
  for (const button of [...app.all('[data-pattern-season]'), ...app.all('[data-pattern-view]')]) {
    assert.equal(button.tagName, 'BUTTON'); assert.equal(button.getAttribute('type'), 'button');
    const target = app.document.getElementById(button.getAttribute('aria-controls'));
    assert.ok(target && app.root.contains(target), 'Native view controls target a real map in the explorer');
  }
  assert.equal(app.one('[data-pattern-status]').getAttribute('role'), 'status');
  assert.equal(app.one('[data-pattern-status]').getAttribute('aria-live'), 'polite');
  assert.equal(app.requests.length, 1);
  assert.equal(path.resolve(site, 'projects', app.requests[0]), path.join(site, 'data/nba-shot-patterns.json'));
  assert.equal(app.drawing.clears, 0);
  app.one('[data-pattern-retry]').click();
  assert.equal(app.requests.length, 1, 'Repeated retry while loading cannot create concurrent fetches');
  resolve(app.response(clone(data))); await app.settle();
  assert.equal(app.root.dataset.ready, 'true');
  assert.equal(app.one('[data-pattern-fallback]').hidden, true);
  assert.equal(table.hidden, false, 'Text evidence remains available after enhancement');
});

test('native controls update both-season evidence, pressed state and live status exactly once', async () => {
  const app = setup(); await app.settle();
  assert.equal(app.root.dataset.ready, 'true');
  for (const selector of ['[data-pattern-controls]', '[data-pattern-zones]', '[data-pattern-surface]']) assert.equal(app.one(selector).hidden, false);
  assert.deepEqual(pressed(app, '[data-pattern-season]', 'patternSeason'), ['2025']);
  assert.deepEqual(pressed(app, '[data-pattern-view]', 'patternView'), ['sample']);
  assert.deepEqual(pressed(app, '[data-pattern-zone]', 'patternZone'), ['midrange']);
  assertComparison(app, 'midrange');
  for (const [selector, key, value] of [
    ['[data-pattern-zone]', 'patternZone', 'rim'],
    ['[data-pattern-season]', 'patternSeason', '2017'],
    ['[data-pattern-view]', 'patternView', 'pattern'],
    ['[data-pattern-zone]', 'patternZone', 'corner-3'],
    ['[data-pattern-season]', 'patternSeason', '2025'],
    ['[data-pattern-zone]', 'patternZone', 'all']
  ]) {
    const status = app.one('[data-pattern-status]'), writes = status.textWrites;
    const button = select(app, selector, key, value);
    assert.deepEqual(pressed(app, selector, key), [value]);
    const activeZone = pressed(app, '[data-pattern-zone]', 'patternZone')[0];
    assertComparison(app, activeZone);
    assert.equal(status.textWrites, writes + 1);
    assert.ok(status.textContent.includes(app.one('[data-pattern-zone-label]').textContent));
    assert.ok(status.textContent.includes(app.one('[data-pattern-change]').textContent));
    for (const share of app.all('[data-pattern-share]')) assert.ok(status.textContent.includes(share.textContent.replace('%', '')));
    assert.ok(app.one('[data-pattern-surface]').getAttribute('aria-label').includes(app.one('[data-pattern-zone-label]').textContent));
    button.click(); assert.equal(status.textWrites, writes + 1, 'Repeated selection is silent');
  }
  const buttonCount = add(app.all('button').map(button => (button.listeners.click || []).length));
  app.run(); await app.settle();
  assert.equal(app.requests.length, 1, 'Executing the script twice does not fetch again');
  assert.equal(add(app.all('button').map(button => (button.listeners.click || []).length)), buttonCount);
  assert.deepEqual(pressed(app, '[data-pattern-zone]', 'patternZone'), ['all']);
});

test('sample rendering preserves every location and uses an undistorted, shared court projection', async () => {
  const app = setup({ width: 340, height: 480, ratio: 3 }); await app.settle();
  select(app, '[data-pattern-zone]', 'patternZone', 'all');
  for (const year of ['2017', '2025']) {
    select(app, '[data-pattern-season]', 'patternSeason', year);
    const season = data.seasons.find(item => item.id === year);
    assert.equal(app.drawing.circles.length, 1500);
    season.points.forEach(([x, y], index) => {
      const projected = expectedProjection(app.canvas, x, y), actual = app.drawing.circles[index];
      close(actual.x, projected.x, `${year} sample x ${index}`);
      close(actual.y, projected.y, `${year} sample y ${index}`);
      close(actual.radius, Math.max(1, projected.scale * 0.13), 'Sample radius');
      assert.ok(actual.alpha > 0.5);
    });
  }
  assert.equal(app.canvas.width, 680); assert.equal(app.canvas.height, 960, 'Device-pixel ratio is capped at two');
  assert.deepEqual(app.drawing.transforms.at(-1), [2, 0, 0, 2, 0, 0]);
  const point = data.seasons[1].points.find(point => point[2] === 3), projected = expectedProjection(app.canvas, point[0], point[1]);
  app.canvas.click({ clientX: projected.x + 40, clientY: projected.y + 30 });
  assert.deepEqual(pressed(app, '[data-pattern-zone]', 'patternZone'), ['corner-3']);
  assertComparison(app, 'corner-3');
  const writes = app.one('[data-pattern-status]').textWrites;
  app.canvas.click({ clientX: -100, clientY: -100 });
  assert.equal(app.one('[data-pattern-status]').textWrites, writes, 'Empty court space does not invent a selection');
  const edges = clone(data);
  edges.seasons[1].points[0] = [25, 41.75, 4];
  edges.seasons[1].points[1] = [-25, -5.25, 3];
  const edgeApp = setup({ outcomes: [{ ok: true, json: async () => edges }] }); await edgeApp.settle();
  select(edgeApp, '[data-pattern-zone]', 'patternZone', 'all');
  for (const [index, [x, y]] of edges.seasons[1].points.slice(0, 2).entries()) {
    const projected = expectedProjection(edgeApp.canvas, x, y), actual = edgeApp.drawing.circles[index];
    close(actual.x, projected.x, 'Maximum/minimum edge x projection');
    close(actual.y, projected.y, 'Maximum/minimum edge y projection');
  }
});

test('complete-pattern circle area uses full-denominator cell shares on one scale across seasons', async () => {
  const app = setup(); await app.settle();
  select(app, '[data-pattern-zone]', 'patternZone', 'all');
  select(app, '[data-pattern-view]', 'patternView', 'pattern');
  const maxShare = Math.max(...data.seasons.flatMap(season => season.bins.map(cell => add(cell) / season.total)));
  for (const year of ['2017', '2025']) {
    select(app, '[data-pattern-season]', 'patternSeason', year);
    const season = data.seasons.find(item => item.id === year);
    const populated = season.bins.map((cell, index) => ({ count: add(cell), index })).filter(cell => cell.count > 0);
    assert.equal(app.drawing.circles.length, populated.length);
    populated.forEach((cell, index) => {
      const projected = expectedProjection(app.canvas, -24 + cell.index % 25 * 2, -5.25 + (Math.floor(cell.index / 25) + 0.5) * 47 / 24);
      const actual = app.drawing.circles[index];
      close(actual.x, projected.x, 'Cell center x'); close(actual.y, projected.y, 'Cell center y');
      close(actual.radius ** 2, (0.85 * projected.scale) ** 2 * cell.count / season.total / maxShare, 'Circle area reflects a full-denominator share');
    });
  }
  select(app, '[data-pattern-zone]', 'patternZone', 'midrange');
  for (const year of ['2017', '2025']) {
    select(app, '[data-pattern-season]', 'patternSeason', year);
    const season = data.seasons.find(item => item.id === year);
    const circlesByCenter = new Map();
    for (const circle of app.drawing.circles) {
      const key = `${circle.x}:${circle.y}`;
      if (!circlesByCenter.has(key)) circlesByCenter.set(key, []);
      circlesByCenter.get(key).push(circle);
    }
    let counted = 0;
    season.bins.forEach((cell, index) => {
      const total = add(cell);
      if (!total) return;
      const projected = expectedProjection(app.canvas, -24 + index % 25 * 2, -5.25 + (Math.floor(index / 25) + 0.5) * 47 / 24);
      const circles = circlesByCenter.get(`${projected.x}:${projected.y}`);
      assert.ok(circles);
      const background = circles.filter(circle => circle.alpha < 0.5), foreground = circles.filter(circle => circle.alpha > 0.5);
      assert.equal(background.length, 1);
      assert.equal(foreground.length, cell[2] > 0 ? 1 : 0);
      close(background[0].radius ** 2, (0.85 * projected.scale) ** 2 * total / season.total / maxShare, 'Background retains the complete pattern');
      if (cell[2]) close(foreground[0].radius ** 2, (0.85 * projected.scale) ** 2 * cell[2] / season.total / maxShare, 'Selected-zone area uses the same full-denominator scale');
      counted += circles.length;
    });
    assert.equal(counted, app.drawing.circles.length);
  }
  const writes = app.one('[data-pattern-status]').textWrites;
  app.canvas.click({ clientX: 250, clientY: 250 });
  assert.equal(app.one('[data-pattern-status]').textWrites, writes, 'Aggregated cells are not treated as individual shots');
});

test('failed loading preserves static evidence and retry successfully enhances once', async () => {
  for (const failure of [new Error('offline'), { ok: false }, { ok: true, json: async () => { throw new Error('bad JSON'); } }, { ok: true, json: async () => ({ schemaVersion: 1 }) }]) {
    const app = setup({ outcomes: [failure] }); await app.settle();
    assert.notEqual(app.root.dataset.ready, 'true');
    assert.equal(app.one('[data-pattern-fallback]').hidden, false);
    assert.equal(app.one('[data-pattern-controls]').hidden, true);
    assert.equal(app.one('[data-pattern-zones]').hidden, true);
    assert.equal(app.one('[data-pattern-surface]').hidden, true);
    assert.equal(app.one('[data-pattern-failure]').hidden, false);
    assert.equal(app.one('[data-pattern-retry]').hidden, false);
    assert.equal(app.drawing.clears, 0);
    assert.ok(app.all('[data-pattern-season]').every(button => !button.listeners.click));
    app.one('[data-pattern-retry]').click(); await app.settle();
    assert.equal(app.requests.length, 2);
    assert.equal(app.root.dataset.ready, 'true');
    assert.equal(app.one('[data-pattern-failure]').hidden, true);
    assert.equal(app.one('[data-pattern-retry]').hidden, true);
    assertComparison(app, 'midrange');
  }
});

test('incomplete semantic markup or absent canvas support never removes the static evidence', async () => {
  const required = ['canvas', '[data-pattern-controls]', '[data-pattern-zones]', '[data-pattern-surface]', '[data-pattern-fallback]', '[data-pattern-failure]', '[data-pattern-retry]', '[data-pattern-map-label]', '[data-pattern-map-help]', '[data-pattern-zone-label]', '[data-pattern-share]', '[data-pattern-attempts]', '[data-pattern-change]', '[data-pattern-status]'];
  const mutations = required.map(selector => root => root.querySelector(selector).remove());
  mutations.push(
    root => root.querySelector('[data-pattern-season]').remove(),
    root => root.querySelector('[data-pattern-view]').remove(),
    root => root.querySelector('[data-pattern-zone]').remove(),
    root => { root.querySelectorAll('[data-pattern-season]')[1].dataset.patternSeason = '2017'; },
    root => { root.querySelectorAll('[data-pattern-view]')[1].dataset.patternView = 'sample'; },
    root => { root.querySelectorAll('[data-pattern-zone]')[1].dataset.patternZone = 'all'; },
    root => { root.querySelector('[data-pattern-zone]').dataset.patternZone = 'invented-zone'; }
  );
  for (const mutate of mutations) {
    const app = setup({ mutate }); await app.settle();
    assert.notEqual(app.root.dataset.ready, 'true');
    assert.equal(app.requests.length, 0, 'Markup is checked before loading data');
    if (app.one('[data-pattern-fallback]')) assert.equal(app.one('[data-pattern-fallback]').hidden, false);
    if (app.one('[data-pattern-controls]')) assert.equal(app.one('[data-pattern-controls]').hidden, true);
    if (app.one('[data-pattern-zones]')) assert.equal(app.one('[data-pattern-zones]').hidden, true);
    assert.equal(app.drawing.clears, 0);
    assert.ok(app.all('button').every(button => !button.listeners.click));
  }
  const app = setup({ noContext: true }); await app.settle();
  assert.equal(app.requests.length, 0); assert.equal(app.one('[data-pattern-fallback]').hidden, false);
});

test('hidden pages defer drawing and visibility, resize and forced colors repaint without reloading', async () => {
  const app = setup({ hidden: true }); await app.settle();
  assert.equal(app.root.dataset.ready, 'true'); assert.equal(app.drawing.clears, 0);
  app.visibility(false); assert.equal(app.drawing.clears, 1);
  app.resize(); assert.equal(app.drawing.clears, 2);
  app.forcedColors(true); assert.equal(app.drawing.clears, 3);
  assert.ok(app.drawing.circles.every(circle => circle.color === 'CanvasText'));
  app.visibility(true); app.resize(); assert.equal(app.drawing.clears, 3);
  app.visibility(false); assert.equal(app.drawing.clears, 4);
  assert.equal(app.requests.length, 1);
});
