(function () {
  "use strict";

  const explorer = document.getElementById("nba-explorer");
  const original = document.getElementById("nba-original-figure");
  if (!explorer || !original) return;

  const buttons = Array.from(explorer.querySelectorAll("[data-nba-view]"));
  const panels = Array.from(explorer.querySelectorAll("[data-nba-panel]"));
  const status = document.getElementById("nba-view-status");
  if (buttons.length !== 2 || panels.length !== 2) return;

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      const selected = button.dataset.nbaView;
      buttons.forEach(function (control) {
        control.setAttribute("aria-pressed", String(control === button));
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.dataset.nbaPanel !== selected;
      });
      if (status) status.textContent = selected === "change"
        ? "Showing the change in shot-attempt share."
        : "Showing both seasons on a shared scale.";
    });
  });

  original.hidden = true;
  explorer.hidden = false;
})();
