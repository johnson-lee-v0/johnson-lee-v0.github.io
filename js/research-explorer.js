/* Historical Meta Q2 FY2026 inputs; hypothetical scenario, not company guidance. */
(function () {
  'use strict';

  const source = Object.freeze({ revenue: 60801, operatingProfit: 18775, period: 'Q2 FY2026', units: 'USD millions', periodEnd: '2026-06-30', released: '2026-07-29' });
  const defaultGrowth = 8;

  // Keep arithmetic independent of the DOM, so the example is easy to verify.
  function calculateScenario(growthPercent) {
    if (!Number.isFinite(growthPercent) || growthPercent < -10 || growthPercent > 30) {
      throw new RangeError('Growth must be a finite number between -10 and 30.');
    }
    const multiplier = 1 + growthPercent / 100;
    const margin = source.operatingProfit / source.revenue;
    const revenue = source.revenue * multiplier;
    const profit = revenue * margin;
    return { multiplier, revenue, margin, profit, change: profit - source.operatingProfit };
  }

  // A CommonJS export permits numerical tests without a browser or dependencies.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateScenario, source, defaultGrowth };
  }
  if (typeof document === 'undefined') return;

  const explorer = document.querySelector('[data-research-explorer]');
  if (!explorer) return;
  const slider = explorer.querySelector('#research-growth');
  const controls = explorer.querySelector('[data-research-controls]');
  const reset = explorer.querySelector('[data-research-reset]');
  const access = explorer.querySelector('[data-research-access]');
  const openNotice = explorer.querySelector('[data-research-open]');
  const dialog = explorer.querySelector('[data-research-dialog]');
  const acknowledgment = explorer.querySelector('[data-research-acknowledgment]');
  const checkbox = explorer.querySelector('#research-notice-checkbox');
  const accept = explorer.querySelector('[data-research-accept]');
  const cancel = explorer.querySelector('[data-research-cancel]');
  const dismiss = explorer.querySelector('[data-research-dismiss]');
  const noticeTitle = explorer.querySelector('#research-notice-title');
  const accessStatus = explorer.querySelector('#research-access-status');
  let acknowledged = false;
  const fields = {
    growth: explorer.querySelector('#research-growth-value'),
    multiplier: explorer.querySelector('#research-growth-math'),
    revenue: explorer.querySelector('#research-revenue'),
    profit: explorer.querySelector('#research-profit'),
    change: explorer.querySelector('#research-change'),
    formula: explorer.querySelector('#research-formula')
  };
  if ([slider, controls, reset, access, openNotice, dialog, acknowledgment, checkbox, accept, cancel, dismiss, noticeTitle, accessStatus, ...Object.values(fields)].some(field => !field)) return;

  function signed(value, decimals) {
    return (value > 0 ? '+' : value < 0 ? '−' : '') + format(Math.abs(value), decimals);
  }

  function format(value, decimals) {
    return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function render() {
    const growth = Number(slider.value);
    const result = calculateScenario(growth);
    fields.growth.textContent = signed(growth, 0) + '%';
    slider.setAttribute('aria-valuetext', signed(growth, 0) + ' percent revenue growth');
    fields.multiplier.textContent = '× ' + result.multiplier.toFixed(2);
    fields.revenue.textContent = format(result.revenue, 2);
    fields.profit.textContent = format(result.profit, 2);
    fields.change.textContent = signed(result.change, 2) + ' versus ' + source.period + "'s " + format(source.operatingProfit, 0) + ' ' + source.units;
    fields.formula.textContent = format(source.revenue, 0) + ' × ' + result.multiplier.toFixed(2) + ' × (' + format(source.operatingProfit, 0) + ' ÷ ' + format(source.revenue, 0) + ') = ' + format(result.profit, 2);
  }

  slider.addEventListener('input', function () {
    if (acknowledged) render();
  });
  reset.addEventListener('click', function () {
    if (!acknowledged) return;
    slider.value = String(defaultGrowth);
    render();
  });
  render();
  access.hidden = false;
  if (typeof dialog.showModal !== 'function') {
    openNotice.hidden = true;
    accessStatus.textContent = 'Read-only example. Your browser does not support the acknowledgment dialog.';
    return;
  }

  openNotice.addEventListener('click', function () {
    checkbox.checked = false;
    accept.disabled = true;
    dialog.showModal();
    noticeTitle.focus();
  });
  checkbox.addEventListener('change', function () {
    accept.disabled = !checkbox.checked;
  });
  acknowledgment.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!checkbox.checked) return;
    acknowledged = true;
    controls.hidden = false;
    slider.disabled = false;
    reset.disabled = false;
    access.hidden = true;
    dialog.close('acknowledged');
    slider.focus();
  });
  cancel.addEventListener('click', function () {
    dialog.close('read-only');
  });
  dismiss.addEventListener('click', function () {
    dialog.close('read-only');
  });
  // Native modal dialogs supply the focus trap and Escape-to-close behavior.
  dialog.addEventListener('close', function () {
    if (acknowledged) return;
    checkbox.checked = false;
    accept.disabled = true;
    openNotice.focus();
  });
}());
