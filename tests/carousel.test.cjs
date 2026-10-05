const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../js/carousel.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../projects/University_Twitter.html'), 'utf8');
const make = () => ({
  listeners: {}, children: [], style: {}, attributes: {},
  classList: { add() {}, toggle() {} },
  addEventListener(name, fn) { this.listeners[name] = fn; },
  setAttribute(name, value) { this.attributes[name] = value; },
  removeAttribute(name) { delete this.attributes[name]; },
  replaceChildren() { this.children = []; },
  appendChild(child) { this.children.push(child); }
});
const deck = make(); deck.open = false;
const carousel = make(); carousel.closest = () => deck;
const track = make(), dots = make(), summary = make(), originalLink = make(), window = make();
const slidePaths = [...html.matchAll(/<img data-src="([^"]+)"/g)].map(match => match[1]);
const imageRequests = [];
const images = slidePaths.map((src, i) => ({
  dataset: { src }, alt: `Description ${i + 1}`,
  get src() { return this.loadedSource; },
  set src(value) { this.loadedSource = value; imageRequests.push(value); },
  getAttribute(name) { return name === 'src' ? this.src || null : null; }
}));
const slides = images.map(image => ({ ...make(), querySelector: () => image }));
const document = {
  querySelector: selector => ({ '.carousel': carousel, '.carousel-container': track, '.carousel-dots': dots }[selector]),
  querySelectorAll: selector => ({ '.carousel-slide': slides, '.carousel-dot': dots.children }[selector]),
  getElementById: id => ({ 'slide-summary': summary, 'slide-original': originalLink }[id] || null),
  createElement: make
};
const context = vm.createContext({ document, window });
vm.runInContext(source, context);
window.listeners.load();
assert.equal(images.filter(image => image.src).length, 0, 'Closed deck performs no image requests');
assert.equal(imageRequests.length, 0, 'Setting the original link never fetches a slide');
assert.equal(originalLink.attributes.href, slidePaths[0]);
assert.equal(originalLink.attributes['aria-label'], 'Open original slide 1 of 13 in a new tab');
assert.equal(dots.children.length, 13);
deck.open = true;
deck.listeners.toggle();
assert.equal(images.filter(image => image.src).length, 1, 'Opening deck loads only the current slide');
assert.deepEqual(imageRequests, [slidePaths[0]]);
assert.equal(summary.textContent, 'Slide 1 of 13: Description 1');
let prevented = false;
carousel.listeners.keydown({ key: 'ArrowRight', preventDefault() { prevented = true; } });
assert.equal(prevented, true);
assert.equal(images.filter(image => image.src).length, 2, 'Navigating loads only the selected slide');
assert.equal(originalLink.attributes.href, slidePaths[1]);
assert.equal(originalLink.attributes['aria-label'], 'Open original slide 2 of 13 in a new tab');
assert.equal(summary.textContent, 'Slide 2 of 13: Description 2');
assert.equal(slides[0].attributes['aria-hidden'], 'true');
assert.equal(slides[1].attributes['aria-hidden'], 'false');
carousel.listeners.keydown({ key: 'ArrowLeft', preventDefault() {} });
assert.equal(originalLink.attributes.href, slidePaths[0], 'Returning to a loaded slide uses its eager src after data-src was removed');
assert.equal(imageRequests.length, 2, 'Revisiting a slide never reassigns its source');
carousel.listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
assert.equal(originalLink.attributes.href, slidePaths[1]);
deck.open = false;
deck.listeners.toggle();
vm.runInContext('moveToSlide(5)', context);
assert.equal(images.filter(image => image.src).length, 2, 'Closed deck does not fetch programmatically selected slides');
assert.equal(imageRequests.length, 2);
assert.equal(originalLink.attributes.href, slidePaths[5], 'Original link tracks a selected but still-unloaded slide');
assert.equal(originalLink.attributes['aria-label'], 'Open original slide 6 of 13 in a new tab');
deck.open = true;
deck.listeners.toggle();
assert.equal(images.filter(image => image.src).length, 3);
assert.equal(imageRequests.length, 3);
assert.equal(summary.textContent, 'Slide 6 of 13: Description 6');

dots.children[12].listeners.click();
assert.equal(originalLink.attributes.href, slidePaths[12], 'Dot selection synchronizes the original link');
assert.equal(imageRequests.length, 4);
carousel.listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
assert.equal(originalLink.attributes.href, slidePaths[0], 'Next wraps the original link from last to first');
carousel.listeners.keydown({ key: 'ArrowLeft', preventDefault() {} });
assert.equal(originalLink.attributes.href, slidePaths[12], 'Previous wraps the original link from first to last');
assert.equal(imageRequests.length, 4, 'Wraparound does not reload already visited slides');

for (let index = 0; index < slides.length; index++) {
  const alreadyLoaded = Boolean(images[index].src);
  const requestsBefore = imageRequests.length;
  carousel.listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(originalLink.attributes.href, slidePaths[index], `Keyboard navigation links to original slide ${index + 1}`);
  assert.equal(originalLink.attributes['aria-label'], `Open original slide ${index + 1} of 13 in a new tab`);
  assert.equal(summary.textContent, `Slide ${index + 1} of 13: Description ${index + 1}`);
  assert.equal(imageRequests.length, requestsBefore + Number(!alreadyLoaded), 'Only a newly selected slide is fetched');
  assert.deepEqual(imageRequests.slice(requestsBefore), alreadyLoaded ? [] : [slidePaths[index]], 'A new request is for the selected original, not another slide');
  assert.equal(images[index].src, slidePaths[index]);
  assert.equal(slides.filter(slide => slide.attributes['aria-hidden'] === 'false').length, 1);
  assert.equal(dots.children[index].attributes['aria-current'], 'true');
}
assert.equal(imageRequests.length, 13, 'All 13 slides remain reachable and are each loaded exactly once');
assert.deepEqual(Object.keys(originalLink.listeners), [], 'The original link retains native new-tab navigation');
assert.equal((html.match(/<img data-src=/g) || []).length, 13);
slidePaths.forEach(src => assert.ok(fs.existsSync(path.resolve(__dirname, '../projects', src)), `Original slide exists: ${src}`));
const originalMarkup = html.match(/<a\b[^>]*id="slide-original"[^>]*>[^<]+<\/a>/)?.[0];
assert.ok(originalMarkup, 'The selected original is a visible native link');
assert.ok(originalMarkup.includes(`href="${slidePaths[0]}"`), 'Initial original link works without JavaScript');
assert.match(originalMarkup, /class="case-button"/, 'The link reuses the existing mobile-sized action target');
assert.match(originalMarkup, /target="_blank"/);
assert.match(originalMarkup, /rel="noopener noreferrer"/);
assert.match(originalMarkup, /aria-label="Open original slide 1 of 13 in a new tab"/);
assert.match(originalMarkup, />Open original slide ↗<\/a>/);
assert.match(html, /<div class="carousel"[^>]* hidden>/);
assert.match(html, /<noscript>/);
assert.match(html, /Browse all original slide images/);
assert.equal((html.match(/<img src=/g) || []).length, 1, 'Only the lead chart has an eager source');
console.log('PASS all 13 original-slide links, native new-tab markup, incremental deck loading, keyboard/dot navigation, live summaries, and no-JS fallback');

// Legacy pages have eager image sources, no details wrapper, and no live summary.
{
  const legacyCarousel = make(); legacyCarousel.closest = () => null;
  const legacyTrack = make(), legacyDots = make(), legacyWindow = make();
  const legacyImages = Array.from({ length: 3 }, (_, i) => ({ src: `legacy-${i}.jpg`, dataset: {}, alt: `Legacy ${i}` }));
  const legacySlides = legacyImages.map(image => ({ ...make(), querySelector: () => image }));
  const legacyDocument = {
    querySelector: selector => ({ '.carousel': legacyCarousel, '.carousel-container': legacyTrack, '.carousel-dots': legacyDots }[selector]),
    querySelectorAll: selector => ({ '.carousel-slide': legacySlides, '.carousel-dot': legacyDots.children }[selector]),
    getElementById: () => null,
    createElement: make
  };
  const legacyContext = vm.createContext({ document: legacyDocument, window: legacyWindow });
  vm.runInContext(source, legacyContext);
  legacyWindow.listeners.load();
  assert.equal(legacyDots.children.length, 3);
  assert.equal(legacyTrack.style.transform, 'translateX(-0%)');
  vm.runInContext('moveSlide(-1)', legacyContext);
  assert.equal(legacyTrack.style.transform, 'translateX(-200%)', 'Previous wraps from first to last');
  assert.equal(legacySlides[2].attributes['aria-hidden'], 'false');
  assert.equal(legacyDots.children[2].attributes['aria-current'], 'true');
  vm.runInContext('moveSlide(1)', legacyContext);
  assert.equal(legacyTrack.style.transform, 'translateX(-0%)', 'Next wraps from last to first');
  legacyDots.children[1].listeners.click();
  assert.equal(legacyTrack.style.transform, 'translateX(-100%)');
  assert.equal(legacyDots.children[0].attributes['aria-current'], undefined);
  let leftPrevented = false;
  legacyCarousel.listeners.keydown({ key: 'ArrowLeft', preventDefault() { leftPrevented = true; } });
  assert.equal(leftPrevented, true);
  assert.equal(legacyTrack.style.transform, 'translateX(-0%)');
  assert.deepEqual(legacyImages.map(image => image.src), ['legacy-0.jpg', 'legacy-1.jpg', 'legacy-2.jpg'], 'Existing image sources remain unchanged');
  console.log('PASS legacy no-deck carousel, arrow navigation, wraparound, dots, and original images');
}

{
  const emptyWindow = make();
  const emptyContext = vm.createContext({
    window: emptyWindow,
    document: { querySelectorAll: () => [], querySelector: () => null, getElementById: () => null }
  });
  vm.runInContext(source, emptyContext);
  assert.doesNotThrow(() => emptyWindow.listeners.load());
  assert.doesNotThrow(() => vm.runInContext('moveSlide(1)', emptyContext));
  console.log('PASS missing carousel remains a safe no-op');
}
