/* Run with node --test tests/project-continuation.test.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const continuations = [
  ['Equity_Research.html', 'NBA_Games_Outcome.html', 'NBA game outcomes', 'NBA-shot-locations.png'],
  ['NBA_Games_Outcome.html', 'Max_Temperature.html', 'Max temperature modeling', 'Max-temperature-landscape.png'],
  ['Max_Temperature.html', 'University_Twitter.html', 'University Twitter analysis', 'Slide3.JPG'],
  ['University_Twitter.html', 'Blackjack.html', 'Blackjack simulator', 'Blackjack-1.png'],
  ['Blackjack.html', 'Equity_Research.html', 'Equity Research', 'Equity-Research-preview.svg'],
];

test('each continuation follows the actual homepage project sequence', () => {
  const home = read('index.html');
  const titles = [...home.matchAll(/<p class="project-name" id="project-\d-name">([^<]+)<\/p>/g)].map(match => match[1]);
  assert.deepEqual(titles, ['Equity Research', 'NBA game outcomes', 'Max temperature modeling', 'University Twitter analysis', 'Blackjack simulator']);
  for (const [page, next, title] of continuations) {
    const html = read(`projects/${page}`);
    const matches = [...html.matchAll(/<nav class="project-continuation"[\s\S]*?<\/nav>/g)];
    assert.equal(matches.length, 1, `${page}: exactly one continuation`);
    const nav = matches[0][0];
    assert.ok(nav.includes(`href="./${next}"`), `${page}: links to the next project`);
    assert.ok(nav.includes(`<span id="next-project-name">${title}</span>`));
    assert.equal((nav.match(/<a\s/g) || []).length, 1, 'One coherent target with no nested links');
    assert.match(nav, /aria-labelledby="next-project-question next-project-name"/);
    assert.match(nav, /<h2 id="next-project-question">[^<]+\?<\/h2>/);
    assert.doesNotMatch(nav, /target=|onclick=|<script|<button|tabindex="-1"/);
    assert.ok(html.indexOf(nav) < html.indexOf('<div class="case-source-row">'));
    assert.match(html, /href="\.\.\/index\.html#projects"/);
    assert.match(html, /class="case-button" href="https:\/\/github\.com\//);
  }
});

test('existing artifacts load lazily, reserve space, and retain a meaningful alternative', () => {
  for (const [page, , , imageName] of continuations) {
    const html = read(`projects/${page}`);
    const nav = html.match(/<nav class="project-continuation"[\s\S]*?<\/nav>/)[0];
    const image = nav.match(/<img\b[^>]*>/)[0];
    assert.match(image, /loading="lazy"/);
    assert.match(image, /decoding="async"/);
    assert.match(image, /width="\d+" height="\d+"/);
    assert.match(image, /alt="[^"\s][^"]+"/);
    const imagePath = image.match(/src="([^"]+)"/)[1];
    assert.ok(imagePath.endsWith(imageName));
    assert.ok(fs.existsSync(path.resolve(root, 'projects', imagePath)));
  }
});

test('the spread preserves full artifacts and stacks without scripted effects', () => {
  const css = read('css/project-editorial.css');
  const section = css.slice(css.indexOf('.project-continuation {'), css.indexOf('.case-page .case-source-row {'));
  assert.match(section, /grid-template-columns: minmax\(0, \.95fr\) minmax\(0, 1\.05fr\)/);
  assert.match(section, /object-fit: contain/);
  assert.doesNotMatch(section, /(?:^|[;{\n])\s*(?:animation|transition|transform)\s*:|position:\s*fixed/m);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.case-page \.project-continuation-link \{ grid-template-columns: 1fr;/);
});
