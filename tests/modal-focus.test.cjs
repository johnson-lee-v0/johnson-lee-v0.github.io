const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/script.js'), 'utf8');
function extract(name) {
  const start = source.indexOf('function ' + name + '(');
  const end = source.indexOf('\nfunction ', start + 1);
  assert.ok(start >= 0 && end > start, name + ' exists');
  return source.slice(start, end);
}
class Control {
  constructor(options = {}) { Object.assign(this, { disabled: false, tabIndex: 0, ancestor: null, rects: [1], visibility: 'visible', focused: 0 }, options); }
  matches() { return this.disabled; }
  closest() { return this.ancestor; }
  getClientRects() { return this.rects; }
  focus() { this.focused++; }
  setAttribute(name, value) { this[name] = value; }
}
const frames = [], trigger = new Control(), origin = new Control();
let backgroundInert = false;
const context = {
  HTMLElement: Control,
  document: { activeElement: origin, body: { classList: { add() {}, remove() {} } } },
  window: { getComputedStyle: el => ({ visibility: el.visibility }), requestAnimationFrame: fn => frames.push(fn) },
  setBackgroundInert: value => { backgroundInert = value; },
  activeModal: null, activeModalTrigger: null, lastFocusedElement: null,
};
vm.createContext(context);
vm.runInContext(['getModalFocusables', 'openModal', 'closeModal'].map(extract).join('\n'), context);
const enabled = new Control(), select = new Control();
const candidates = [enabled, select, new Control({ disabled: true }), new Control({ tabIndex: -1 }), new Control({ ancestor: {} }), new Control({ rects: [] }), new Control({ visibility: 'hidden' })];
const eligible = context.getModalFocusables({ querySelectorAll: () => candidates });
assert.equal(eligible.length, 2);
assert.equal(eligible[0], enabled);
assert.equal(eligible[1], select);

const makeModal = () => ({ hidden: true, inner: new Control(), querySelector() { return this.inner; } });
const first = makeModal();
context.openModal(first, trigger);
assert.equal(first.hidden, false);
assert.equal(backgroundInert, true);
context.closeModal();
assert.equal(backgroundInert, false);
assert.equal(origin.focused, 1);
frames.shift()();
assert.equal(first.inner.focused, 0, 'A close before animation frame must not focus the closed modal');

const second = makeModal();
context.openModal(first, trigger);
context.openModal(second, trigger);
frames.shift()();
frames.shift()();
assert.equal(first.inner.focused, 0, 'An old opening callback must not steal focus from the replacement modal');
assert.equal(second.inner.focused, 1);
assert.equal(second.hidden, false);
context.closeModal();
assert.equal(trigger['aria-expanded'], 'false');
assert.equal(backgroundInert, false);
console.log('PASS modal focus eligibility, cancelled opening, replacement race, and focus restoration');
