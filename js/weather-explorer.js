(function () {
  "use strict";

  const explorer = document.getElementById("weather-explorer");
  if (!explorer || explorer.dataset.weatherInitialized === "true") return;

  const controls = document.getElementById("weather-controls");
  const status = document.getElementById("weather-status");
  const buttons = Array.from(explorer.querySelectorAll("[data-weather-station]"));
  const panels = Array.from(explorer.querySelectorAll("[data-weather-panel]"));
  const stationIds = ["NYC", "LAX", "DFW"];

  // Incomplete markup remains a readable three-station report.
  if (!controls || !status || buttons.length !== 3 || panels.length !== 3 ||
      stationIds.some(function (id) {
        const matchingButtons = buttons.filter(button => button.dataset.weatherStation === id);
        const matchingPanels = panels.filter(panel => panel.dataset.weatherPanel === id);
        return matchingButtons.length !== 1 || matchingPanels.length !== 1 ||
          matchingButtons[0].getAttribute("aria-controls") !== matchingPanels[0].id;
      })) return;

  let selected = null;
  function selectStation(id) {
    if (!stationIds.includes(id) || selected === id) return;
    selected = id;
    buttons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.weatherStation === id));
    });
    panels.forEach(function (panel) { panel.hidden = panel.dataset.weatherPanel !== id; });
    const active = panels.find(panel => panel.dataset.weatherPanel === id);
    status.textContent = "Showing " + active.dataset.weatherName +
      ". Two separate experiments; mean absolute error in degrees Fahrenheit. Lower is better.";
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () { selectStation(button.dataset.weatherStation); });
  });
  selectStation("NYC");
  explorer.dataset.weatherInitialized = "true";
  controls.hidden = false;
})();
