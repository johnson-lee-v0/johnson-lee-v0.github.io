/* Progressive enhancement: every sourced discussion remains readable without JavaScript. */
(() => {
  function initialize(root) {
    if (!root || root.dataset.earningsReady === 'true') return false;
    const controls = root.querySelector('[data-earnings-controls]');
    const buttons = [...root.querySelectorAll('[data-earnings-theme]')];
    const panels = [...root.querySelectorAll('[data-earnings-panel]')];
    const keys = buttons.map(button => button.dataset.earningsTheme);
    if (!controls || !buttons.length || buttons.length !== panels.length ||
        keys.some(key => !key) || new Set(keys).size !== keys.length ||
        panels.some(panel => !keys.includes(panel.dataset.earningsPanel)) ||
        new Set(panels.map(panel => panel.dataset.earningsPanel)).size !== panels.length ||
        buttons.some(button => {
          const panel = panels.find(candidate => candidate.dataset.earningsPanel === button.dataset.earningsTheme);
          return !panel?.id || button.getAttribute('aria-controls') !== panel.id;
        })) return false;

    function select(key) {
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.earningsTheme === key)));
      panels.forEach(panel => { panel.hidden = panel.dataset.earningsPanel !== key; });
    }
    buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.earningsTheme)));
    select(keys[0]);
    controls.hidden = false;
    root.dataset.earningsReady = 'true';
    return true;
  }
  if (typeof module === 'object' && module.exports) module.exports = { initialize };
  if (typeof document !== 'undefined') document.querySelectorAll('[data-earnings-explorer]').forEach(initialize);
})();
