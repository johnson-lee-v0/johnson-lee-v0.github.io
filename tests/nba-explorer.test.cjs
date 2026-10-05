/* Run with node tests/nba-explorer.test.cjs. Exercises the actual script and page markup. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/nba-explorer.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../projects/NBA_Games_Outcome.html'), 'utf8');
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const buttonTags = [...html.matchAll(/<button\b[^>]*data-nba-view[^>]*>/g)].map(match => match[0]);
const panelTags = [...html.matchAll(/<figure\b[^>]*data-nba-panel[^>]*>/g)].map(match => match[0]);
const explorerTag = html.match(/<section\b[^>]*id="nba-explorer"[^>]*>/)[0];
const originalTag = html.match(/<figure\b[^>]*id="nba-original-figure"[^>]*>/)[0];

function setup({ missing = '', buttonCount = 2, panelCount = 2 } = {}) {
  const make = tag => ({
    attributes: attributes(tag), hidden: /\shidden(?:\s|>)/.test(tag), listeners: {},
    addEventListener(name, callback) { this.listeners[name] = callback; },
    setAttribute(name, value) { this.attributes[name] = value; }
  });
  const buttons = buttonTags.slice(0, buttonCount).map(tag => {
    const button = make(tag); button.dataset = { nbaView: button.attributes['data-nba-view'] }; return button;
  });
  const panels = panelTags.slice(0, panelCount).map(tag => {
    const panel = make(tag); panel.dataset = { nbaPanel: panel.attributes['data-nba-panel'] }; return panel;
  });
  const original = make(originalTag), explorer = make(explorerTag), status = { textContent: '' };
  explorer.querySelectorAll = selector => selector === '[data-nba-view]' ? buttons : panels;
  const document = { getElementById: id => id === missing ? null : ({ 'nba-explorer': explorer, 'nba-original-figure': original, 'nba-view-status': status }[id]) };
  vm.runInNewContext(source, { document });
  return { buttons, panels, original, explorer, status };
}

assert.equal(buttonTags.length, 2);
assert.equal(panelTags.length, 2);
assert.match(explorerTag, /\shidden(?:\s|>)/, 'Interactive view starts hidden without JS');
assert.doesNotMatch(originalTag, /\shidden(?:\s|>)/, 'Original figure remains available without JS');
assert.match(html, /id="nba-view-status"[^>]*role="status"[^>]*aria-live="polite"/);
assert.match(html, /class="nba-chart-surface nba-chart-scroll" tabindex="0" role="region"/);
const app = setup();
assert.equal(app.explorer.hidden, false);
assert.equal(app.original.hidden, true);
assert.equal(app.panels.find(panel => !panel.hidden).dataset.nbaPanel, 'change');
assert.equal(app.buttons.find(button => button.attributes['aria-pressed'] === 'true').dataset.nbaView, 'change');

for (const selected of ['seasons', 'change', 'seasons', 'seasons', 'change']) {
  const button = app.buttons.find(control => control.dataset.nbaView === selected);
  assert.equal(button.attributes.type, 'button', 'Native buttons preserve keyboard activation');
  assert.equal(app.panels.some(panel => panel.attributes.id === button.attributes['aria-controls']), true);
  button.listeners.click();
  assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.dataset.nbaPanel), [selected]);
  assert.deepEqual(app.buttons.filter(control => control.attributes['aria-pressed'] === 'true').map(control => control.dataset.nbaView), [selected]);
  assert.equal(app.status.textContent, selected === 'change' ? 'Showing the change in shot-attempt share.' : 'Showing both seasons on a shared scale.');
}

for (const options of [{ missing: 'nba-explorer' }, { missing: 'nba-original-figure' }, { buttonCount: 1 }, { panelCount: 1 }]) {
  const incomplete = setup(options);
  assert.equal(incomplete.original.hidden, false, 'Incomplete enhancement preserves original figure');
  assert.equal(incomplete.explorer.hidden, true);
  assert.equal(incomplete.buttons.some(button => button.listeners.click), false);
}
const noStatus = setup({ missing: 'nba-view-status' });
assert.doesNotThrow(() => noStatus.buttons[0].listeners.click());
assert.equal(noStatus.panels.filter(panel => !panel.hidden).length, 1);
console.log('PASS NBA actual-markup defaults, view selection, status, repeated activation, and progressive-enhancement guards');
