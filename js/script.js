document.documentElement.classList.replace("no-js", "js");

const PROJECTS = [
  {
    title: "NBA game outcomes",
    description: "Explored league-wide shot selection and modeled pregame and in-game win probabilities using historical context, chronological validation, and an interactive game replay.",
    image: "./image/Project_Cover/NBA-shot-locations.png",
    visualClass: "project-visual-nba",
    imageAlt: "Court heatmap showing changes in NBA shot-attempt share between the 2017–18 and 2025–26 regular seasons",
    caption: "How NBA shot locations shifted between 2017–18 and 2025–26.",
    link: "./projects/NBA_Games_Outcome.html",
    source: "https://github.com/johnson-lee-v0/NBA-Games-Outcome",
    origin: {
      title: "Boston Celtics Player Analysis",
      url: "https://github.com/johnson-lee-v0/Boston-Celtics-Player-Analysis"
    },
    tags: ["Python", "Sports analytics", "Predictive modeling"],
    featured: true
  },
  {
    title: "Max temperature modeling",
    description: "Compared next-day maximum-temperature forecasts using weather feature engineering, chronological validation, and regional models for New York, Los Angeles, and Dallas.",
    image: "./image/Project_Cover/Max-temperature-landscape.png",
    visualClass: "project-visual-temperature",
    imageAlt: "Monthly mean daily high temperatures for New York, Los Angeles, and Dallas–Fort Worth in 2024–2025",
    caption: "Three cities, different seasonal temperature patterns. Observations from 2024–2025.",
    link: "./projects/Max_Temperature.html",
    source: "https://github.com/johnson-lee-v0/Max-Temperature-Modeling",
    tags: ["Python", "Feature engineering", "Forecast modeling"]
  },
  {
    title: "University Twitter analysis",
    description: "Compared public posts from Waterloo, U of T, and Western using sentiment and entity analysis to explore how each university communicates online.",
    image: "./image/Project_Carousel/University Twitter Account Analysis/Slide3.JPG",
    visualClass: "project-visual-universities",
    imageAlt: "Three bar charts comparing common terms across Waterloo, U of T, and Western posts",
    caption: "Common terms across Waterloo, U of T, and Western posts.",
    link: "./projects/University_Twitter.html",
    source: "https://github.com/johnson-lee-v0/University-Twitter-Analysis",
    tags: ["R", "NLP", "Sentiment analysis", "Entity analysis"]
  },
  {
    title: "Blackjack simulator",
    description: "Built a six-deck blackjack simulator with a desktop interface, strategy tables, betting mechanics, SQLite event logging, and exploratory clustering.",
    image: "./image/Project_Cover/Blackjack-interface.png",
    imageAlt: "Playable blackjack interface showing cards, deck tally, controls, and strategy advice",
    caption: "The desktop interface, including cards and strategy advice.",
    link: "./projects/Blackjack.html",
    source: "https://github.com/johnson-lee-v0/BlackJackSim",
    tags: ["Python", "SQLite", "Desktop UI", "K-means"],
    compact: true
  }
];

const SNEAKER_IMAGES = {
  "Nike KD 7 Easter": "https://images.stockx.com/images/Nike-KD-7-Easter.jpg",
  "Nike Tanjun Black White": "https://images.stockx.com/images/nike-tanjun-black-white.jpg",
  "Nike Tanjun Game Royal": "https://images.stockx.com/images/Nike-Tanjun-Game-Royal-White-GS.png",
  "Air Jordan 1 High Skyline": "https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Skyline-Product.jpg",
  "Air Jordan 1 Retro High White Cement": "https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-White-Cement-Product.jpg",
  "Air Jordan 1 High OG Denim": "https://images.stockx.com/images/Air-Jordan-1-High-OG-Denim-W-Product.jpg",
  "Air Jordan 1 Retro High OG Visionaire": "https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Visionaire-Product.jpg",
  "Air Jordan 1 High Element Gore-Tex Berry": "https://images.stockx.com/360/Air-Jordan-1-High-Element-Gore-Tex-Berry/Images/Air-Jordan-1-High-Element-Gore-Tex-Berry/Lv2/img01.jpg?auto=format,compress&w=559&q=90&dpr=2",
  "Nike Air Force 1 Flyknit 2 Black Pure Platinum": "https://images.stockx.com/images/Nike-Air-Force-1-Flyknit-2-Black-Pure-Platinum-Product.jpg",
  "Jordan XXXIII University Red": "https://images.stockx.com/images/Air-Jordan-XXXIII-University-Red-Product.jpg",
  "Nike Air Max 270 Flyknit Laser Orange Blue Orbit": "https://images.stockx.com/360/Nike-Air-Max-270-Flyknit-Laser-Orange-Blue-Orbit/Images/Nike-Air-Max-270-Flyknit-Laser-Orange-Blue-Orbit/Lv2/img01.jpg?auto=format,compress&w=559&q=90&dpr=2",
  "Nike Air Max 270 Flyknit Bred": "https://images.stockx.com/images/Nike-Air-Max-270-Flyknit-Bred-Product.jpg",
  "Nike Epic React Flyknit 2 Blue Void": "https://images.stockx.com/images/Nike-Epic-React-Flyknit-2-Blue-Void-Product.jpg"
};

const SNEAKER_DATA = [
  { name: "Nike KD 7 Easter", brand: "Nike", year: 2015 },
  { name: "Nike Tanjun Black White", brand: "Nike", year: 2021 },
  { name: "Nike Tanjun Game Royal", brand: "Nike", year: 2018 },
  { name: "Air Jordan 1 High Skyline", brand: "Jordan", year: 2023 },
  { name: "Air Jordan 1 Retro High White Cement", brand: "Jordan", year: 2023 },
  { name: "Air Jordan 1 High OG Denim", brand: "Jordan", year: 2022 },
  { name: "Air Jordan 1 Retro High OG Visionaire", brand: "Jordan", year: 2022 },
  { name: "Air Jordan 1 High Element Gore-Tex Berry", brand: "Jordan", year: 2023 },
  { name: "Nike Air Force 1 Flyknit 2 Black Pure Platinum", brand: "Nike", year: 2021 },
  { name: "Jordan XXXIII University Red", brand: "Jordan", year: 2018 },
  { name: "Nike Air Max 270 Flyknit Laser Orange Blue Orbit", brand: "Nike", year: 2019 },
  { name: "Nike Air Max 270 Flyknit Bred", brand: "Nike", year: 2019 },
  { name: "Nike Epic React Flyknit 2 Blue Void", brand: "Nike", year: 2019 }
]
  .map((sneaker) => ({ ...sneaker, image: SNEAKER_IMAGES[sneaker.name] }))
  .sort((first, second) => second.year - first.year);

const FALLBACK_SNEAKER_IMAGE = "./image/Jordan.png";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const forcedColors = window.matchMedia("(forced-colors: active)");

let revealObserver;
let lastFocusedElement;
let activeModal = null;
let activeModalTrigger = null;

function createElement(tagName, { className, text, attributes = {} } = {}) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });

  return element;
}

function initializeHeroScrollWorld() {
  const hero = document.querySelector(".hero");
  const heroSticky = hero?.querySelector(".hero-sticky");
  const canvas = document.getElementById("persona-canvas");
  const canvasWrap = document.getElementById("persona-canvas-wrap");
  const motionToggle = document.getElementById("persona-motion-toggle");
  const primaryNav = document.querySelector("nav");
  const sequenceTrigger = document.getElementById("hero-sequence-trigger");
  const sequenceLabel = sequenceTrigger?.querySelector("[data-scroll-cue-label]");
  const heroExitTrigger = hero?.querySelector("[data-hero-exit]");
  const workSection = document.getElementById("work");
  const stageLight = hero?.querySelector(".orb-3");

  const scrollToWork = (behavior = "smooth") => {
    workSection?.scrollIntoView({ behavior, block: "start" });
  };

  if (!hero || !heroSticky || !canvas || !canvasWrap || typeof window.createPersonaRenderer !== "function") {
    hero?.classList.add("is-ambient-paused");
    hero?.classList.add("is-persona-fallback");

    if (motionToggle) {
      motionToggle.hidden = true;
    }

    if (sequenceTrigger && sequenceLabel) {
      sequenceTrigger.disabled = false;
      sequenceLabel.textContent = "Continue to portfolio";
      sequenceTrigger.setAttribute("aria-label", "Continue to the portfolio");
    }

    sequenceTrigger?.addEventListener("click", () => scrollToWork("smooth"));

    return;
  }

  let renderer = null;

  try {
    renderer = window.createPersonaRenderer(canvas);
  } catch (error) {
    console.warn(error);
  }

  if (!renderer) {
    hero.classList.add("is-ambient-paused");
    hero.classList.add("is-persona-fallback");
    if (motionToggle) {
      motionToggle.hidden = true;
    }
    if (sequenceTrigger && sequenceLabel) {
      sequenceTrigger.disabled = false;
      sequenceLabel.textContent = "Continue to portfolio";
      sequenceTrigger.setAttribute("aria-label", "Continue to the portfolio");
    }
    sequenceTrigger?.addEventListener("click", () => scrollToWork("smooth"));
    return;
  }

  hero.classList.remove("is-persona-fallback");
  hero.classList.toggle("is-persona-svg-fallback", Boolean(renderer.fallback));

  let canvasWidth = 0;
  let canvasHeight = 0;
  let pixelRatio = 0;
  let scrollProgress = 0;
  let animationTime = 0;
  let sequenceProgress = 0;
  let lastTimestamp = 0;
  let animationFrameId = 0;
  let scrollFrameId = 0;
  let resizeFrameId = 0;
  let userPaused = false;
  let contextAvailable = true;
  let scrollWorldCapable = false;
  let scrollWorldState = "idle";
  let introCompleted = false;
  let exitRequested = false;
  let exitRequestedByHeroTrigger = false;
  let scrollWorldElapsed = 0;
  let wheelIntent = 0;
  let wheelIntentTimer = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchTracking = false;
  let workHandoffActive = false;
  let boundaryReturnModifier = "";
  const latchedHeroNavigationKeys = new Set();
  let hasExitedHeroAfterComplete = false;
  let lastStageLightState = "";
  const rendererNeedsFrameLoop = renderer.needsFrameLoop !== false;
  const hasVisibilityObserver = "IntersectionObserver" in window;
  const initialHeroRect = hero.getBoundingClientRect();
  let isHeroVisible = hasVisibilityObserver
    ? false
    : initialHeroRect.bottom > -80 && initialHeroRect.top < window.innerHeight + 80;

  const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
  const smoother01 = (value) => {
    const progress = clamp(value);
    return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
  };
  const WALK_DURATION = 2.8;
  // The walk remains the original 2.8 seconds. The independent exit gets the
  // remaining beat from the earlier five-second scroll-world pacing.
  const SCATTER_DURATION = 2.2;
  // Begin the section handoff during the scatter's visible fade, ahead of the
  // final alpha cutoff at 0.86, so the page moves while the last dots remain.
  const WORK_HANDOFF_PROGRESS = 0.52;

  function supportsScrollWorld() {
    return contextAvailable
      && !renderer.fallback
      && !reducedMotion.matches
      && !forcedColors.matches
      && window.getComputedStyle(heroSticky).position === "sticky"
      && hero.offsetHeight - window.innerHeight >= 180;
  }

  function ownsHeroViewport() {
    if (!scrollWorldCapable || scrollWorldState !== "idle") {
      return false;
    }

    const rect = hero.getBoundingClientRect();
    return rect.top <= 8
      && rect.top >= -48
      && rect.bottom >= window.innerHeight * 0.9;
  }

  function canStartScrollWorld() {
    return ownsHeroViewport() && sequenceProgress >= 0.999;
  }

  function updateScrollWorldCue() {
    const isRunning = scrollWorldState === "running";
    const isComplete = scrollWorldState === "complete";
    const isIntroRunning = contextAvailable
      && !renderer.fallback
      && !reducedMotion.matches
      && !forcedColors.matches
      && scrollWorldState === "idle"
      && sequenceProgress < 0.999;
    const isIntroPaused = isIntroRunning && userPaused;

    hero.classList.toggle("is-scroll-world-running", isRunning);
    hero.classList.toggle("is-scroll-world-complete", isComplete);
    hero.classList.toggle("is-scroll-world-intro", isIntroRunning);
    hero.classList.toggle(
      "is-scroll-world-ready",
      scrollWorldCapable && scrollWorldState === "idle" && !isIntroRunning
    );

    if (!sequenceTrigger || !sequenceLabel) {
      return;
    }

    sequenceTrigger.disabled = isComplete || isIntroRunning;
    sequenceLabel.textContent = isRunning
      ? "Skip particle transition"
      : (isComplete
          ? "Opening portfolio…"
          : (isIntroRunning
              ? (isIntroPaused
                  ? "Walk paused"
                  : (exitRequested ? "Finishing walk…" : "Walking on stage…"))
              : (scrollWorldCapable ? "Scroll once to continue" : "Continue to portfolio")));
    sequenceTrigger.setAttribute(
      "aria-label",
      isRunning
        ? "Skip the particle transition and continue to the portfolio"
        : (isComplete
            ? "Opening the portfolio"
            : (isIntroRunning
                ? (isIntroPaused
                    ? "The persona walk is paused"
                    : (exitRequested
                        ? "The persona is finishing the walk before continuing"
                        : "The persona is walking onto the stage"))
                : (scrollWorldCapable
                    ? "Continue to the portfolio with the particle transition"
                    : "Continue to the portfolio")))
    );
  }

  function requestExitAfterIntro({ explicitHeroExit = false } = {}) {
    if (explicitHeroExit) {
      exitRequestedByHeroTrigger = true;
    }

    if (userPaused) {
      // A paused entrance cannot finish its queued walk. Treat the deliberate
      // down gesture as a skip to the settled pose, then run only the exit.
      exitRequested = false;
      sequenceProgress = 1;
      introCompleted = true;
      animationTime = Math.max(animationTime, WALK_DURATION);
      updateScrollWorldCue();
      startScrollWorld({ explicitHeroExit: exitRequestedByHeroTrigger });
      return;
    }

    if (exitRequested) {
      return;
    }

    exitRequested = true;
    updateScrollWorldCue();
  }

  function updateStageLight(resolvedSequence) {
    if (!stageLight || !canvasWidth || !canvasHeight) {
      return;
    }

    const entry = clamp(resolvedSequence);
    const approach = entry * entry * (3 - 2 * entry);
    const compact = canvasWidth <= 700;
    const anchor = typeof renderer.getFigureAnchor === "function"
      ? renderer.getFigureAnchor(entry)
      : {
          x: canvasWidth * (compact ? 0.61 : 0.74),
          y: canvasHeight * (compact ? 0.9 : 0.92),
          approach: 1
        };
    const lightExit = 1 - clamp((scrollProgress - 0.24) / 0.46);
    const opacity = forcedColors.matches
      ? 0
      : (0.42 + 0.48 * anchor.approach) * lightExit;
    const widthScale = 0.58 + 0.42 * anchor.approach;
    const state = [
      anchor.x.toFixed(2),
      anchor.y.toFixed(2),
      widthScale.toFixed(3),
      opacity.toFixed(3)
    ].join("|");

    if (state !== lastStageLightState) {
      stageLight.style.transform = `translate3d(${anchor.x.toFixed(2)}px, ${anchor.y.toFixed(2)}px, 0) scaleX(${widthScale.toFixed(3)})`;
      stageLight.style.opacity = opacity.toFixed(3);
      lastStageLightState = state;
    }

    hero.classList.toggle(
      "is-stage-settled",
      anchor.approach > 0.999 && scrollProgress < 0.001
    );
  }

  function shouldAnimate() {
    return contextAvailable
      && (isHeroVisible || scrollWorldState === "running")
      && !document.hidden
      && !reducedMotion.matches
      && !forcedColors.matches
      && (!userPaused || scrollWorldState === "running")
      && scrollWorldState !== "complete"
      && !renderer.fallback;
  }

  function updateScrollState() {
    hero.style.setProperty("--hero-grid-shift", (scrollProgress * 34) + "px");
  }

  function renderPersona() {
    const useStaticPose = reducedMotion.matches
      || forcedColors.matches
      || renderer.fallback;
    const resolvedSequence = useStaticPose
      ? 1
      : sequenceProgress;
    const resolvedScroll = useStaticPose ? 0 : scrollProgress;
    updateStageLight(resolvedSequence);
    const rendered = renderer.render({
      time: reducedMotion.matches ? 0.45 : animationTime,
      scrollProgress: resolvedScroll,
      sequenceProgress: resolvedSequence,
      motion: !reducedMotion.matches && !forcedColors.matches
    });

    if (rendered) {
      if (!canvasWrap.classList.contains("is-ready")) {
        canvasWrap.classList.add("is-ready");
      }
    } else {
      canvasWrap.classList.remove("is-ready");
    }

    return rendered;
  }

  function resizeCanvas() {
    const rect = canvasWrap.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const nextPixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth <= 700 ? 1 : 1.5);

    if (width === canvasWidth && height === canvasHeight && nextPixelRatio === pixelRatio) {
      return;
    }

    canvasWidth = width;
    canvasHeight = height;
    pixelRatio = nextPixelRatio;
    renderer.resize(width, height, pixelRatio);
    const wasScrollWorldCapable = scrollWorldCapable;
    scrollWorldCapable = supportsScrollWorld();

    if (wasScrollWorldCapable && !scrollWorldCapable && scrollWorldState === "running") {
      completeScrollWorld({ navigate: false });
      scrollToWork("auto");
    } else if (wasScrollWorldCapable && !scrollWorldCapable && exitRequested) {
      exitRequested = false;
      exitRequestedByHeroTrigger = false;
      sequenceProgress = 1;
      introCompleted = true;
      animationTime = Math.max(animationTime, WALK_DURATION);
      updateScrollWorldCue();
      scrollToWork("auto");
    } else if (wasScrollWorldCapable !== scrollWorldCapable) {
      updateScrollWorldCue();
    }

    updateScrollState();
    renderPersona();
  }

  function queueResize() {
    if (resizeFrameId) {
      return;
    }

    resizeFrameId = window.requestAnimationFrame(() => {
      resizeFrameId = 0;
      resizeCanvas();
      queueScrollUpdate();
    });
  }

  function stopAnimation(renderLastFrame = true) {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }

    lastTimestamp = 0;

    if (renderLastFrame && isHeroVisible && !document.hidden) {
      renderPersona();
    }
  }

  function animate(timestamp) {
    animationFrameId = 0;

    if (!shouldAnimate()) {
      return;
    }

    const compactRenderer = canvasWidth <= 700;
    const targetFps = compactRenderer
      ? (sequenceProgress < 1 ? 30 : 24)
      : 60;
    const minimumFrameInterval = 1000 / targetFps;

    if (!lastTimestamp) {
      lastTimestamp = timestamp - minimumFrameInterval;
    }

    if (timestamp - lastTimestamp < minimumFrameInterval - 0.75) {
      animationFrameId = window.requestAnimationFrame(animate);
      return;
    }

    const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;
    animationTime += delta;

    if (scrollWorldState === "idle" && sequenceProgress < 1) {
      // Preserve the original entrance timing: one linear 2.8-second walk-in
      // on page load, independent from the later scroll-triggered exit.
      sequenceProgress = Math.min(1, sequenceProgress + delta / WALK_DURATION);

      if (sequenceProgress >= 1 && !introCompleted) {
        introCompleted = true;
        updateScrollWorldCue();

        if (exitRequested) {
          startScrollWorld({ explicitHeroExit: exitRequestedByHeroTrigger });
          return;
        }
      }
    }

    if (scrollWorldState === "running") {
      scrollWorldElapsed = Math.min(SCATTER_DURATION, scrollWorldElapsed + delta);
      sequenceProgress = 1;
      scrollProgress = smoother01(scrollWorldElapsed / SCATTER_DURATION);
      updateScrollState();

      if (scrollProgress >= WORK_HANDOFF_PROGRESS) {
        beginWorkHandoff();
      }
    }

    renderPersona();

    if (scrollWorldState === "running" && scrollWorldElapsed >= SCATTER_DURATION) {
      completeScrollWorld();
      return;
    }

    animationFrameId = window.requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (rendererNeedsFrameLoop && !animationFrameId && shouldAnimate()) {
      lastTimestamp = 0;
      animationFrameId = window.requestAnimationFrame(animate);
    }
  }

  function resetScrollWorld() {
    workHandoffActive = false;
    scrollWorldState = "idle";
    hasExitedHeroAfterComplete = false;
    scrollWorldElapsed = 0;
    scrollProgress = 0;
    sequenceProgress = 1;
    introCompleted = true;
    exitRequested = false;
    exitRequestedByHeroTrigger = false;
    wheelIntent = 0;
    updateScrollState();
    updateScrollWorldCue();
    renderPersona();
    refreshMotionState();
  }

  function cancelScrollWorld() {
    workHandoffActive = false;
    scrollWorldState = "idle";
    hasExitedHeroAfterComplete = false;
    scrollWorldElapsed = 0;
    scrollProgress = 0;
    sequenceProgress = 1;
    introCompleted = true;
    exitRequested = false;
    exitRequestedByHeroTrigger = false;
    wheelIntent = 0;
    updateScrollState();
    updateScrollWorldCue();
    renderPersona();
    refreshMotionState();
  }

  function completeScrollWorld({ navigate = true } = {}) {
    if (scrollWorldState === "complete") {
      return;
    }

    const navigationAlreadyStarted = navigate && workHandoffActive;

    if (!navigate && workHandoffActive) {
      jumpToScrollPosition(window.scrollY);
    }

    scrollWorldState = "complete";
    workHandoffActive = navigate;
    hasExitedHeroAfterComplete = window.scrollY > 80
      || hero.getBoundingClientRect().top < -80;
    scrollWorldElapsed = SCATTER_DURATION;
    sequenceProgress = 1;
    introCompleted = true;
    exitRequested = false;
    exitRequestedByHeroTrigger = false;
    scrollProgress = 1;
    wheelIntent = 0;
    updateScrollState();
    updateScrollWorldCue();
    renderPersona();
    refreshMotionState();

    if (navigate && !navigationAlreadyStarted) {
      scrollToWork("smooth");
    }

    queueScrollUpdate();
  }

  function beginWorkHandoff() {
    if (
      workHandoffActive
      || scrollWorldState !== "running"
      || !workSection
    ) {
      return;
    }

    workHandoffActive = true;
    scrollToWork("smooth");
  }

  function startScrollWorld({ explicitHeroExit = false } = {}) {
    const canStartExplicitExit = explicitHeroExit
      && scrollWorldCapable
      && scrollWorldState === "idle"
      && sequenceProgress >= 0.999;

    if (!canStartScrollWorld() && !canStartExplicitExit) {
      exitRequested = false;
      exitRequestedByHeroTrigger = false;
      scrollToWork(reducedMotion.matches ? "auto" : "smooth");
      return;
    }

    workHandoffActive = false;
    scrollWorldState = "running";
    hasExitedHeroAfterComplete = false;
    scrollWorldElapsed = 0;
    scrollProgress = 0;
    sequenceProgress = 1;
    introCompleted = true;
    exitRequested = false;
    exitRequestedByHeroTrigger = false;
    wheelIntent = 0;
    updateScrollState();
    updateScrollWorldCue();
    renderPersona();
    refreshMotionState();
    startAnimation();
  }

  function refreshMotionState() {
    const animationActive = shouldAnimate();

    hero.classList.toggle("is-ambient-paused", !animationActive);
    if (typeof renderer.setPaused === "function") {
      renderer.setPaused(!animationActive);
    }
    if (motionToggle) {
      motionToggle.hidden = reducedMotion.matches || forcedColors.matches || renderer.fallback || !contextAvailable;
      motionToggle.disabled = scrollWorldState === "running";
      motionToggle.textContent = userPaused ? "Resume animation" : "Pause animation";
    }

    if (animationActive && rendererNeedsFrameLoop) {
      startAnimation();
    } else {
      stopAnimation(!forcedColors.matches);
    }
  }

  function queueScrollUpdate() {
    if (scrollFrameId) {
      return;
    }

    scrollFrameId = window.requestAnimationFrame(() => {
      scrollFrameId = 0;

      if (!hasVisibilityObserver) {
        const rect = hero.getBoundingClientRect();
        const wasHeroVisible = isHeroVisible;
        isHeroVisible = rect.bottom > -80 && rect.top < window.innerHeight + 80;

        if (isHeroVisible !== wasHeroVisible) {
          refreshMotionState();
        }
      }

      updateScrollState();

      if (
        scrollWorldState === "complete"
        && (window.scrollY > 80 || hero.getBoundingClientRect().top < -80)
      ) {
        hasExitedHeroAfterComplete = true;
      }

      if (workHandoffActive && hasExitedHeroAfterComplete && workSection) {
        const workScrollMargin = Number.parseFloat(
          window.getComputedStyle(workSection).scrollMarginTop
        ) || 0;

        if (workSection.getBoundingClientRect().top <= workScrollMargin + 8) {
          workHandoffActive = false;
        }
      }

      if (
        scrollWorldState === "complete"
        && hasExitedHeroAfterComplete
        && heroSticky.getBoundingClientRect().top >= -2
      ) {
        resetScrollWorld();
        return;
      }

      if (rendererNeedsFrameLoop && !shouldAnimate() && isHeroVisible && !document.hidden && !forcedColors.matches) {
        renderPersona();
      }
    });
  }

  motionToggle?.addEventListener("click", () => {
    userPaused = !userPaused;

    if (userPaused && exitRequested) {
      requestExitAfterIntro();
      return;
    }

    updateScrollWorldCue();
    refreshMotionState();
  });

  sequenceTrigger?.addEventListener("click", () => {
    if (scrollWorldState === "running") {
      completeScrollWorld();
    } else {
      startScrollWorld();
    }
  });

  heroExitTrigger?.addEventListener("click", (event) => {
    if (!scrollWorldCapable) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (scrollWorldState !== "idle") {
      return;
    }

    if (sequenceProgress >= 0.999) {
      startScrollWorld({ explicitHeroExit: true });
    } else {
      requestExitAfterIntro({ explicitHeroExit: true });
    }
  });

  function handleScrollWorldWheel(event) {
    if (scrollWorldState === "running") {
      event.preventDefault();
      return;
    }

    if (event.ctrlKey || !ownsHeroViewport()) {
      return;
    }

    const unit = event.deltaMode === 1
      ? 16
      : (event.deltaMode === 2 ? window.innerHeight : 1);
    const delta = event.deltaY * unit;

    if (delta <= 0) {
      wheelIntent = 0;
      return;
    }

    event.preventDefault();

    wheelIntent += delta;
    window.clearTimeout(wheelIntentTimer);
    wheelIntentTimer = window.setTimeout(() => {
      wheelIntent = 0;
    }, 180);

    if (wheelIntent < 22) {
      return;
    }

    wheelIntent = 0;

    // The entrance owns this moment. A fresh gesture after the settled wave
    // starts the exit; only the explicit hero CTA may queue it early.
    if (sequenceProgress < 0.999) {
      return;
    }

    startScrollWorld();
  }

  hero.addEventListener("wheel", handleScrollWorldWheel, { passive: false });
  primaryNav?.addEventListener("wheel", handleScrollWorldWheel, { passive: false });

  function handleScrollWorldTouchStart(event) {
    if (event.touches.length !== 1) {
      touchTracking = false;
      return;
    }

    touchTracking = true;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }

  function handleScrollWorldTouchMove(event) {
    if (scrollWorldState === "running") {
      event.preventDefault();
      return;
    }

    if (!touchTracking || event.touches.length !== 1 || !ownsHeroViewport()) {
      return;
    }

    const deltaX = event.touches[0].clientX - touchStartX;
    const deltaY = touchStartY - event.touches[0].clientY;

    if (deltaY > 0 && deltaY >= Math.abs(deltaX)) {
      event.preventDefault();

      if (deltaY >= 18) {
        touchTracking = false;

        if (sequenceProgress >= 0.999) {
          startScrollWorld();
        }
      }
    }
  }

  function stopScrollWorldTouchTracking() {
    touchTracking = false;
  }

  [hero, primaryNav].filter(Boolean).forEach((touchSurface) => {
    touchSurface.addEventListener("touchstart", handleScrollWorldTouchStart, { passive: true });
    touchSurface.addEventListener("touchmove", handleScrollWorldTouchMove, { passive: false });
    touchSurface.addEventListener("touchend", stopScrollWorldTouchTracking, { passive: true });
    touchSurface.addEventListener("touchcancel", stopScrollWorldTouchTracking, { passive: true });
  });

  function guardRunningWorkHandoff(event) {
    if (scrollWorldState === "running" && workHandoffActive) {
      event.preventDefault();
    }
  }

  // Once Work begins entering the viewport, input events no longer target the
  // hero's own listeners. Keep inertial wheel/touch input from interrupting the
  // single-gesture handoff while the remaining persona particles fade.
  document.addEventListener("wheel", guardRunningWorkHandoff, {
    capture: true,
    passive: false
  });
  document.addEventListener("touchmove", guardRunningWorkHandoff, {
    capture: true,
    passive: false
  });

  function jumpToScrollPosition(top, { stabilize = false } = {}) {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const resolvedTop = Math.max(0, top);
    const settlePosition = () => {
      window.scrollTo({ top: resolvedTop, left: window.scrollX, behavior: "auto" });
      root.scrollTop = resolvedTop;
      document.body.scrollTop = resolvedTop;
    };

    // Override the global smooth-scroll rule long enough to cancel any native
    // animation already in flight. Hero returns reassert the target across two
    // frames; direct navigation can then immediately choose a different target.
    root.style.setProperty("scroll-behavior", "auto", "important");
    settlePosition();

    if (!stabilize) {
      window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
      return;
    }

    window.requestAnimationFrame(() => {
      settlePosition();
      window.requestAnimationFrame(() => {
        settlePosition();
        root.style.scrollBehavior = previousScrollBehavior;
      });
    });
  }

  function returnToHeroFromNavigation() {
    // Returning is atomic: land at the hero before restoring the waving pose,
    // so no key event can see a completed world at scrollY 0.
    jumpToScrollPosition(0, { stabilize: true });
    resetScrollWorld();
  }

  function stopWorkHandoff() {
    workHandoffActive = false;
    jumpToScrollPosition(window.scrollY);
  }

  function navigateToHashAfterHandoff(targetHash) {
    const target = targetHash ? document.querySelector(targetHash) : null;

    if (!target) {
      return;
    }

    // Run after the current-position cancellation has restored normal scroll
    // behavior, preventing the superseded Work handoff from winning the race.
    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: reducedMotion.matches || forcedColors.matches ? "auto" : "smooth",
        block: "start"
      });

      if (window.location.hash !== targetHash) {
        window.history.pushState(null, "", targetHash);
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isEditableTarget = target instanceof Element
      && Boolean(target.closest("input, textarea, select, [contenteditable]"));
    const preservesSpaceActivation = event.key === " "
      && target instanceof Element
      && Boolean(target.closest("button, summary, [role='button']"));
    const isDownNavigation = event.key === "ArrowDown"
      || event.key === "PageDown"
      || (event.key === " " && !event.shiftKey);
    const isUpNavigation = event.key === "ArrowUp"
      || event.key === "PageUp"
      || event.key === "Home"
      || (event.key === " " && event.shiftKey);
    const isDocumentStartShortcut = (event.metaKey && event.key === "ArrowUp")
      || (event.ctrlKey && event.key === "Home");
    const isDocumentEndShortcut = (event.metaKey && event.key === "ArrowDown")
      || (event.ctrlKey && event.key === "End");
    if (
      event.defaultPrevented
      || event.isComposing
      || event.altKey
      || isEditableTarget
    ) {
      return;
    }

    if (
      latchedHeroNavigationKeys.has(event.key)
      && event.repeat
    ) {
      event.preventDefault();
      return;
    }

    if (
      boundaryReturnModifier
      && (event.metaKey || event.ctrlKey)
      && (isDocumentStartShortcut || isDocumentEndShortcut)
    ) {
      event.preventDefault();
      latchedHeroNavigationKeys.add(event.key);
      return;
    }

    if (
      (isDocumentStartShortcut || isDocumentEndShortcut)
      && (
        scrollWorldState === "running"
        || workHandoffActive
        || (isDocumentEndShortcut && ownsHeroViewport())
      )
    ) {
      event.preventDefault();
      latchedHeroNavigationKeys.add(event.key);

      if (isDocumentStartShortcut) {
        boundaryReturnModifier = event.metaKey ? "Meta" : "Control";
        returnToHeroFromNavigation();
      } else if (scrollWorldState === "running") {
        completeScrollWorld();
      } else if (ownsHeroViewport() && sequenceProgress >= 0.999 && !event.repeat) {
        startScrollWorld();
      }

      return;
    }

    if (event.ctrlKey || event.metaKey) {
      return;
    }

    if (scrollWorldState === "running") {
      if (event.key === "Escape") {
        event.preventDefault();
        returnToHeroFromNavigation();
      } else if (event.key === "End") {
        event.preventDefault();
        latchedHeroNavigationKeys.add(event.key);
        completeScrollWorld();
      } else if (isUpNavigation && !preservesSpaceActivation) {
        event.preventDefault();
        latchedHeroNavigationKeys.add(event.key);
        returnToHeroFromNavigation();
      } else if (isDownNavigation && !preservesSpaceActivation) {
        event.preventDefault();
        latchedHeroNavigationKeys.add(event.key);
      }
      return;
    }

    if (workHandoffActive && scrollWorldState === "complete") {
      if (event.key === "Escape") {
        event.preventDefault();
        returnToHeroFromNavigation();
      } else if (event.key === "End") {
        event.preventDefault();
        latchedHeroNavigationKeys.add(event.key);
      } else if (isUpNavigation && !preservesSpaceActivation) {
        event.preventDefault();
        latchedHeroNavigationKeys.add(event.key);
        returnToHeroFromNavigation();
      } else if (isDownNavigation && !preservesSpaceActivation) {
        event.preventDefault();
        latchedHeroNavigationKeys.add(event.key);
      }
      return;
    }

    if (isDownNavigation && !preservesSpaceActivation && ownsHeroViewport()) {
      event.preventDefault();

      if (!event.repeat && sequenceProgress >= 0.999) {
        latchedHeroNavigationKeys.add(event.key);
        startScrollWorld();
      }
    }
  });

  document.addEventListener("keyup", (event) => {
    latchedHeroNavigationKeys.delete(event.key);

    if (event.key === boundaryReturnModifier) {
      boundaryReturnModifier = "";
    }
  });

  window.addEventListener("blur", () => {
    latchedHeroNavigationKeys.clear();
    boundaryReturnModifier = "";
  });

  document.addEventListener("click", (event) => {
    const hashLink = event.target instanceof Element
      ? event.target.closest("a[href^='#']")
      : null;

    if (!hashLink) {
      return;
    }

    const targetHash = hashLink.getAttribute("href");

    if (scrollWorldState === "running") {
      if (targetHash === "#about") {
        cancelScrollWorld();
      } else {
        event.preventDefault();
        completeScrollWorld({ navigate: false });
        navigateToHashAfterHandoff(targetHash);
      }
    } else if (scrollWorldState === "complete") {
      if (targetHash === "#about") {
        event.preventDefault();
        returnToHeroFromNavigation();
      } else {
        event.preventDefault();
        stopWorkHandoff();
        navigateToHashAfterHandoff(targetHash);
      }
    } else if (
      scrollWorldState === "idle"
      && exitRequested
      && targetHash === "#about"
    ) {
      exitRequested = false;
      exitRequestedByHeroTrigger = false;
      updateScrollWorldCue();
    } else if (
      scrollWorldState === "idle"
      && targetHash !== "#about"
      && sequenceProgress < 1
    ) {
      // A direct navigation ends the one-time intro rather than replaying it
      // when the user later returns to About.
      sequenceProgress = 1;
      introCompleted = true;
      exitRequested = false;
      exitRequestedByHeroTrigger = false;
      animationTime = Math.max(animationTime, WALK_DURATION);
      updateScrollWorldCue();
      renderPersona();
    }
  });

  if (hasVisibilityObserver) {
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isHeroVisible = entry.isIntersecting;

      refreshMotionState();
    }, { rootMargin: "80px 0px" });

    visibilityObserver.observe(canvasWrap);
  }

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(queueResize);
    resizeObserver.observe(canvasWrap);
  }

  window.addEventListener("resize", queueResize, { passive: true });
  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  document.addEventListener("visibilitychange", refreshMotionState);

  canvas.addEventListener("webglcontextlost", () => {
    contextAvailable = false;
    scrollWorldCapable = false;
    if (scrollWorldState === "running") {
      completeScrollWorld({ navigate: false });
      scrollToWork("auto");
    } else if (exitRequested) {
      exitRequested = false;
      exitRequestedByHeroTrigger = false;
      sequenceProgress = 1;
      introCompleted = true;
      animationTime = Math.max(animationTime, WALK_DURATION);
      scrollToWork("auto");
    }
    hero.classList.add("is-persona-fallback");
    canvasWrap.classList.remove("is-ready");
    lastStageLightState = "";
    updateStageLight(1);
    updateScrollWorldCue();
    stopAnimation(false);
    refreshMotionState();
  });

  canvas.addEventListener("webglcontextrestored", () => {
    contextAvailable = true;
    pixelRatio = 0;
    resizeCanvas();

    if (!renderPersona()) {
      contextAvailable = false;
    } else {
      hero.classList.remove("is-persona-fallback");
    }

    refreshMotionState();
  });

  function handleMotionPreferenceChange() {
    scrollWorldCapable = supportsScrollWorld();

    if (!scrollWorldCapable && scrollWorldState === "running") {
      sequenceProgress = 1;
      introCompleted = true;
      completeScrollWorld({ navigate: false });
      scrollToWork("auto");
      return;
    }

    if (scrollWorldState === "idle") {
      scrollProgress = 0;

      if (reducedMotion.matches || forcedColors.matches || renderer.fallback) {
        sequenceProgress = 1;
        introCompleted = true;
      }
    }

    if (introCompleted) {
      sequenceProgress = 1;
      animationTime = Math.max(animationTime, WALK_DURATION);
    }

    const shouldHonorQueuedExit = exitRequested && !scrollWorldCapable;
    if (shouldHonorQueuedExit) {
      exitRequested = false;
      exitRequestedByHeroTrigger = false;
    }

    updateScrollState();
    updateScrollWorldCue();
    renderPersona();
    refreshMotionState();

    if (shouldHonorQueuedExit) {
      scrollToWork("auto");
    }
  }

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleMotionPreferenceChange);
  }

  if (typeof forcedColors.addEventListener === "function") {
    forcedColors.addEventListener("change", handleMotionPreferenceChange);
  }

  if (reducedMotion.matches || forcedColors.matches || renderer.fallback) {
    sequenceProgress = 1;
    introCompleted = true;
    animationTime = WALK_DURATION;
  }

  resizeCanvas();
  updateScrollState();
  updateScrollWorldCue();
  refreshMotionState();
}

function initializeRevealAnimations() {
  document.querySelectorAll(".work-grid, .projects-grid, .hobbies-grid").forEach((grid) => {
    grid.querySelectorAll(".reveal").forEach((element, index) => {
      element.style.setProperty("--reveal-delay", Math.min(index * 70, 210) + "ms");
    });
  });

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
    return;
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
}

function observeReveal(element) {
  if (revealObserver) {
    revealObserver.observe(element);
  } else {
    element.classList.add("visible");
  }
}

function renderProjects() {
  const grid = document.getElementById("projects-grid");
  const fragment = document.createDocumentFragment();

  PROJECTS.forEach((project) => {
    const card = createElement("article", {
      className: `project-card${project.featured ? " project-card-featured" : ""}${project.compact ? " project-card-compact" : ""} reveal`
    });
    const image = createElement("img", {
      attributes: {
        src: project.image,
        alt: project.imageAlt || `${project.title} project cover`,
        loading: "lazy",
        decoding: "async"
      }
    });
    const figure = createElement("figure", { className: "project-figure" });
    const visual = createElement("a", {
      className: `project-visual ${project.visualClass || ""}`,
      attributes: { href: project.link, "aria-label": `View ${project.title}` }
    });
    visual.append(image);
    const caption = createElement("figcaption", { text: project.caption });
    figure.append(visual, caption);
    const body = createElement("div", { className: "project-body" });
    const title = createElement("h3", { text: project.title });
    const description = createElement("p", {
      className: "project-description",
      text: project.description
    });
    const tags = createElement("ul", {
      className: "project-tags",
      attributes: { role: "list", "aria-label": `${project.title} tools and topics` }
    });
    const footer = createElement("div", { className: "project-footer" });
    const link = createElement("a", {
      className: "btn btn-accent",
      attributes: {
        href: project.link
      }
    });
    const sourceLink = createElement("a", {
      className: "project-source-link",
      text: "View code ↗",
      attributes: {
        href: project.source,
        target: "_blank",
        rel: "noopener"
      }
    });
    const linkText = createElement("span", { text: "View project " });
    const linkArrow = createElement("span", {
      text: "↗",
      attributes: { "aria-hidden": "true" }
    });
    const linkContext = createElement("span", {
      className: "sr-only",
      text: ` — ${project.title}`
    });

    project.tags.forEach((tag) => {
      tags.append(createElement("li", { text: tag }));
    });

    link.append(linkText, linkArrow, linkContext);
    sourceLink.append(createElement("span", {
      className: "sr-only",
      text: ` — ${project.title} repository (opens in a new tab)`
    }));
    footer.append(link, sourceLink);
    body.append(title, description);
    if (project.origin) {
      const origin = createElement("p", { className: "project-origin" });
      const originLink = createElement("a", {
        text: project.origin.title,
        attributes: { href: project.origin.url, target: "_blank", rel: "noopener" }
      });
      originLink.append(createElement("span", {
        className: "sr-only",
        text: " repository (opens in a new tab)"
      }));
      origin.append("Built from my original ", originLink, ".");
      body.append(origin);
    }
    body.append(tags, footer);
    card.append(figure, body);
    fragment.append(card);
  });

  grid.replaceChildren(fragment);
}

function initializeSectionNavigation() {
  const links = Array.from(document.querySelectorAll(".nav-right a[href^='#']"));
  const destinations = links
    .map((link) => ({ link, target: document.querySelector(link.getAttribute("href")) }))
    .filter(({ target }) => Boolean(target));
  let navigationFrame = 0;

  if (!destinations.length) {
    return;
  }

  function updateCurrentSection() {
    navigationFrame = 0;
    const readingLine = window.innerHeight * 0.38;
    const reachedBottom = window.scrollY + window.innerHeight
      >= document.documentElement.scrollHeight - 2;
    let current = null;

    destinations.forEach((destination) => {
      if (destination.target.getBoundingClientRect().top <= readingLine) {
        current = destination;
      }
    });

    if (reachedBottom) {
      current = destinations[destinations.length - 1];
    }

    destinations.forEach((destination) => {
      const isCurrent = destination === current;
      destination.link.classList.toggle("is-current", isCurrent);

      if (isCurrent) {
        destination.link.setAttribute("aria-current", "location");
      } else {
        destination.link.removeAttribute("aria-current");
      }
    });
  }

  function queueNavigationUpdate() {
    if (!navigationFrame) {
      navigationFrame = window.requestAnimationFrame(updateCurrentSection);
    }
  }

  window.addEventListener("scroll", queueNavigationUpdate, { passive: true });
  window.addEventListener("resize", queueNavigationUpdate, { passive: true });
  updateCurrentSection();
}

function renderSneakers(sneakers, query = "") {
  const grid = document.getElementById("closet-grid");
  const resultsCount = document.getElementById("sneaker-results-count");
  const fragment = document.createDocumentFragment();

  sneakers.forEach((sneaker) => {
    const card = createElement("article", {
      className: "closet-item",
      attributes: { role: "listitem" }
    });
    const imageWrap = window.PortfolioHobbies?.createSneakerViewer
      ? window.PortfolioHobbies.createSneakerViewer(sneaker, { fallback: FALLBACK_SNEAKER_IMAGE })
      : createStaticSneakerPreview(sneaker);
    const content = createElement("div", { className: "closet-item-content" });
    const name = createElement("h3", { className: "ci-name", text: sneaker.name });
    const metadata = createElement("p", { className: "ci-meta" });
    const brand = createElement("span", { text: sneaker.brand });
    const year = createElement("span", { text: String(sneaker.year) });

    metadata.append(brand, year);
    content.append(name, metadata);
    card.append(imageWrap, content);
    fragment.append(card);
  });

  grid.replaceChildren(fragment);

  if (sneakers.length === 0) {
    resultsCount.textContent = query ? `No sneakers match “${query}”.` : "No sneakers found.";
  } else {
    resultsCount.textContent = `${sneakers.length} sneaker${sneakers.length === 1 ? "" : "s"}`;
  }
}

function createStaticSneakerPreview(sneaker) {
  const wrap = createElement("div", { className: "closet-image-wrap" });
  const image = createElement("img", {
    attributes: { src: sneaker.image, alt: sneaker.name, loading: "lazy", decoding: "async" }
  });
  image.addEventListener("error", () => {
    if (image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = "true";
    image.src = FALLBACK_SNEAKER_IMAGE;
  });
  wrap.append(image);
  return wrap;
}

function setBackgroundInert(isInert) {
  [document.querySelector(".skip-link"), document.querySelector("nav"), document.querySelector("main"), document.querySelector("footer")]
    .filter(Boolean)
    .forEach((region) => {
      region.inert = isInert;

      if (isInert) {
        region.setAttribute("aria-hidden", "true");
      } else {
        region.removeAttribute("aria-hidden");
      }
    });
}

function getModalFocusables(modal) {
  return Array.from(modal.querySelectorAll("button, input, [href], [tabindex]:not([tabindex='-1'])"))
    .filter((element) => !element.disabled && !element.hidden);
}

function openModal(modal, trigger, initialFocus) {
  if (activeModal && activeModal !== modal) {
    closeModal({ restoreFocus: false });
  }

  lastFocusedElement = document.activeElement;
  activeModal = modal;
  activeModalTrigger = trigger;
  modal.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  document.body.classList.add("modal-open");
  setBackgroundInert(true);

  window.requestAnimationFrame(() => {
    (initialFocus || modal.querySelector(".modal-inner")).focus();
  });
}

function closeModal({ restoreFocus = true } = {}) {
  if (!activeModal) {
    return;
  }

  const modal = activeModal;
  const trigger = activeModalTrigger;
  const focusTarget = lastFocusedElement;

  modal.hidden = true;
  trigger?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("modal-open");
  setBackgroundInert(false);
  activeModal = null;
  activeModalTrigger = null;

  if (restoreFocus && focusTarget instanceof HTMLElement) {
    focusTarget.focus();
  }
}

function openCloset() {
  const modal = document.getElementById("closet-modal");
  const search = document.getElementById("sneaker-search");
  const trigger = document.getElementById("hobby-sneakers");

  search.value = "";
  renderSneakers(SNEAKER_DATA);
  openModal(modal, trigger, search);
}

function openGamingProfiles() {
  const modal = document.getElementById("gaming-modal");
  const trigger = document.getElementById("hobby-gaming");
  const closeButton = document.getElementById("close-gaming");

  openModal(modal, trigger, closeButton);
}

function handleModalKeydown(event) {
  const modal = activeModal;

  if (!modal || modal.hidden) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeModal();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusables = getModalFocusables(modal);
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const activeElement = document.activeElement;

  if (!first || !last) {
    event.preventDefault();
    modal.querySelector(".modal-inner").focus();
    return;
  }

  if (!focusables.includes(activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return;
  }

  if (event.shiftKey && activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function initializeClosetModal() {
  const modal = document.getElementById("closet-modal");
  const openButton = document.getElementById("hobby-sneakers");
  const closeButton = document.getElementById("close-closet");
  const search = document.getElementById("sneaker-search");

  openButton.addEventListener("click", openCloset);
  openButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCloset();
    }
  });
  closeButton.addEventListener("click", () => closeModal());

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  search.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    const filtered = SNEAKER_DATA.filter((sneaker) => {
      const searchable = `${sneaker.name} ${sneaker.brand} ${sneaker.year}`.toLowerCase();
      return searchable.includes(query);
    });

    renderSneakers(filtered, event.target.value.trim());
  });
}

function initializeGamingModal() {
  const modal = document.getElementById("gaming-modal");
  const openButton = document.getElementById("hobby-gaming");
  const closeButton = document.getElementById("close-gaming");

  openButton.addEventListener("click", openGamingProfiles);
  openButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openGamingProfiles();
    }
  });
  closeButton.addEventListener("click", () => closeModal());

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

function initialize() {
  initializeHeroScrollWorld();
  renderProjects();
  initializeRevealAnimations();
  // Project figures stay still; only their explicit links need hover feedback.
  initializeSectionNavigation();
  initializeClosetModal();
  initializeGamingModal();
  document.addEventListener("keydown", handleModalKeydown);
  window.PortfolioHobbies?.initialize();
}

initialize();
