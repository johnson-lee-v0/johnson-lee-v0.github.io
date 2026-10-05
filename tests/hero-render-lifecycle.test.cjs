const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../js/script.js'), 'utf8');
const heroSource = source.slice(source.indexOf('function initializeHeroScrollWorld()'), source.indexOf('function initializeRevealAnimations()'));

function setup({ reduced = false } = {}) {
  class Element {
    constructor() {
      this.listeners = {};
      this.style = { setProperty() {} };
      this.classes = new Set();
      this.classList = {
        add: (...names) => names.forEach(name => this.classes.add(name)),
        remove: (...names) => names.forEach(name => this.classes.delete(name)),
        contains: name => this.classes.has(name),
        toggle: (name, value) => value ? this.classes.add(name) : this.classes.delete(name)
      };
      this.offsetHeight = 1800;
    }
    addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
    setAttribute() {}
    closest() { return null; }
    querySelector() { return null; }
    getBoundingClientRect() { return { top: 0, bottom: 1800, width: 1200, height: 800 }; }
  }
  const hero = new Element(), sticky = new Element(), canvas = new Element(), wrap = new Element();
  const toggle = new Element(), trigger = new Element(), label = new Element(), exit = new Element();
  const nav = new Element(), work = new Element(), document = new Element(), window = new Element();
  const renders = [], frames = new Map();
  let frameId = 0, timestamp = 100;
  hero.querySelector = name => ({ '.hero-sticky': sticky, '[data-hero-exit]': exit }[name] || null);
  trigger.querySelector = () => label;
  work.scrollIntoView = () => {};
  document.querySelector = name => ({ '.hero': hero, nav }[name] || null);
  document.getElementById = name => ({ 'persona-canvas': canvas, 'persona-canvas-wrap': wrap, 'persona-motion-toggle': toggle, 'hero-sequence-trigger': trigger, work }[name] || null);
  document.documentElement = new Element();
  document.body = new Element();
  Object.assign(window, {
    innerWidth: 1200, innerHeight: 800, scrollY: 0, scrollX: 0,
    location: { hash: '' }, history: { pushState() {} },
    getComputedStyle: () => ({ position: 'sticky', scrollMarginTop: '0' }),
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: () => 1, clearTimeout() {}, scrollTo() {},
    createPersonaRenderer: () => ({ resize() {}, render: state => { renders.push(state); return true; }, setPaused() {} })
  });
  vm.runInNewContext(heroSource + '\ninitializeHeroScrollWorld();', {
    window, document, Element, console,
    reducedMotion: { matches: reduced }, forcedColors: { matches: false }
  });
  const emit = (target, name) => (target.listeners[name] || []).forEach(callback => callback({ target: document }));
  const tick = () => {
    timestamp += 17;
    const batch = [...frames.values()];
    frames.clear();
    batch.forEach(callback => callback(timestamp));
  };
  return { hero, toggle, document, window, wrap, renders, emit, tick, frames };
}

for (const mode of ['reduced-motion', 'paused']) {
  const app = setup({ reduced: mode === 'reduced-motion' });
  if (mode === 'paused') app.emit(app.toggle, 'click');
  const count = app.renders.length;
  for (let index = 0; index < 20; index++) {
    app.emit(app.window, 'scroll');
    app.tick();
  }
  assert.equal(app.renders.length, count, mode + ' must not repaint an unchanged pose on scroll');
  assert.equal(app.frames.size, 0, mode + ' must not retain an animation loop');

  app.wrap.getBoundingClientRect = () => ({ top: 0, bottom: 1800, width: 1000, height: 700 });
  app.emit(app.window, 'resize');
  app.tick();
  assert.ok(app.renders.length > count, mode + ' must still redraw after a real resize');
  console.log('PASS ' + mode + ' skips redundant scroll rendering and preserves resize rendering');
}

{
  const app = setup();
  app.tick();
  app.document.hidden = true;
  app.emit(app.document, 'visibilitychange');
  const count = app.renders.length;
  app.tick();
  assert.equal(app.renders.length, count, 'Hidden tabs do not render');
  assert.equal(app.frames.size, 0, 'Hidden tabs cancel the frame loop');
  app.document.hidden = false;
  app.emit(app.document, 'visibilitychange');
  app.tick();
  assert.ok(app.renders.length > count, 'Visible tabs resume animation');
  console.log('PASS hidden-tab cancellation and resume');
}

{
  const app = setup();
  app.tick();
  app.hero.getBoundingClientRect = () => ({ top: -2500, bottom: -700, width: 1200, height: 800 });
  app.emit(app.window, 'scroll');
  app.tick();
  const count = app.renders.length;
  app.tick();
  assert.equal(app.renders.length, count, 'Offscreen hero does not render');
  assert.equal(app.frames.size, 0, 'Offscreen hero cancels the frame loop');
  app.hero.getBoundingClientRect = () => ({ top: 0, bottom: 1800, width: 1200, height: 800 });
  app.emit(app.window, 'scroll');
  app.tick();
  app.tick();
  assert.ok(app.renders.length > count, 'Returning onscreen resumes animation');
  console.log('PASS offscreen cancellation and resume without IntersectionObserver');
}
