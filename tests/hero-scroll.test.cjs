const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../js/script.js'), 'utf8');
const heroSource = source.slice(source.indexOf('function initializeHeroScrollWorld()'), source.indexOf('function initializeRevealAnimations()'));

function setup({ reduced = false, forced = false, fallback = false } = {}) {
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
      this.attributes = {};
    }
    addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name]; }
    hasAttribute(name) { return Object.hasOwn(this.attributes, name); }
    focus(options) { this.focused = true; this.focusOptions = options; }
    closest() { return null; }
    getBoundingClientRect() { return { top: 0, bottom: 1800, width: 1200, height: 800 }; }
    querySelector() { return null; }
  }
  const hero = new Element(), sticky = new Element(), canvas = new Element(), wrap = new Element();
  const toggle = new Element(), trigger = new Element(), label = new Element(), exit = new Element();
  const nav = new Element(), work = new Element(), document = new Element(), window = new Element();
  const main = new Element();
  main.setAttribute('tabindex', '-1');
  main.scrollIntoView = () => {};
  const renders = [], scrolls = [], jumps = [], frames = new Map();
  let frameId = 0, timestamp = 100;
  hero.querySelector = name => ({ '.hero-sticky': sticky, '[data-hero-exit]': exit }[name] || null);
  trigger.querySelector = () => label;
  work.scrollIntoView = options => scrolls.push(options);
  document.querySelector = name => ({ '.hero': hero, nav, '#work': work, '#main-content': main }[name] || null);
  document.getElementById = name => ({ 'persona-canvas': canvas, 'persona-canvas-wrap': wrap, 'persona-motion-toggle': toggle, 'hero-sequence-trigger': trigger, work }[name] || null);
  document.documentElement = new Element();
  document.body = new Element();
  Object.assign(window, {
    innerWidth: 1200, innerHeight: 800, scrollY: 0, scrollX: 0,
    location: { hash: '' }, history: { pushState() {} },
    getComputedStyle: () => ({ position: 'sticky', scrollMarginTop: '0' }),
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: () => 1, clearTimeout() {},
    scrollTo(options) { jumps.push(options); window.scrollY = options.top; },
    createPersonaRenderer: () => ({ fallback, resize() {}, render: state => { renders.push(state); return true; }, setPaused() {} })
  });
  const context = { window, document, Element, console, reducedMotion: { matches: reduced }, forcedColors: { matches: forced } };
  vm.runInNewContext(heroSource + '\ninitializeHeroScrollWorld();', context);
  const emit = (target, name, props = {}) => {
    const event = { target: document, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}, ...props };
    (target.listeners[name] || []).forEach(fn => fn(event));
    return event;
  };
  const tick = duration => {
    const end = timestamp + duration;
    while (timestamp < end) {
      timestamp += 17;
      const batch = [...frames.values()]; frames.clear();
      batch.forEach(callback => callback(timestamp));
    }
  };
  return { hero, toggle, trigger, exit, label, document, window, Element, canvas, main, emit, tick, renders, scrolls, jumps };
}

for (const completed of [false, true]) {
  const app = setup();
  app.emit(app.toggle, 'click');
  app.emit(app.trigger, 'click');
  if (completed) app.tick(2300);
  const skipLink = new app.Element();
  skipLink.setAttribute('href', '#main-content');
  skipLink.closest = () => skipLink;
  app.emit(app.document, 'click', { target: skipLink });
  app.tick(34);
  assert.equal(app.main.focused, true, 'Skip link focuses main during and after the transition');
  assert.equal(app.main.focusOptions.preventScroll, true, 'Focus must not restart the scroll');
  assert.equal(app.main.getAttribute('tabindex'), '-1', 'No sequential tab stop is added');
}
console.log('PASS skip-link focus is preserved during and after the portrait handoff');

for (const modifier of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
  const app = setup();
  const label = app.label.textContent;
  app.emit(app.exit, 'click', modifier);
  assert.equal(app.label.textContent, label, 'Modified work link leaves the intro alone');
  app.emit(app.toggle, 'click');
  app.emit(app.trigger, 'click');
  for (const completed of [false, true]) {
    if (completed) app.tick(2300);
    const state = Array.from(app.hero.classes).sort().join(' ');
    const home = new app.Element();
    home.setAttribute('href', '#about');
    home.closest = () => home;
    const jumpCount = app.jumps.length;
    const event = app.emit(app.document, 'click', { target: home, ...modifier });
    assert.equal(event.defaultPrevented, Boolean(modifier.defaultPrevented), 'Browser retains modified link activation');
    assert.equal(Array.from(app.hero.classes).sort().join(' '), state, 'Modified home link cannot reset the transition');
    assert.equal(app.jumps.length, jumpCount);
  }
}
console.log('PASS modified links preserve browser behavior during intro, departure, and handoff');

for (const gesture of ['wheel', 'touch', 'PageDown', 'ArrowDown', 'Space', 'MetaDown', 'continue']) {
  const app = setup();
  assert.equal(app.trigger.disabled, false, 'Continue is available during intro');
  if (gesture === 'wheel') app.emit(app.hero, 'wheel', { deltaY: 40, deltaMode: 0 });
  else if (gesture === 'touch') {
    app.emit(app.hero, 'touchstart', { touches: [{ clientX: 100, clientY: 200 }] });
    app.emit(app.hero, 'touchmove', { touches: [{ clientX: 100, clientY: 150 }] });
  } else if (gesture === 'continue') app.emit(app.trigger, 'click');
  else app.emit(app.document, 'keydown', { key: gesture === 'MetaDown' ? 'ArrowDown' : gesture === 'Space' ? ' ' : gesture, metaKey: gesture === 'MetaDown', repeat: false });
  assert.equal(app.label.textContent, 'Finishing walk…', gesture + ' queues early intent');
  app.tick(2600);
  assert.equal(app.hero.classes.has('is-scroll-world-intro'), true, gesture + ' retains entrance timing');
  assert.equal(app.hero.classes.has('is-scroll-world-running'), false);
  app.tick(250);
  assert.equal(app.hero.classes.has('is-scroll-world-running'), true, gesture + ' begins exit without another gesture');
  app.tick(2300);
  assert.equal(app.hero.classes.has('is-scroll-world-complete'), true, gesture + ' completes exit');
  assert.equal(app.scrolls.length, 1, gesture + ' hands off once');
  console.log('PASS early ' + gesture);
}

for (const gesture of ['wheel', 'touch', 'PageDown']) {
  const app = setup();
  app.emit(app.toggle, 'click');
  assert.equal(app.renders.at(-1).sequenceProgress, 1, 'Pause settles unfinished intro');
  assert.equal(app.label.textContent, 'Scroll once to continue');
  const pausedTime = app.renders.at(-1).time;
  app.tick(200);
  assert.equal(app.renders.at(-1).time, pausedTime, 'Paused figure remains still');
  if (gesture === 'wheel') app.emit(app.hero, 'wheel', { deltaY: 40, deltaMode: 0 });
  else if (gesture === 'touch') {
    app.emit(app.hero, 'touchstart', { touches: [{ clientX: 100, clientY: 200 }] });
    app.emit(app.hero, 'touchmove', { touches: [{ clientX: 100, clientY: 150 }] });
  } else app.emit(app.document, 'keydown', { key: gesture, repeat: false });
  assert.equal(app.hero.classes.has('is-scroll-world-running'), true, 'Paused ' + gesture + ' starts exit');
  app.tick(2000);
  assert.equal(app.hero.classes.has('is-scroll-world-running'), true, 'Pause retains exit timing');
  app.tick(300);
  assert.equal(app.hero.classes.has('is-scroll-world-complete'), true, 'Paused exit finishes after 2.2 seconds');
  assert.equal(app.scrolls.length, 1, 'Paused ' + gesture + ' navigates');
  console.log('PASS pause then ' + gesture);
}

{
  const app = setup();
  app.emit(app.hero, 'wheel', { deltaY: 40, deltaMode: 0 });
  app.emit(app.toggle, 'click');
  assert.equal(app.hero.classes.has('is-scroll-world-running'), true, 'Pause honors queued exit');
  app.tick(2300);
  assert.equal(app.scrolls.length, 1);
  console.log('PASS early wheel then pause');
}

{
  const renderSource = source.slice(source.indexOf('function renderProjects()'), source.indexOf('function initializeSectionNavigation()'));
  let modified = false;
  vm.runInNewContext(renderSource + '\nrenderProjects();', {
    document: { getElementById: () => ({ children: [{}], replaceChildren: () => { modified = true; } }) }
  });
  assert.equal(modified, false);
  vm.runInNewContext(renderSource + '\nrenderProjects();', { document: { getElementById: () => null } });
  assert.ok(source.indexOf('  renderProjects();', source.indexOf('function initialize()')) < source.indexOf('  initializeHeroScrollWorld();', source.indexOf('function initialize()')));
  console.log('PASS static cards retained, missing grid safe, cards initialized before hero');
}

for (const props of [{ key: 'Escape' }, { key: 'ArrowUp' }, { key: 'PageUp' }, { key: 'Home' }, { key: ' ', shiftKey: true }, { key: 'ArrowUp', metaKey: true }, { key: 'Home', ctrlKey: true }]) {
  for (const completed of [false, true]) {
    const app = setup();
    app.emit(app.toggle, 'click');
    app.emit(app.hero, 'wheel', { deltaY: 40, deltaMode: 0 });
    if (completed) app.tick(2300);
    const event = app.emit(app.document, 'keydown', props);
    assert.equal(event.defaultPrevented, true);
    assert.equal(app.jumps.at(-1).top, 0, 'Return navigation targets hero');
    assert.equal(app.hero.classes.has('is-scroll-world-running'), false);
    assert.equal(app.hero.classes.has('is-scroll-world-complete'), false);
    assert.equal(app.renders.at(-1).sequenceProgress, 1, 'Return does not replay entrance');
    assert.equal(app.renders.at(-1).scrollProgress, 0, 'Return restores intact figure');
    app.emit(app.document, 'keyup', { key: props.key });
    if (props.metaKey) app.emit(app.document, 'keyup', { key: 'Meta' });
    if (props.ctrlKey) app.emit(app.document, 'keyup', { key: 'Control' });
    app.tick(60);
    app.emit(app.document, 'keydown', { key: 'PageDown', repeat: false });
    assert.equal(app.hero.classes.has('is-scroll-world-running'), true, 'A fresh down gesture works after returning');
  }
}
console.log('PASS hero returns and fresh exit after Escape/up/Home/modifier navigation, during and after exit');

{
  const app = setup();
  app.emit(app.toggle, 'click');
  app.emit(app.document, 'keydown', { key: 'PageDown', repeat: false });
  app.emit(app.document, 'keydown', { key: 'ArrowUp', metaKey: true });
  app.emit(app.document, 'keyup', { key: 'ArrowUp' });
  app.emit(app.document, 'keydown', { key: 'ArrowDown', metaKey: true, repeat: false });
  assert.equal(app.hero.classes.has('is-scroll-world-running'), false, 'Held modifier does not restart exit at boundary');
  app.emit(app.document, 'keyup', { key: 'Meta' });
  app.emit(app.document, 'keyup', { key: 'ArrowDown' });
  app.emit(app.document, 'keydown', { key: 'ArrowDown', metaKey: true, repeat: false });
  assert.equal(app.hero.classes.has('is-scroll-world-running'), true, 'Released modifier permits new intent');
  console.log('PASS document-boundary modifier latch release');
}

for (const options of [{ reduced: true }, { forced: true }, { fallback: true }]) {
  const app = setup(options);
  assert.equal(app.renders.at(-1).sequenceProgress, 1);
  assert.equal(app.emit(app.hero, 'wheel', { deltaY: 40, deltaMode: 0 }).defaultPrevented, false);
  assert.equal(app.emit(app.document, 'keydown', { key: 'PageDown' }).defaultPrevented, false);
  app.emit(app.trigger, 'click');
  assert.equal(app.scrolls.length, 1, 'Static mode retains explicit portfolio navigation');
}
console.log('PASS reduced-motion, forced-color, and renderer-fallback navigation');

{
  const app = setup();
  const editable = new app.Element();
  editable.closest = selector => selector.includes('input') ? editable : null;
  assert.equal(app.emit(app.document, 'keydown', { key: 'PageDown', target: editable }).defaultPrevented, false);
  const button = new app.Element();
  button.closest = selector => selector.includes('button') ? button : null;
  assert.equal(app.emit(app.document, 'keydown', { key: ' ', target: button }).defaultPrevented, false);
  assert.equal(app.emit(app.hero, 'wheel', { deltaY: 40, ctrlKey: true }).defaultPrevented, false);
  assert.equal(app.label.textContent, 'Continue after walk', 'Excluded input does not queue a transition');
  app.emit(app.hero, 'wheel', { deltaY: 40, deltaMode: 0 });
  const about = new app.Element();
  about.setAttribute('href', '#about');
  about.closest = () => about;
  app.emit(app.document, 'click', { target: about });
  app.tick(5100);
  assert.equal(app.scrolls.length, 0, 'About link cancels queued exit');
  assert.equal(app.hero.classes.has('is-scroll-world-running'), false);
  console.log('PASS input exclusions and queued-exit cancellation');
}

{
  const app = setup();
  app.emit(app.hero, 'wheel', { deltaY: 40, deltaMode: 0 });
  app.emit(app.canvas, 'webglcontextlost');
  assert.equal(app.scrolls.length, 1, 'Context loss honors queued navigation');
  assert.equal(app.scrolls[0].behavior, 'auto');
  assert.equal(app.hero.classes.has('is-persona-fallback'), true);
  assert.equal(app.emit(app.hero, 'wheel', { deltaY: 40, deltaMode: 0 }).defaultPrevented, false);
  console.log('PASS WebGL loss releases navigation');
}

for (const reversal of ['Escape', 'PageUp', 'ArrowUp', 'Home', 'wheel-up']) {
  const app = setup();
  app.emit(app.hero, 'wheel', { deltaY: 40, deltaMode: 0 });
  assert.equal(app.label.textContent, 'Finishing walk…');
  const event = reversal === 'wheel-up'
    ? app.emit(app.hero, 'wheel', { deltaY: -40, deltaMode: 0 })
    : app.emit(app.document, 'keydown', { key: reversal });
  assert.equal(app.label.textContent, 'Continue after walk', reversal + ' clears queued intent');
  assert.equal(event.defaultPrevented, reversal === 'Escape', 'Upward navigation retains native scrolling');
  app.tick(2600);
  assert.equal(app.hero.classes.has('is-scroll-world-intro'), true, 'Cancellation preserves walk duration');
  app.tick(300);
  assert.equal(app.hero.classes.has('is-scroll-world-running'), false);
  assert.equal(app.scrolls.length, 0, 'Cancelled intent must not navigate');
  app.emit(app.hero, 'wheel', { deltaY: 40, deltaMode: 0 });
  assert.equal(app.hero.classes.has('is-scroll-world-running'), true, 'A fresh gesture can still exit');
}
console.log('PASS queued-exit cancellation by Escape, upward keys, and upward wheel');
