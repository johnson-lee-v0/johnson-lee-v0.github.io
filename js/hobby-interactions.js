/* Purposeful interaction for the personal section; no autoplay or global input traps. */
(() => {
  const frameCache = new Map();
  let viewerCount = 0;
  const wrap = (value, length) => ((value % length) + length) % length;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function arrowIcon(direction) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", direction === "left" ? "M19 12H5m6-6-6 6 6 6" : "M5 12h14m-6-6 6 6-6 6");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
    return svg;
  }

  async function initializeTravelCarousel() {
    const root = document.getElementById("travel-carousel");
    if (!root || root.dataset.ready === "true") return;
    root.setAttribute("aria-busy", "true");

    try {
      const response = await fetch("./image/personal/travel/photos.json");
      if (!response.ok) throw new Error("Photo data unavailable");
      const photos = await response.json();
      if (!Array.isArray(photos) || photos.length !== 9) throw new Error("Expected nine photos");

      let current = 0;
      // Slot zero is always the featured print. The other eight form a full circle.
      // Selecting a print exchanges just those two slots, leaving its neighbours still.
      const slots = photos.map((_, index) => index);
      const stage = element("div", "travel-orbit-stage");
      const cards = [];
      const selectors = [];
      const controls = element("div", "travel-controls");
      const previous = element("button", "travel-step");
      previous.type = "button";
      previous.setAttribute("aria-label", "Previous travel photo");
      previous.append(arrowIcon("left"));
      const next = element("button", "travel-step");
      next.type = "button";
      next.setAttribute("aria-label", "Next travel photo");
      next.append(arrowIcon("right"));
      const pagination = element("div", "travel-pagination");
      pagination.setAttribute("role", "group");
      pagination.setAttribute("aria-label", "Choose a travel photo");
      const status = element("p", "sr-only");
      status.setAttribute("role", "status");
      const count = element("span", "travel-count", `1 / ${photos.length}`);
      count.setAttribute("aria-hidden", "true");

      photos.forEach((photo, index) => {
        const card = element("button", "polaroid");
        card.type = "button";
        card.setAttribute("aria-label", `Show ${photo.place}, ${photo.trip}`);
        const image = element("img", "polaroid-image");
        image.src = photo.src;
        image.alt = photo.alt;
        image.width = photo.width;
        image.height = photo.height;
        image.loading = "lazy";
        image.decoding = "async";
        image.draggable = false;
        const caption = element("span", "polaroid-caption");
        caption.append(
          element("strong", "polaroid-place", photo.place),
          element("span", "polaroid-trip", photo.trip)
        );
        card.dataset.photo = photo.id;
        card.append(image, caption);
        card.addEventListener("click", () => select(index));
        stage.append(card);
        cards.push(card);

        const selector = element("button", "travel-dot");
        selector.type = "button";
        selector.setAttribute("aria-label", `Photo ${index + 1} of ${photos.length}: ${photo.place}, ${photo.trip}`);
        selector.addEventListener("click", () => select(index));
        pagination.append(selector);
        selectors.push(selector);
      });

      function select(index) {
        current = wrap(index, photos.length);
        const selectedSlot = slots.indexOf(current);
        [slots[0], slots[selectedSlot]] = [slots[selectedSlot], slots[0]];
        cards.forEach((card, i) => {
          const slot = slots.indexOf(i);
          card.dataset.slot = String(slot);
          card.setAttribute("aria-pressed", String(slot === 0));
          // Named selectors also reach every print without aiming at overlapping edges.
          card.tabIndex = slot === 0 ? 0 : -1;
          selectors[i].setAttribute("aria-pressed", String(slot === 0));
        });
        count.textContent = `${current + 1} / ${photos.length}`;
        status.textContent = `Photo ${current + 1} of ${photos.length}. ${photos[current].place}. ${photos[current].trip}.`;
      }

      previous.addEventListener("click", () => select(current - 1));
      next.addEventListener("click", () => select(current + 1));
      root.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        select(current + (event.key === "ArrowRight" ? 1 : -1));
        if (event.target.classList.contains("polaroid")) cards[current].focus({ preventScroll: true });
      });

      let touch = null;
      let suppressClick = false;
      stage.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" || !event.isPrimary) return;
        touch = { x: event.clientX, y: event.clientY };
        suppressClick = false;
      });
      stage.addEventListener("pointerup", (event) => {
        if (!touch) return;
        const dx = event.clientX - touch.x;
        const dy = event.clientY - touch.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          suppressClick = true;
          select(current + (dx < 0 ? 1 : -1));
        }
        touch = null;
      });
      stage.addEventListener("pointercancel", () => { touch = null; });
      stage.addEventListener("click", (event) => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      }, true);

      controls.append(previous, pagination, next, count);
      root.replaceChildren(stage, controls, status);
      root.dataset.ready = "true";
      select(0);
    } catch {
      // Keep the real static photo and travel-log link if the data cannot load.
      if (!root.querySelector(".travel-retry")) {
        const retry = element("button", "travel-retry", "Retry photo carousel");
        retry.type = "button";
        retry.addEventListener("click", initializeTravelCarousel);
        root.append(retry);
      }
    } finally {
      root.removeAttribute("aria-busy");
    }
  }

  function loadFrame(url) {
    if (frameCache.has(url)) return frameCache.get(url);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      // Cache the URL, not a decoded Image for every angle of every pair.
      image.onload = () => resolve(image.src);
      image.onerror = () => reject(new Error("Angle image unavailable"));
      image.src = url;
    });
    frameCache.set(url, promise);
    promise.catch(() => frameCache.delete(url));
    return promise;
  }

  function createSneakerViewer(sneaker, { fallback = "./image/Jordan.png" } = {}) {
    const spin = window.SNEAKER_SPINS?.[sneaker.name];
    const root = element("div", `sneaker-viewer${spin ? "" : " is-static"}`);
    const stage = element(spin ? "button" : "div", "sneaker-spin-stage");
    const image = element("img", "sneaker-spin-image");
    image.src = sneaker.image;
    image.alt = sneaker.name;
    image.loading = "lazy";
    image.decoding = "async";
    image.draggable = false;
    image.addEventListener("error", () => {
      if (image.dataset.fallback) return;
      image.dataset.fallback = "true";
      image.src = fallback;
    });
    stage.append(image);
    root.append(stage);
    if (!spin) {
      root.append(element("p", "sneaker-static-note", "Single photo"));
      return root;
    }

    stage.type = "button";
    stage.setAttribute("aria-label", `Rotate ${sneaker.name} to the next angle`);
    const helpId = `sneaker-spin-help-${++viewerCount}`;
    const controls = element("div", "sneaker-spin-controls");
    const help = element("span", "sneaker-spin-help", "Drag to rotate · 360°");
    help.id = helpId;
    stage.setAttribute("aria-describedby", helpId);
    const angle = element("span", "sneaker-spin-angle", "0°");
    angle.setAttribute("aria-hidden", "true");
    const keyboardHelp = element("span", "sr-only", "Use left and right arrow keys to rotate, or Enter for the next angle.");
    help.append(keyboardHelp);
    const status = element("p", "sneaker-spin-status");
    status.setAttribute("role", "status");
    controls.append(help, angle);
    root.append(controls, status);

    let requested = 0;
    let requestId = 0;
    let queuedFrame = 0;
    let pointer = null;
    let dragged = false;
    const urlFor = (index) => {
      const frame = String(wrap(index, spin.frames) + 1).padStart(2, "0");
      return `https://images.stockx.com/360/${spin.slug}/Images/${spin.slug}/Lv2/img${frame}.jpg?auto=format,compress&w=720&q=80`;
    };

    async function display(index) {
      requested = wrap(index, spin.frames);
      const thisRequest = ++requestId;
      const target = requested;
      root.setAttribute("aria-busy", "true");
      status.textContent = "";
      try {
        const loaded = await loadFrame(urlFor(target));
        if (thisRequest !== requestId || !root.isConnected) return;
        image.src = loaded;
        image.alt = `${sneaker.name}, view ${target + 1} of ${spin.frames}`;
        image.dataset.frame = String(target + 1);
        angle.textContent = `${Math.round(target * 360 / spin.frames)}°`;
        // Nearby angles warm the cache; do not download every shoe's full set.
        [-1, 1].forEach((step) => { loadFrame(urlFor(target + step)).catch(() => {}); });
      } catch {
        if (thisRequest !== requestId || !root.isConnected) return;
        status.textContent = "That angle couldn't load. Try another angle.";
      } finally {
        if (thisRequest === requestId) root.removeAttribute("aria-busy");
      }
    }

    function queue(index) {
      requested = wrap(index, spin.frames);
      if (queuedFrame) return;
      queuedFrame = requestAnimationFrame(() => {
        queuedFrame = 0;
        if (root.isConnected) display(requested);
      });
    }

    stage.addEventListener("click", (event) => {
      if (dragged) { event.preventDefault(); dragged = false; return; }
      display(requested + 3);
    });
    stage.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const index = event.key === "Home" ? 0 : event.key === "End" ? spin.frames - 1 : requested + (event.key === "ArrowRight" ? 1 : -1);
      display(index);
    });
    stage.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, frame: requested };
      dragged = false;
    });
    stage.addEventListener("pointermove", (event) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      if ((event.buttons & 1) === 0) {
        stopDrag(event);
        dragged = false;
        return;
      }
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (!dragged && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 7) { pointer = null; return; }
      if (Math.abs(dx) < 5 && !dragged) return;
      dragged = true;
      stage.classList.add("is-dragging");
      stage.setPointerCapture(event.pointerId);
      const step = Math.max(4, stage.clientWidth / spin.frames);
      queue(pointer.frame + Math.round(dx / step));
    });
    function stopDrag(event) {
      if (!pointer || event.pointerId !== pointer.id) return;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      pointer = null;
      stage.classList.remove("is-dragging");
    }
    stage.addEventListener("pointerup", stopDrag);
    stage.addEventListener("pointercancel", (event) => { stopDrag(event); dragged = false; });
    stage.addEventListener("lostpointercapture", () => { pointer = null; stage.classList.remove("is-dragging"); });
    return root;
  }

  function initialize() {
    initializeTravelCarousel();
    const featured = document.getElementById("featured-sneaker");
    if (featured) featured.replaceChildren(createSneakerViewer({
      name: "Air Jordan 1 Retro High OG Visionaire",
      image: "./image/personal/visionaire.jpg"
    }));
  }

  window.PortfolioHobbies = Object.freeze({ createSneakerViewer, initialize });
})();
