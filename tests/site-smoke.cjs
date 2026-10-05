/* Run with node tests/site-smoke.cjs. No installed dependencies required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const home = read('index.html');
assert.match(home, /<title>Johnson Lee<\/title>/);
assert.equal((home.match(/aria-labelledby="project-\d-name project-\d-title"/g) || []).length, 5, 'Five projects must exist without JavaScript');
assert.match(home, /Meta, Q2 FY2026/);
assert.doesNotMatch(home, /Cedar Workshop/);
assert.match(home, /Boston-Celtics-Player-Analysis/);
assert.match(home, /Product Solutions at StackAdapt\. Ex-RBC/);
assert.match(home, /BAFM graduate from University of Waterloo/);
for (const file of ['index.html', ...fs.readdirSync(path.join(root, 'projects')).filter(f => f.endsWith('.html')).map(f => 'projects/' + f)]) {
  const source = read(file);
  const ids = [...source.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, file + ': duplicate IDs');
  for (const match of source.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const url = match[1];
    if (/^(https?:|data:|mailto:|tel:)/.test(url)) continue;
    // Separate GitHub Pages application; mounted by tools/preview.py locally.
    const clean = decodeURIComponent(url.split(/[?#]/)[0]);
    if (clean === '/Equity-Research/') continue;
    if (!clean) continue;
    assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), clean)), file + ': missing ' + url);
  }
}
const { calculateScenario, source } = require('../js/research-explorer.js');
assert.equal(source.revenue, 60801);
assert.equal(source.operatingProfit, 18775);
assert.equal(source.periodEnd, '2026-06-30');
assert.equal(source.released, '2026-07-29');
for (let growth = -10; growth <= 30; growth++) {
  const result = calculateScenario(growth);
  assert.ok(Math.abs(result.profit - 18775 * (1 + growth / 100)) < 1e-8);
  assert.equal(result.margin, 18775 / 60801, 'Do not round the reported margin before calculating');
}
assert.equal(calculateScenario(8).profit.toFixed(2), '20277.00');
assert.equal(calculateScenario(8).revenue.toFixed(2), '65665.08');
const research = read('projects/Equity_Research.html');
assert.match(research, /60,801 × 1\.08 × \(18,775 ÷ 60,801\) = 20,277\.00/);
assert.match(research, /<td>47,516<\/td><td>60,801<\/td>/);
assert.match(research, /<td>20,441<\/td><td>18,775<\/td>/);
assert.match(research, /Meta-Reports-Second-Quarter-2026-Results/);
assert.equal((research.match(/href="\/Equity-Research\/#research"/g) || []).length, 2, 'Primary and closing links enter the complete research workflow');
assert.equal((research.match(/href="\/Equity-Research\/#earnings-call"/g) || []).length, 1, 'The call analysis retains a direct link as one part of the workflow');
assert.equal((research.match(/href="\/Equity-Research\/#valuation"/g) || []).length, 2, 'Valuation links enter the multiple-based step directly');
assert.doesNotMatch(research, /public link may still show an earlier version/);
assert.doesNotMatch(research, /Separate fictional public demo|Q2 2024|22,076\.28|localhost|127\.0\.0\.1/);
for (const input of [NaN, Infinity, -11, 31]) assert.throws(() => calculateScenario(input), RangeError);

function researchHarness() {
  const elements = {};
  let focused;
  for (const selector of ['#research-growth', '[data-research-controls]', '[data-research-reset]', '[data-research-access]', '[data-research-open]', '[data-research-dialog]', '[data-research-acknowledgment]', '#research-notice-checkbox', '[data-research-accept]', '[data-research-cancel]', '[data-research-dismiss]', '#research-notice-title', '#research-access-status', '#research-growth-value', '#research-growth-math', '#research-revenue', '#research-profit', '#research-change', '#research-formula']) {
    elements[selector] = {
      value: '8', hidden: true, disabled: true, checked: false, listeners: {}, attributes: {}, textContent: '',
      addEventListener(name, fn) { this.listeners[name] = fn; },
      setAttribute(name, value) { this.attributes[name] = value; },
      focus() { focused = selector; },
    };
  }
  const dialog = elements['[data-research-dialog]'];
  dialog.showModal = function () { this.open = true; };
  dialog.close = function () { this.open = false; this.listeners.close(); };
  vm.runInNewContext(read('js/research-explorer.js'), {
    document: { querySelector: () => ({ querySelector: selector => elements[selector] }) },
  });
  return { elements, focused: () => focused };
}

const gate = researchHarness();
const fields = gate.elements;
const slider = fields['#research-growth'];
const dialog = fields['[data-research-dialog]'];
const checkbox = fields['#research-notice-checkbox'];
assert.equal(slider.disabled, true);
assert.equal(fields['[data-research-controls]'].hidden, true);
assert.equal(fields['#research-profit'].textContent, '20,277.00');
fields['[data-research-open]'].listeners.click();
assert.equal(dialog.open, true);
assert.equal(gate.focused(), '#research-notice-title');
assert.equal(fields['[data-research-accept]'].disabled, true);
fields['[data-research-acknowledgment]'].listeners.submit({ preventDefault() {} });
assert.equal(slider.disabled, true, 'Unchecked submission cannot unlock the explorer');
fields['[data-research-cancel]'].listeners.click();
assert.equal(slider.disabled, true);
assert.equal(gate.focused(), '[data-research-open]');
for (const checked of [false, true]) {
  fields['[data-research-open]'].listeners.click();
  checkbox.checked = checked;
  checkbox.listeners.change();
  fields['[data-research-dismiss]'].listeners.click();
  assert.equal(dialog.open, false, 'Top close dismisses the dialog');
  assert.equal(slider.disabled, true, 'Top close never acknowledges, even when checked');
  assert.equal(checkbox.checked, false, 'Dismissal clears the checkbox');
  assert.equal(gate.focused(), '[data-research-open]');
}
fields['[data-research-open]'].listeners.click();
checkbox.checked = true;
checkbox.listeners.change();
dialog.close();
assert.equal(checkbox.checked, false, 'Native close/Escape leaves the gate unacknowledged');
assert.equal(slider.disabled, true);
fields['[data-research-open]'].listeners.click();
checkbox.checked = true;
checkbox.listeners.change();
fields['[data-research-acknowledgment]'].listeners.submit({ preventDefault() {} });
assert.equal(slider.disabled, false);
assert.equal(fields['[data-research-controls]'].hidden, false);
assert.equal(gate.focused(), '#research-growth');
slider.value = '30';
slider.listeners.input();
assert.equal(fields['#research-profit'].textContent, '24,407.50');
fields['[data-research-reset]'].listeners.click();
assert.equal(slider.value, '8');
assert.equal(fields['#research-profit'].textContent, '20,277.00');
assert.equal(researchHarness().elements['#research-growth'].disabled, true, 'A fresh page requires acknowledgment');
assert.doesNotMatch(read('js/research-explorer.js'), /localStorage|sessionStorage|fetch\(|sendBeacon/);
console.log('PASS: static projects, preserved content, local links, unique IDs, 41 exact-margin research scenarios, and acknowledgment gate.');
