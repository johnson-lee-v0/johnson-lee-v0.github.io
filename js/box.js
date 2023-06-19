// After the loading animation is complete, navigate to the portfolio page
setTimeout(function () {
    window.location.href = "sneaker-portfolio.html";
  }, 2000); // Replace 2000 with the desired duration of the loading animation

// showcase script for demo example
const $ = (query) => document.querySelector(query)

const box = $(".box-bounced")

const widthRange = $("#width-range")
const widthNumber = $("#width-number")
const heightRange = $("#height-range")
const heightNumber = $("#height-number")
const lengthRange = $("#length-range")
const lengthNumber = $("#length-number")

function renderWidth(width = localStorage.width ?? 200) {
  localStorage.width = width
  widthRange.value = width
  widthNumber.value = width
  box.style.setProperty("--width", width + "px")
}

function renderHeight(height = localStorage.height ?? 200) {
  localStorage.height = height
  heightRange.value = height
  heightNumber.value = height
  box.style.setProperty("--height", height + "px")
}

function renderLength(length = localStorage.depth ?? 200) {
  localStorage.depth = length
  lengthRange.value = length
  lengthNumber.value = length
  box.style.setProperty("--length", length + "px")
}

function getVariant(width, height = width, length = width) {
  return () => {
    renderWidth(width)
    renderHeight(height)
    renderLength(length)
    restartAnimation()
  }
}

function restartAnimation() {
  box.classList.remove("animated")
  void box.offsetWidth // trigger a DOM reflow
  box.classList.add("animated")
}

function handleWidth(e) {
  renderWidth(e.target.value)
}

function handleHeight(e) {
  renderHeight(e.target.value)
}

function handleLength(e) {
  renderLength(e.target.value)
}

small.onclick = getVariant(80)
middle.onclick = getVariant(160)
large.onclick = getVariant(300)
tv.onclick = getVariant(700, 400, 50)
pissa.onclick = getVariant(300, 40, 300)
tall.onclick = getVariant(120, 500, 120)

box.onclick = restartAnimation

window.onload = () => {
  renderWidth()
  renderHeight()
  renderLength()
  box.classList.add("animated")
}

widthRange.oninput = handleWidth
heightRange.oninput = handleHeight
lengthRange.oninput = handleLength

widthNumber.oninput = handleWidth
heightNumber.oninput = handleHeight
lengthNumber.oninput = handleLength