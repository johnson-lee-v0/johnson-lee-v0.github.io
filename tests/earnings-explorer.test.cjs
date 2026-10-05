/* Run with node --test tests/earnings-explorer.test.cjs. Tests the actual page and script. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('projects/Equity_Research.html');
const script = read('js/earnings-explorer.js');
const css = read('css/earnings-explorer.css');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const buttonTags = [...html.matchAll(/<button\b[^>]*data-earnings-theme[^>]*>/g)].map(match => match[0]);
const panelTags = [...html.matchAll(/<article\b[^>]*data-earnings-panel[^>]*>/g)].map(match => match[0]);
const panelMarkup = [...html.matchAll(/<article\b[^>]*data-earnings-panel[^>]*>[\s\S]*?<\/article>/g)].map(match => match[0]);
const explorerTag = html.match(/<section\b[^>]*data-earnings-explorer[^>]*>/)[0];
const controlsTag = html.match(/<div\b[^>]*data-earnings-controls[^>]*>/)[0];
const transcript = 'https://s21.q4cdn.com/399680738/files/doc_financials/2026/q2/META-Q2-2026-Earnings-Call-Transcript.pdf';
const expected = [
  { key: 'ai-payoff', title: 'Which AI business pays first?', question: 10, answer: 10, analyst: 'Brian Nowak · Morgan Stanley', management: 'Mark Zuckerberg · CEO' },
  { key: 'capex-uncertainty', title: 'What about 2027 spending?', question: 10, answer: 10, analyst: 'Brian Nowak · Morgan Stanley', management: 'Susan Li · CFO' },
  { key: 'consumer-agents', title: 'Are consumers ready?', question: 12, answer: 13, analyst: 'Mark Shmulik · Bernstein', management: 'Mark Zuckerberg · CEO' },
  { key: 'recommendations', title: 'What improves recommendations?', question: 14, answer: 14, analyst: 'Douglas Anmuth · JPMorgan', management: 'Susan Li · CFO' },
  { key: 'payback-delay', title: 'Why buy and sell computing?', question: 14, answer: 15, analyst: 'Douglas Anmuth · JPMorgan', management: 'Mark Zuckerberg · CEO' }
];

test('AI engineering is the project identity; earnings analysis is one inspectable stage', () => {
  const home = read('index.html');
  const lead = home.match(/<article class="project-card project-card-featured"[\s\S]*?<\/article>/)[0];
  assert.match(lead, /Can AI agents take research from question to decision\?/);
  assert.match(lead, /A multi-agent AI research system/);
  assert.match(lead, /Explore the agent workflow/);
  assert.doesNotMatch(lead, /NLP workspace|Explore earnings-call analysis/);
  const workflow = html.match(/<section class="agent-workflow"[\s\S]*?<\/section>/)[0];
  assert.match(workflow, /End-to-end AI engineering/);
  const roles = [...workflow.matchAll(/class="agent-workflow-role">([^<]+)</g)].map(match => match[1]);
  assert.deepEqual(roles, ['01 · Chief of Staff', '02 · Source discovery', '03 · Fundamental researcher', '04 · Application code', '05 · CIO reviewer', '06 · Shared research memory']);
  assert.match(workflow, /does not run agents or claim that its editorial example is a recorded agent execution/);
  assert.ok(html.indexOf('class="agent-workflow"') < html.indexOf('data-earnings-explorer'));
  for (const file of ['Equity-Research-preview.svg', 'Equity-Research-mobile.svg']) {
    const cover = read(`image/Project_Cover/${file}`);
    assert.match(cover, /AI ENGINEERING \/ MULTI-AGENT RESEARCH/);
    assert.match(cover, /Static walkthrough · agents run locally/);
    for (const label of ['Question', 'Evidence', 'Analysis', 'Valuation', 'Decision', 'Memory']) assert.ok(cover.includes(`>${label}</text>`));
  }
});

function setup(options = {}) {
  const make = tag => {
    const attributes = attrs(tag);
    return {
      attributes, id: attributes.id, hidden: /\shidden(?:\s|>)/.test(tag), dataset: {}, listeners: {}, focusCalls: 0,
      getAttribute(name) { return this.attributes[name] ?? null; },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); },
      click() { for (const callback of this.listeners.click || []) callback(); },
      focus() { this.focusCalls++; }
    };
  };
  const buttons = buttonTags.slice(0, options.buttonCount ?? expected.length).map(tag => {
    const button = make(tag); button.dataset.earningsTheme = button.attributes['data-earnings-theme']; return button;
  });
  const panels = panelTags.slice(0, options.panelCount ?? expected.length).map(tag => {
    const panel = make(tag); panel.dataset.earningsPanel = panel.attributes['data-earnings-panel']; return panel;
  });
  if (options.duplicateTheme) buttons[1].dataset.earningsTheme = buttons[0].dataset.earningsTheme;
  if (options.duplicatePanel) panels[1].dataset.earningsPanel = panels[0].dataset.earningsPanel;
  if (options.missingKey) buttons[1].dataset.earningsTheme = '';
  if (options.unknownPanel) panels[1].dataset.earningsPanel = 'unmapped';
  if (options.badTarget) buttons[1].attributes['aria-controls'] = 'missing';
  if (options.missingPanelId) panels[1].id = '';
  const explorer = make(explorerTag);
  const controls = make(controlsTag);
  explorer.querySelector = selector => selector === '[data-earnings-controls]' && !options.missingControls ? controls : null;
  explorer.querySelectorAll = selector => selector === '[data-earnings-theme]' ? buttons : selector === '[data-earnings-panel]' ? panels : [];
  const module = { exports: {} };
  const document = { querySelectorAll: selector => selector === '[data-earnings-explorer]' && !options.missingRoot ? [explorer] : [] };
  const run = () => vm.runInNewContext(script, { module, document });
  const load = () => vm.runInNewContext(script, { module });
  load();
  return { buttons, panels, explorer, controls, run, initialize: module.exports.initialize };
}

test('earnings themes, source locators and follow-ups remain readable without JavaScript', () => {
  assert.equal(buttonTags.length, expected.length);
  assert.equal(panelTags.length, expected.length);
  assert.equal(panelMarkup.length, expected.length);
  assert.match(controlsTag, /\shidden(?:\s|>)/);
  assert.match(controlsTag, /role="group" aria-label="Choose an earnings-call theme"/);
  assert.doesNotMatch(explorerTag, /\shidden(?:\s|>)|aria-hidden/);
  assert.deepEqual(buttonTags.map(tag => attrs(tag)['data-earnings-theme']), expected.map(item => item.key));
  for (const item of expected) {
    const panel = panelMarkup.find(markup => attrs(markup.split('>')[0])['data-earnings-panel'] === item.key);
    const tag = panelTags.find(tag => attrs(tag)['data-earnings-panel'] === item.key);
    const button = buttonTags.find(tag => attrs(tag)['data-earnings-theme'] === item.key);
    assert.doesNotMatch(tag, /\shidden(?:\s|>)|aria-hidden/);
    assert.equal(attrs(button).type, 'button', 'Native buttons retain Enter and Space activation');
    assert.equal(attrs(button)['aria-controls'], attrs(tag).id);
    assert.ok(panel.includes(item.title));
    assert.ok(panel.includes(item.analyst));
    assert.ok(panel.includes(item.management));
    assert.match(panel, /01 · Analyst question/);
    assert.match(panel, /02 · Management response/);
    assert.match(panel, /03 · Research follow-up/);
    const links = [...panel.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(links, [`${transcript}#page=${item.question}`, `${transcript}#page=${item.answer}`]);
  }
  assert.match(html, /source-linked editorial paraphrases—not a live NLP run or a sentiment score/);
  assert.match(html, /An open research question, not company guidance/);
  assert.match(html, /July call predates the September product announcement/);
  assert.match(html, /Response begins · transcript p\. 15/);
});

test('call analysis precedes multiple valuation and the closed optional growth illustration', () => {
  const call = html.indexOf('data-earnings-explorer');
  const valuation = html.indexOf('class="earnings-valuation"');
  const optional = html.indexOf('class="research-optional"');
  assert.ok(call >= 0 && call < valuation && valuation < optional);
  assert.ok(html.indexOf('class="agent-workflow"') < call, 'The end-to-end engineering workflow introduces the project');
  assert.match(html, /href="\/Equity-Research\/#research"[^>]*>Explore the agent workflow/);
  assert.match(html, /href="\/Equity-Research\/#earnings-call"[^>]*>Inspect the earnings-call analysis/);
  assert.match(html, /href="\/Equity-Research\/#valuation"/);
  assert.match(html, /company’s own historical ratios—not a verified peer-company comparison/);
  assert.match(html, /<details class="research-optional">\s*<summary>Optional: see how one growth assumption/);
  assert.doesNotMatch(html.match(/<details class="research-optional"[^>]*>/)[0], /\bopen\b/);
  assert.match(html, /<script src="\.\.\/js\/earnings-explorer\.js[^\"]*" defer>/);
});

test('actual handlers select one theme, preserve native focus and initialize only once', () => {
  const app = setup();
  assert.equal(app.initialize(app.explorer), true);
  assert.equal(app.controls.hidden, false);
  assert.equal(app.explorer.dataset.earningsReady, 'true');
  assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.dataset.earningsPanel), ['ai-payoff']);
  for (const selected of ['consumer-agents', 'capex-uncertainty', 'payback-delay', 'recommendations', 'ai-payoff', 'ai-payoff']) {
    const button = app.buttons.find(button => button.dataset.earningsTheme === selected);
    button.click();
    assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.dataset.earningsPanel), [selected]);
    assert.deepEqual(app.buttons.filter(button => button.attributes['aria-pressed'] === 'true').map(button => button.dataset.earningsTheme), [selected]);
  }
  app.buttons[4].click();
  assert.equal(app.initialize(app.explorer), false);
  app.run();
  assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.dataset.earningsPanel), ['payback-delay']);
  for (const element of [...app.buttons, ...app.panels]) assert.equal(element.focusCalls, 0, 'Theme changes do not steal focus');
  for (const button of app.buttons) assert.equal(button.listeners.click.length, 1, 'Repeated initialization attaches no duplicate handlers');
  app.buttons[1].click();
  assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.dataset.earningsPanel), ['capex-uncertainty']);
});

test('incomplete or invalid relationships preserve every static result and add no handlers', () => {
  assert.equal(setup().initialize(null), false);
  for (const options of [
    { missingControls: true }, { buttonCount: 0, panelCount: 0 }, { buttonCount: 4 }, { panelCount: 4 },
    { duplicateTheme: true }, { duplicatePanel: true }, { missingKey: true }, { unknownPanel: true },
    { badTarget: true }, { missingPanelId: true }
  ]) {
    const app = setup(options);
    const before = app.buttons.map(button => button.attributes['aria-pressed']);
    assert.equal(app.initialize(app.explorer), false, JSON.stringify(options));
    assert.equal(app.controls.hidden, true);
    assert.ok(app.panels.every(panel => !panel.hidden));
    assert.ok(app.buttons.every(button => !button.listeners.click));
    assert.deepEqual(app.buttons.map(button => button.attributes['aria-pressed']), before, 'Invalid mapping makes no partial control mutation');
    assert.equal(app.explorer.dataset.earningsReady, undefined);
  }
});

test('failed initialization can recover after markup is repaired, including automatic entry', () => {
  const app = setup({ badTarget: true });
  assert.equal(app.initialize(app.explorer), false);
  app.buttons[1].attributes['aria-controls'] = app.panels[1].id;
  assert.equal(app.initialize(app.explorer), true);
  app.buttons[2].click();
  assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.dataset.earningsPanel), ['consumer-agents']);
  const automatic = setup();
  automatic.run();
  assert.equal(automatic.controls.hidden, false);
  assert.equal(automatic.explorer.dataset.earningsReady, 'true');
  const missing = setup({ missingRoot: true });
  assert.doesNotThrow(missing.run);
  assert.equal(missing.controls.hidden, true);
});

test('lightweight controls have visible focus, mobile stacking and no network or motion dependency', () => {
  assert.match(css, /\.earnings-controls button \{[^}]*min-height: 44px/);
  assert.match(css, /button:focus-visible[^}]*outline: 3px/);
  assert.match(css, /\.earnings-controls\[hidden\], \.earnings-panel\[hidden\] \{ display: none/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.earnings-chain, \.earnings-valuation \{ grid-template-columns: 1fr/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(css, /(?:^|[;{\n])\s*(?:animation|transition|transform)\s*:/m);
  assert.doesNotMatch(script, /fetch\(|XMLHttpRequest|setInterval|setTimeout|requestAnimationFrame|innerHTML/);
});
