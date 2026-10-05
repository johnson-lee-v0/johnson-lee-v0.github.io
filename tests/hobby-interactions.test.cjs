const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../js/hobby-interactions.js'), 'utf8');
const spins = fs.readFileSync(path.join(__dirname, '../js/sneaker-spins.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../css/hobby-interactions.css'), 'utf8');

function fixture({ responsive = false } = {}) {
  const requests = [];
  const frames = [];
  const photos = responsive
    ? JSON.parse(fs.readFileSync(path.join(__dirname, '../image/personal/travel/photos.json'), 'utf8'))
    : Array.from({ length: 9 }, (_, i) => ({ id: `photo-${i}`, src: `photo-${i}.webp`, alt: `Original view ${i}`, place: `Place ${i}`, trip: `Trip ${i}`, width: 500, height: 600 }));
  class Node {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {};
      this.className = ''; this.isConnected = true; this.clientWidth = 360;
      this.classList = {
        contains: name => this.className.split(' ').includes(name),
        add: name => { this.className += ` ${name}`; },
        remove: name => { this.className = this.className.split(' ').filter(value => value !== name).join(' '); },
      };
    }
    append(...nodes) { this.children.push(...nodes); }
    set src(value) {
      this._src = value;
      (this.sourceAssignments ||= []).push({ src: value, srcset: this.srcset, sizes: this.sizes, loading: this.loading });
    }
    get src() { return this._src; }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute(key, value) { this.attributes[key] = value; }
    removeAttribute(key) { delete this.attributes[key]; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    querySelector(selector) { return all(this).find(node => node.classList.contains(selector.slice(1))) || null; }
    focus() { document.activeElement = this; }
    setPointerCapture(id) { this.capture = id; }
    hasPointerCapture(id) { return this.capture === id; }
    releasePointerCapture() { this.capture = null; }
  }
  const all = root => [root, ...root.children.flatMap(all)];
  const travel = new Node('div');
  const document = {
    createElement: tag => new Node(tag),
    createElementNS: (namespace, tag) => Object.assign(new Node(tag), { namespaceURI: namespace }),
    getElementById: id => id === 'travel-carousel' ? travel : null,
  };
  class Image {
    set src(url) { this.url = url; requests.push(url); queueMicrotask(() => this.onload()); }
    get src() { return this.url; }
  }
  const window = {};
  const context = vm.createContext({ document, window, Image, fetch: async () => ({ ok: true, json: async () => photos }), requestAnimationFrame: callback => { frames.push(callback); return frames.length; } });
  vm.runInContext(spins, context);
  vm.runInContext(source, context);
  const flush = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve)); };
  function event(overrides = {}) {
    return { detail: 1, prevented: false, stopped: false, defaultPrevented: false,
      preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, ...overrides };
  }
  return { window, travel, requests, frames, photos, all, document, flush, event };
}

test('polaroid keyboard controls preserve originals, one featured print and browser shortcuts', async () => {
  const f = fixture();
  f.window.PortfolioHobbies.initialize();
  await f.flush();
  const cards = f.all(f.travel).filter(node => node.classList.contains('polaroid'));
  assert.equal(cards.length, 9);
  cards.forEach((card, i) => { assert.equal(card.children[0].src, f.photos[i].src); assert.equal(card.children[0].alt, f.photos[i].alt); });
  assert.equal(cards.filter(card => card.tabIndex === 0).length, 1);
  const shortcut = f.event({ key: 'ArrowLeft', altKey: true, target: cards[0] });
  f.travel.listeners.keydown(shortcut);
  assert.equal(shortcut.prevented, false);
  assert.equal(cards[0].dataset.slot, '0');
  const right = f.event({ key: 'ArrowRight', target: cards[0] });
  f.travel.listeners.keydown(right);
  assert.equal(right.prevented, true);
  assert.equal(cards[1].dataset.slot, '0');
  assert.equal(cards[0].dataset.slot, '1');
  assert.equal(cards[2].dataset.slot, '2', 'Unselected prints retain their fan positions');
  assert.equal(f.document.activeElement, cards[1]);
  assert.equal(cards.filter(card => card.tabIndex === 0).length, 1);
});

test('a travel swipe cannot swallow a later keyboard activation', async () => {
  const f = fixture(); f.window.PortfolioHobbies.initialize(); await f.flush();
  const stage = f.travel.children[0];
  stage.listeners.pointerdown(f.event({ pointerType: 'touch', isPrimary: true, clientX: 100, clientY: 20 }));
  stage.listeners.pointerup(f.event({ clientX: 20, clientY: 22 }));
  const keyboardClick = f.event({ detail: 0 });
  stage.listeners.click(keyboardClick);
  assert.equal(keyboardClick.prevented, false);
  assert.equal(keyboardClick.stopped, false);
});

test('travel previews declare real smaller candidates before src and resize on selection', async () => {
  const f = fixture({ responsive: true });
  f.window.PortfolioHobbies.initialize();
  await f.flush();
  const cards = f.all(f.travel).filter(node => node.classList.contains('polaroid'));
  assert.equal(cards.length, 9);
  cards.forEach((card, index) => {
    const photo = f.photos[index], image = card.children[0];
    assert.equal(image.alt, photo.alt);
    assert.equal(image.width, photo.width);
    assert.equal(image.height, photo.height);
    assert.equal(image.sourceAssignments.length, 1, 'Never assign the original before responsive candidates');
    assert.deepEqual(image.sourceAssignments[0], {
      src: photo.thumbnails[240],
      srcset: `${photo.thumbnails[240]} 240w, ${photo.thumbnails[480]} 480w`,
      sizes: index === 0 ? '(max-width: 700px) 44vw, 248px' : '(max-width: 700px) 26vw, 128px',
      loading: 'lazy'
    });
    for (const width of [240, 480]) {
      const thumbnail = path.resolve(__dirname, '..', photo.thumbnails[width]);
      const original = path.resolve(__dirname, '..', photo.src);
      assert.ok(fs.statSync(thumbnail).size < fs.statSync(original).size, 'Preview is a smaller real asset');
      assert.notEqual(thumbnail, original, 'Original source remains separately available');
    }
  });
  cards[3].listeners.click();
  assert.equal(cards[3].dataset.slot, '0');
  assert.equal(cards[3].children[0].sizes, '(max-width: 700px) 44vw, 248px');
  assert.equal(cards[0].children[0].sizes, '(max-width: 700px) 26vw, 128px');
  assert.equal(cards[2].dataset.slot, '2', 'Selection retains unrelated orbit positions');
  f.travel.listeners.keydown(f.event({ key: 'ArrowRight', target: cards[3] }));
  assert.equal(cards[4].children[0].sizes, '(max-width: 700px) 44vw, 248px');
  assert.equal(cards[3].children[0].sizes, '(max-width: 700px) 26vw, 128px');
  assert.equal(f.document.activeElement, cards[4], 'Responsive changes preserve keyboard focus behavior');
});

test('shoe keyboard rotation announces the loaded angle, wraps, and preserves modified shortcuts', async () => {
  const f = fixture();
  const root = f.window.PortfolioHobbies.createSneakerViewer({ name: 'Air Jordan 1 Retro High OG Visionaire', image: 'real-photo.jpg' });
  const stage = root.children[0], image = stage.children[0];
  assert.equal(f.requests.length, 0, 'No angle downloads before interaction');
  assert.equal(image.src, 'real-photo.jpg');
  const modified = f.event({ key: 'ArrowRight', ctrlKey: true });
  stage.listeners.keydown(modified);
  assert.equal(modified.prevented, false);
  assert.equal(f.requests.length, 0);
  stage.listeners.keydown(f.event({ key: 'ArrowRight' })); await f.flush();
  assert.equal(image.dataset.frame, '2');
  const live = f.all(root).find(node => node.classList.contains('sr-only') && node.attributes.role === 'status');
  assert.match(live.textContent, /view 2 of 36, 10°/);
  stage.listeners.keydown(f.event({ key: 'End' })); await f.flush();
  assert.equal(image.dataset.frame, '36');
  stage.listeners.keydown(f.event({ key: 'ArrowRight' })); await f.flush();
  assert.equal(image.dataset.frame, '1');
  assert.match(live.textContent, /view 1 of 36, 0°/);
});

test('drag suppression blocks pointer clicks but never a subsequent keyboard click', async () => {
  const f = fixture();
  const root = f.window.PortfolioHobbies.createSneakerViewer({ name: 'Air Jordan 1 Retro High OG Visionaire', image: 'real-photo.jpg' });
  const stage = root.children[0], image = stage.children[0];
  function drag() {
    stage.listeners.pointerdown(f.event({ isPrimary: true, button: 0, pointerId: 1, clientX: 0, clientY: 0 }));
    stage.listeners.pointermove(f.event({ buttons: 1, pointerId: 1, clientX: 80, clientY: 0 }));
    f.frames.splice(0).forEach(callback => callback());
    stage.listeners.pointerup(f.event({ pointerId: 1 }));
  }
  drag(); await f.flush();
  assert.equal(image.dataset.frame, '9');
  const pointerClick = f.event(); stage.listeners.click(pointerClick); await f.flush();
  assert.equal(pointerClick.prevented, true);
  assert.equal(image.dataset.frame, '9');
  drag(); await f.flush();
  assert.equal(image.dataset.frame, '17');
  const keyboardClick = f.event({ detail: 0 }); stage.listeners.click(keyboardClick); await f.flush();
  assert.equal(keyboardClick.prevented, false);
  assert.equal(image.dataset.frame, '20');
});

test('unsupported shoes retain a noninteractive real photograph and reduced motion disables fan animation', () => {
  const f = fixture();
  const root = f.window.PortfolioHobbies.createSneakerViewer({ name: 'KD 7 Easter', image: 'original-kd.jpg' });
  assert.equal(root.children[0].tagName, 'DIV');
  assert.equal(root.children[0].children[0].src, 'original-kd.jpg');
  assert.equal(f.requests.length, 0);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.polaroid\s*\{\s*transition:\s*none;/);
  assert.doesNotMatch(source, /setInterval\s*\(/, 'Spins are user-controlled, not autoplay');
});
