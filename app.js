const instruments = [
  {
    id: "wind",
    name: "Wind Chime",
    keywords: "Light / Airy",
    shape: "triangle",
    image: "./public/assets/wind-chime.png",
    audio: "./public/assets/wind-chime.wav",
  },
  {
    id: "bowl",
    name: "Singing Bowl",
    keywords: "Calm / Grounding",
    shape: "semi",
    image: "./public/assets/singing-bowl.png",
    audio: "./public/assets/singing-bowl.wav",
  },
  {
    id: "handpan",
    name: "Handpan",
    keywords: "Warm / Flowing",
    shape: "circle",
    image: "./public/assets/handpan.png",
    audio: "./public/assets/handpan.mp3",
  },
];

const palette = ["#C89968", "#8FA3A8", "#9BA888", "#C97B5C", "#B5A6C9", "#D4A84B"];
const app = document.querySelector("#app");
const audioEls = new Map();

const state = {
  page: "begin",
  selected: "wind",
  shapes: [],
  ripples: [],
  lastTapAt: 0,
  savedAt: "",
  animatingShapeId: "",
};

function currentInstrument() {
  return instruments.find((item) => item.id === state.selected) || instruments[0];
}

function render(animate = false) {
  const routes = {
    begin: renderBegin,
    choose: renderChoose,
    play: renderPlay,
    pattern: renderPattern,
    projected: renderProjected,
    saved: renderSaved,
  };
  app.innerHTML = routes[state.page]();
  if (!animate) {
    app.querySelector(".screen")?.classList.add("no-page-animation");
  }
  window.scrollTo(0, 0);
  bind();
}

function go(page) {
  state.page = page;
  render(true);
}

function resetAll() {
  state.page = "begin";
  state.selected = "wind";
  state.shapes = [];
  state.ripples = [];
  state.lastTapAt = 0;
  state.savedAt = "";
  state.animatingShapeId = "";
  render(true);
}

function resetPattern() {
  state.shapes = [];
  state.ripples = [];
  state.lastTapAt = 0;
  state.savedAt = "";
  state.animatingShapeId = "";
  go("pattern");
}

function nextInstrument(direction) {
  const index = instruments.findIndex((item) => item.id === state.selected);
  const next = (index + direction + instruments.length) % instruments.length;
  state.selected = instruments[next].id;
  render(false);
}

function renderHeader(title, options = {}) {
  const { close = false, sub = "", counter = false } = options;
  const left = close
    ? `<button class="text-btn close-btn" data-action="reset" aria-label="Close">×</button>`
    : `<button class="text-btn" data-action="back">‹ Back</button>`;
  return `
    <header class="header">
      <div>${left}</div>
      <h2>${title}${sub ? `<span class="subhead">${sub}</span>` : ""}</h2>
      <div>${counter ? renderCounter() : ""}</div>
    </header>
  `;
}

function renderCounter() {
  return `<div class="counter" aria-label="${state.shapes.length} of 10 taps">
    ${Array.from({ length: 10 }, (_, index) => `<span class="dot ${index < state.shapes.length ? "filled" : ""}"></span>`).join("")}
  </div>`;
}

function renderBegin() {
  return `
    <section class="screen center">
      <div class="top-spacer"></div>
      <h1 class="brand-title">Tidal Echo</h1>
      <p class="subtitle">Create Your Resonance</p>
      <p class="body-copy">Choose an instrument, and let your sound enter the space.</p>
      <div class="steps">
        ${["Choose an instrument", "Tap your rhythm", "Watch the space respond"].map((label, index) => `
          <div class="step">
            <span class="step-icon">${["○", "◖", "△"][index]}</span>
            <span>${label}</span>
          </div>
        `).join("")}
      </div>
      <p class="connected">✓ Connected to installation</p>
      <div class="bottom-actions">
        <button class="primary-btn wide" data-action="begin">Begin</button>
        <p class="micro">The experience will continue in the space around you.</p>
      </div>
    </section>
  `;
}

function renderChoose() {
  return `
    <section class="screen">
      ${renderHeader("Choose Your Instrument")}
      <div class="instrument-list">
        ${instruments.map((item) => `
          <button class="instrument-card ${item.id === state.selected ? "selected" : ""}" data-select="${item.id}">
            <img src="${item.image}" alt="${item.name}" />
            <span>
              <span class="instrument-name">${item.name}</span>
              <span class="instrument-keyword">${item.keywords}</span>
            </span>
          </button>
        `).join("")}
      </div>
      <div class="hint">
        <p>When you play, the lights above you will respond.</p>
        <p>Each instrument generates a different visual symbol in your personal pattern.</p>
      </div>
      <div class="bottom-actions">
        <button class="primary-btn" data-action="confirm">Confirm</button>
      </div>
    </section>
  `;
}

function renderPlay() {
  const item = currentInstrument();
  return `
    <section class="screen">
      ${renderHeader("Play Your Instrument", { sub: item.name })}
      <div class="preview-empty">Your pattern will appear here</div>
      <div class="play-zone">
        <button class="icon-btn" data-action="prev" aria-label="Previous instrument">‹</button>
        <img src="${item.image}" alt="${item.name}" data-action="tap-start" />
        <button class="icon-btn" data-action="next" aria-label="Next instrument">›</button>
      </div>
      <p class="micro" style="text-align:center">Tap the instrument</p>
    </section>
  `;
}

function renderPattern() {
  const locked = state.shapes.length >= 10;
  const ready = state.shapes.length >= 3;
  const instrument = currentInstrument();
  return `
    <section class="screen pattern-screen">
      ${renderHeader("Your Pattern")}
      <div class="look-up-zone">
        <h3>Look Up</h3>
        <p>The space draws with you.</p>
        ${renderCounter()}
      </div>
      <div class="pattern-preview">
        <div class="canvas-wrap small-preview ${locked ? "complete locked" : ""}">
          ${patternSvg("pattern-svg")}
        </div>
        <p>Your pattern</p>
      </div>
      <div class="pattern-instrument-stage">
        <button class="icon-btn" data-action="prev" aria-label="Previous instrument">‹</button>
        <button class="pattern-instrument-hit ${locked ? "locked" : ""}" data-action="canvas-tap" aria-label="Tap to play ${instrument.name}">
          ${state.ripples.map((id) => `
            <span class="instrument-ripple-ring ring-one" data-ripple="${id}"></span>
            <span class="instrument-ripple-ring ring-two" data-ripple="${id}"></span>
            <span class="instrument-ripple-ring ring-three" data-ripple="${id}"></span>
          `).join("")}
          <img src="${instrument.image}" alt="${instrument.name}" />
        </button>
        <button class="icon-btn" data-action="next" aria-label="Next instrument">›</button>
      </div>
      <p class="micro" style="text-align:center">Tap to play</p>
      <div class="complete-note">${locked ? "Complete" : ""}</div>
      <div class="bottom-actions">
        <button class="primary-btn ${locked ? "pulse" : ""}" ${ready ? "" : "disabled"} data-action="project">Project</button>
      </div>
    </section>
  `;
}

function renderProjected() {
  return `
    <section class="screen">
      ${renderHeader("Projected", { close: true })}
      <div class="projection-stage">
        ${patternSvg("projected-pattern")}
        <p class="look-down">Look down</p>
        <p class="body-copy">Your pattern is now part of the space.</p>
      </div>
      <div class="bottom-actions">
        <button class="primary-btn" data-action="again">Create Again</button>
        <button class="secondary-btn" data-action="save">Save This Pattern</button>
      </div>
    </section>
  `;
}

function renderSaved() {
  if (!state.savedAt) {
    state.savedAt = new Date().toLocaleString("en-AU", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return `
    <section class="screen">
      ${renderHeader("Saved", { close: true })}
      <div class="postcard">
        ${patternSvg("")}
        <div class="watermark">
          <span>Tidal Echo</span>
          <span>${state.savedAt}</span>
        </div>
      </div>
      <p class="saved-status">✓ Saved to Album</p>
      <div class="bottom-actions">
        <button class="primary-btn" data-action="again">Create Again</button>
        <button class="secondary-btn" data-action="project">Project This Pattern</button>
      </div>
    </section>
  `;
}

function patternSvg(className) {
  const content = state.shapes.length
    ? state.shapes.map(shapeMarkup).join("")
    : `<text x="175" y="180" text-anchor="middle" fill="#8B7E6E" opacity=".36" font-size="22" font-style="italic">Tap softly</text>`;
  return `<svg class="${className}" viewBox="0 0 350 350" aria-hidden="true">${content}</svg>`;
}

function shapeMarkup(shape) {
  const opacity = 0.93;
  const shapeClass = shape.id === state.animatingShapeId ? "generated-shape" : "stable-shape";
  if (shape.kind === "triangle") {
    const h = shape.size * 0.9;
    const points = `0,${-h / 2} ${shape.size / 2},${h / 2} ${-shape.size / 2},${h / 2}`;
    return `
      <g transform="translate(${shape.x} ${shape.y}) rotate(${shape.rotation})">
        <g class="${shapeClass}" style="animation-delay:${shape.delay}ms">
          <polygon points="${points}" fill="${shape.color}" opacity="${opacity}" />
          <circle cx="${shape.size * 0.37}" cy="${-shape.size * 0.18}" r="${shape.size * 0.08}" fill="#FAF6EE" opacity=".72" />
          <circle cx="${-shape.size * 0.44}" cy="${shape.size * 0.38}" r="${shape.size * 0.055}" fill="${shape.accent}" opacity=".86" />
        </g>
      </g>
    `;
  }
  if (shape.kind === "semi") {
    const r = shape.size / 2;
    return `
      <g transform="translate(${shape.x} ${shape.y}) rotate(${shape.rotation})">
        <g class="${shapeClass}" style="animation-delay:${shape.delay}ms">
          <path d="M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 L ${r} ${r * 0.3} L ${-r} ${r * 0.3} Z" fill="${shape.color}" opacity="${opacity}" />
          <rect x="${-r * 0.22}" y="${-r * 0.22}" width="${r * 0.44}" height="${r * 0.44}" fill="${shape.accent}" opacity=".86" />
        </g>
      </g>
    `;
  }
  const r = shape.size / 2;
  return `
    <g transform="translate(${shape.x} ${shape.y}) rotate(${shape.rotation})">
      <g class="${shapeClass}" style="animation-delay:${shape.delay}ms">
        <circle cx="0" cy="0" r="${r}" fill="${shape.color}" opacity="${opacity}" />
        <circle cx="${r * 0.2}" cy="${-r * 0.16}" r="${r * 0.38}" fill="none" stroke="#FAF6EE" stroke-width="${Math.max(5, r * 0.14)}" opacity=".52" />
        <circle cx="${-r * 0.42}" cy="${r * 0.22}" r="${r * 0.11}" fill="${shape.accent}" opacity=".88" />
      </g>
    </g>
  `;
}

function addTap() {
  if (state.shapes.length >= 10) return;
  const now = Date.now();
  const interval = state.lastTapAt ? Math.min(2400, now - state.lastTapAt) : 1000;
  state.lastTapAt = now;
  const size = Math.round(50 + (interval / 2400) * 100);
  const angle = state.shapes.length * 0.82 + Math.random() * 0.7;
  const radius = Math.min(88, state.shapes.length * 8 + Math.random() * 28);
  const instrument = currentInstrument();
  const color = palette[Math.floor(Math.random() * palette.length)];
  const accent = palette.filter((item) => item !== color)[Math.floor(Math.random() * (palette.length - 1))];
  const shapeId = crypto.randomUUID();
  state.shapes.push({
    id: shapeId,
    kind: instrument.shape,
    color,
    accent,
    size,
    x: 175 + Math.cos(angle) * radius,
    y: 175 + Math.sin(angle) * radius,
    rotation: Math.round(Math.random() * 120 - 60),
    delay: 180,
  });
  state.animatingShapeId = shapeId;
  const rippleId = crypto.randomUUID();
  state.ripples.push(rippleId);
  playSound(instrument);
  render(false);
  window.setTimeout(() => {
    if (state.animatingShapeId === shapeId) {
      state.animatingShapeId = "";
      if (state.page === "pattern") render(false);
    }
  }, 900);
  window.setTimeout(() => {
    state.ripples = state.ripples.filter((id) => id !== rippleId);
    if (state.page === "pattern") render(false);
  }, 1550);
}

function playSound(instrument) {
  const existing = audioEls.get(instrument.id);
  const audio = existing || new Audio(instrument.audio);
  audioEls.set(instrument.id, audio);
  audio.currentTime = 0;
  audio.volume = 0.55;
  audio.play().catch(() => synthTone(instrument.id));
}

function synthTone(id) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const settings = {
    wind: { freq: 880, type: "sine", decay: 0.55 },
    bowl: { freq: 174, type: "sine", decay: 1.6 },
    handpan: { freq: 330, type: "triangle", decay: 1.1 },
  }[id];
  oscillator.type = settings.type;
  oscillator.frequency.setValueAtTime(settings.freq, context.currentTime);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.24, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + settings.decay);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + settings.decay + 0.05);
}

function bind() {
  app.querySelectorAll("[data-action]").forEach((node) => {
    node.addEventListener("click", (event) => {
      const action = event.currentTarget.dataset.action;
      if (action === "begin") go("choose");
      if (action === "back") handleBack();
      if (action === "reset") resetAll();
      if (action === "confirm") go("pattern");
      if (action === "prev") nextInstrument(-1);
      if (action === "next") nextInstrument(1);
      if (action === "tap-start") {
        playSound(currentInstrument());
        go("pattern");
      }
      if (action === "canvas-tap") addTap();
      if (action === "project") go("projected");
      if (action === "save") {
        downloadPattern();
        go("saved");
      }
      if (action === "again") resetPattern();
    });
  });

  app.querySelectorAll("[data-select]").forEach((node) => {
    node.addEventListener("click", (event) => {
      state.selected = event.currentTarget.dataset.select;
      render(false);
    });
  });
}

function handleBack() {
  const order = ["begin", "choose", "pattern"];
  const index = order.indexOf(state.page);
  if (state.page === "choose") resetAll();
  else if (index > 0) go(order[index - 1]);
  else go("pattern");
}

function downloadPattern() {
  if (!state.shapes.length) return;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 350" width="1400" height="1400">
      <rect width="350" height="350" rx="175" fill="#FAF6EE"/>
      ${state.shapes.map(shapeMarkup).join("")}
    </svg>
  `;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `tidal-echo-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 500);
}

render(true);
