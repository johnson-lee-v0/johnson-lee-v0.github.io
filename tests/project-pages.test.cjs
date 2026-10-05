/* Source-level regression checks; no browser or installed dependencies required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = ['Equity_Research', 'Max_Temperature', 'Blackjack', 'University_Twitter', 'NBA_Games_Outcome'];
for (const page of pages) {
  const html = read(`projects/${page}.html`);
  assert.match(html, /<main id="case-content" tabindex="-1">/, `${page}: skip destination must accept keyboard focus`);
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    assert.match(image[0], /width="\d+"/, `${page}: reserve image width`);
    assert.match(image[0], /height="\d+"/, `${page}: reserve image height`);
    assert.match(image[0], /decoding="async"/, `${page}: nonblocking decode`);
    assert.match(image[0], /alt="[^"\s][^"]+"/, `${page}: meaningful image alternative`);
  }
}

// PNG metadata independently verifies the declared screenshot dimensions.
function pngDimensions(file) {
  const bytes = fs.readFileSync(path.join(root, file));
  assert.equal(bytes.toString('ascii', 1, 4), 'PNG');
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}
const blackjack = read('projects/Blackjack.html');
for (const [file, width, height] of [['Blackjack-1.png', 997, 787], ['Blackjack-2.png', 998, 783]]) {
  assert.deepEqual(pngDimensions(`image/Project_Carousel/Blackjack/${file}`), [width, height]);
  assert.ok(blackjack.includes(`${file}" width="${width}" height="${height}"`));
}
assert.equal((blackjack.match(/<img data-src=/g) || []).length, 2);
assert.equal((blackjack.match(/<img src=/g) || []).length, 1, 'Only the lead screenshot has an eager request');
assert.match(blackjack, /<div class="carousel"[^>]+hidden>/);
assert.match(blackjack, /<noscript>[\s\S]*Blackjack-2\.png[\s\S]*<\/noscript>/);
assert.match(blackjack, /id="slide-summary" aria-live="polite"/);

for (const page of ['Max_Temperature', 'University_Twitter']) {
  const html = read(`projects/${page}.html`);
  assert.match(html, /class="project-chart-reader [^"]+" tabindex="0" role="region"/);
  assert.match(html, /aria-describedby="[^"]+-chart-help"/);
  assert.match(html, /left and right arrow keys/);
}
const css = read('css/project-editorial.css');
assert.match(css, /project-chart-reader[\s\S]*overflow-x: auto/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /carousel-container[^}]*transition: none/);
console.log('PASS project image dimensions, async decoding, focusable skip links, on-demand blackjack screenshots, mobile chart regions, and reduced motion.');
