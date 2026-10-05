/* Run with node --test tests/project-introductions.test.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const script = read('js/script.js');

function projectHarness(existing = []) {
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; }
    setAttribute(name, value) { this.attributes[name] = value; }
    append(...children) { this.children.push(...children); }
    replaceChildren(fragment) { this.children = [...fragment.children]; }
  }
  const grid = new Element('div');
  grid.children = existing;
  const context = {
    document: {
      getElementById: id => id === 'projects-grid' ? grid : null,
      createElement: tag => new Element(tag),
      createDocumentFragment: () => new Element('fragment'),
    },
  };
  vm.runInNewContext([
    script.slice(script.indexOf('const PROJECTS ='), script.indexOf('const SNEAKER_IMAGES =')),
    script.slice(script.indexOf('function createElement('), script.indexOf('function initializeHeroScrollWorld(')),
    script.slice(script.indexOf('function renderProjects('), script.indexOf('function initializeSectionNavigation(')),
    'this.projects = PROJECTS; this.render = renderProjects;',
  ].join('\n'), context);
  return { grid, context };
}

test('static introductions keep real names, concise copy, and specific project actions', () => {
  const home = read('index.html');
  const cards = [...home.matchAll(/<article class="project-card[^\"]*"[\s\S]*?<\/article>/g)].map(match => match[0]);
  const { context } = projectHarness();
  const expected = ['Equity Research', 'NBA game outcomes', 'Max temperature modeling', 'University Twitter analysis', 'Blackjack simulator'];
  assert.equal(cards.length, expected.length);
  context.projects.forEach((project, index) => {
    const card = cards[index];
    assert.equal(project.title, expected[index]);
    assert.ok(card.includes(`aria-labelledby="project-${index}-name project-${index}-title"`));
    assert.ok(card.includes(`<p class="project-name" id="project-${index}-name">${project.title}</p>`));
    assert.ok(card.includes(`<h3 id="project-${index}-title">${project.question}</h3>`));
    assert.ok(card.includes(`<p class="project-description">${project.description}</p>`));
    assert.ok(card.includes(`href="${project.link}">${project.action} <span aria-hidden="true">`));
    assert.match(project.question, /\?$/);
    assert.notEqual(project.action, 'View project');
    assert.ok(project.description.split(/\s+/).length <= 27);
    assert.doesNotMatch(project.description, /\d+(?:\.\d+)?%|\b(?:MAE|RMSE|accuracy)\b|°F/);
  });
  assert.match(cards[1], /Boston-Celtics-Player-Analysis/);
});

test('legacy empty-grid renderer preserves the same names, questions and actions', () => {
  const { context, grid } = projectHarness();
  context.render();
  assert.equal(grid.children.length, 5);
  context.projects.forEach((project, index) => {
    const article = grid.children[index];
    const body = article.children[1];
    assert.equal(article.attributes['aria-labelledby'], `project-${index}-name project-${index}-title`);
    assert.equal(body.children[0].textContent, project.title);
    assert.equal(body.children[0].attributes.id, `project-${index}-name`);
    assert.equal(body.children[1].tag, 'h3');
    assert.equal(body.children[1].textContent, project.question);
    assert.equal(body.children[1].attributes.id, `project-${index}-title`);
    const action = body.children.at(-1).children[0];
    assert.equal(action.attributes.href, project.link);
    assert.equal(action.children[0].textContent, `${project.action} `);
  });
  const populated = projectHarness([{ tag: 'existing-static-content' }]);
  const original = populated.grid.children;
  populated.context.render();
  assert.equal(populated.grid.children, original, 'Never replace server/static content');
});

test('homepage questions and the next-project journey describe the same investigations', () => {
  const previousPages = ['Blackjack', 'Equity_Research', 'NBA_Games_Outcome', 'Max_Temperature', 'University_Twitter'];
  const { context } = projectHarness();
  context.projects.forEach((project, index) => {
    const previous = read(`projects/${previousPages[index]}.html`);
    assert.ok(previous.includes(`<h2 id="next-project-question">${project.question}</h2>`));
  });
});
