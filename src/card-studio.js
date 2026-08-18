import { LOOKS, PALETTES_RGB } from "fluid-core";

const CARD_WIDTH = 1500;
const CARD_HEIGHT = 2100;

const THEMES = {
  overworld: { label:"Overworld", dark:"#101a12", mid:"#315f35", bright:"#b7f45b", accent:"#d7ff91" },
  nether: { label:"Nether", dark:"#1d090a", mid:"#70231f", bright:"#ff784f", accent:"#ffbc78" },
  end: { label:"The End", dark:"#110d1d", mid:"#47336d", bright:"#c58cff", accent:"#e7d0ff" },
  aurora: { label:"Aurora", dark:"#07191a", mid:"#12666a", bright:"#5bf4c4", accent:"#b7fff0" },
};

const FLUID_BACKGROUNDS = {
  borealis: { label:"Fluid · Borealis", look:"BOREALIS" },
  magma: { label:"Fluid · Magma", look:"MAGMA" },
  halftone: { label:"Fluid · Halftone", look:"HALFTONE" },
  mercury: { label:"Fluid · Mercury", look:"MERCURY" },
};

export class CardStudio {
  constructor({ editor, getMetadata }) {
    this.editor = editor;
    this.getMetadata = getMetadata;
    this.artworkUrl = null;
    this.customBackgroundUrl = null;
    this.activeFluidBackground = null;
    this.fluidAnimationFrame = null;
    this.fluidStartedAt = 0;
    this.fluidTime = 0;
    this.lastFluidFrame = 0;
    this.pointerAnimationFrame = null;
    this.pendingPointer = null;
    this.pointer = { x:0.62, y:0.28 };
    this.root = document.createElement("div");
    this.root.className = "card-studio-modal hidden";
    this.root.innerHTML = `
      <div class="card-studio-dialog" role="dialog" aria-modal="true" aria-labelledby="cardStudioTitle">
        <header class="card-studio-header">
          <div><span>CARD STUDIO · 06</span><h2 id="cardStudioTitle">burhanpose player card</h2></div>
          <button class="card-close" type="button" aria-label="Close card studio">×</button>
        </header>
        <div class="card-studio-body">
          <div class="card-preview-column">
            <div class="card-preview-stage">
              <article class="bp-player-card" data-theme="overworld" data-foil="prism">
                <div class="card-grid"></div><div class="card-spectrum"></div><div class="card-foil"></div><div class="card-sparkles"></div><div class="card-glare"></div>
                <div class="card-content">
                  <div class="card-kicker"><span>burhanpose // player</span><span class="card-number">BP-001</span></div>
                  <h3 class="card-player-name">PLAYER</h3>
                  <div class="card-artwork"><div class="card-art-background"></div><div class="card-art-backdrop"></div><img alt="Posed avatar card artwork" /></div>
                  <div class="card-title-row"><span class="card-player-title">POSE MASTER</span><span class="card-rarity">PRISM</span></div>
                  <div class="card-meta"><span class="card-model">CLASSIC</span><span class="card-pose">IDLE</span><span class="card-layer">OUTER LAYER</span></div>
                  <div class="card-signature"><span>ORIGINAL PLAYER CARD</span><span>POSE.BURHAN.MY</span></div>
                </div>
              </article>
            </div>
            <p>The center viewport is your card camera. Move across the card to inspect the foil.</p>
          </div>
          <form class="card-controls" onsubmit="return false">
            <label>Player name<input id="cardName" maxlength="16" /></label>
            <label>Card title<input id="cardTitle" maxlength="24" value="POSE MASTER" /></label>
            <label>Card number<input id="cardNumber" maxlength="12" value="BP-001" /></label>
            <div class="card-control-pair">
              <label>World theme<select id="cardTheme">${Object.entries(THEMES).map(([value, theme]) => `<option value="${value}">${theme.label}</option>`).join("")}</select></label>
              <label>Foil<select id="cardFoil"><option value="prism">Prism</option><option value="galaxy">Galaxy</option><option value="aurora">Aurora</option><option value="none">None</option></select></label>
            </div>
            <div class="card-background-control">
              <label>Scene background<select id="cardBackground">${Object.entries(FLUID_BACKGROUNDS).map(([value, background]) => `<option value="${value}">${background.label}</option>`).join("")}<option value="custom">Custom image</option></select></label>
              <label class="card-background-upload" for="cardBackgroundFile">Upload your image</label>
              <input id="cardBackgroundFile" type="file" accept="image/png,image/jpeg,image/webp" hidden />
            </div>
            <label>Artwork scale <output id="cardScaleOutput">100%</output><input id="cardScale" type="range" min="75" max="125" value="100" /></label>
            <label>Foil intensity <output id="cardFoilOutput">10%</output><input id="cardFoilIntensity" type="range" min="0" max="100" value="10" /></label>
            <button class="card-refresh" type="button">Capture center view</button>
            <button class="card-export" type="button">Export 3000 × 4200 PNG</button>
            <p class="card-studio-status" role="status"></p>
            <p class="card-inspiration">Generative backgrounds powered by <a href="https://github.com/enonforetsam/fluid" target="_blank" rel="noopener noreferrer">Fluid</a>. Holographic interaction inspired by <a href="https://github.com/simeydotme/pokemon-cards-css" target="_blank" rel="noopener noreferrer">pokemon-cards-css</a>.</p>
          </form>
        </div>
      </div>`;
    document.body.appendChild(this.root);
    this.card = this.root.querySelector(".bp-player-card");
    this.artwork = this.root.querySelector(".card-artwork img");
    this.background = this.root.querySelector(".card-art-background");
    this.fluidCanvas = document.createElement("canvas");
    this.fluidCanvas.className = "card-fluid-canvas";
    this.background.appendChild(this.fluidCanvas);
    this.status = this.root.querySelector(".card-studio-status");
    this.bindEvents();
  }

  bindEvents() {
    this.root.querySelector(".card-close").addEventListener("click", () => this.close());
    this.root.addEventListener("click", (event) => { if (event.target === this.root) this.close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !this.root.classList.contains("hidden")) this.close(); });
    ["cardName", "cardTitle", "cardNumber", "cardTheme", "cardFoil", "cardBackground", "cardScale", "cardFoilIntensity"].forEach((id) => {
      this.root.querySelector(`#${id}`).addEventListener("input", () => this.syncPreview());
    });
    this.root.querySelector("#cardBackgroundFile").addEventListener("change", (event) => this.loadCustomBackground(event));
    this.root.querySelector(".card-refresh").addEventListener("click", () => this.captureArtwork());
    this.root.querySelector(".card-export").addEventListener("click", () => this.exportCard());
    this.card.addEventListener("pointerenter", () => this.card.classList.add("interacting"));
    this.card.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.card.addEventListener("pointerleave", () => { this.card.classList.remove("interacting"); this.setPointer(0.5, 0.5); });
  }

  async loadCustomBackground(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      this.setStatus("Choose a PNG, JPEG, or WebP background image.", "error");
      return;
    }
    if (this.customBackgroundUrl) URL.revokeObjectURL(this.customBackgroundUrl);
    this.customBackgroundUrl = URL.createObjectURL(file);
    this.root.querySelector("#cardBackground").value = "custom";
    this.syncPreview();
    try {
      await loadCanvasImage(this.customBackgroundUrl);
      this.setStatus(`${file.name} is ready as the card background.`, "success");
    } catch {
      this.setStatus("That background image could not be opened.", "error");
    }
    event.target.value = "";
  }

  async open() {
    const metadata = this.getMetadata();
    this.root.querySelector("#cardName").value = metadata.name || "PLAYER";
    this.root.classList.remove("hidden");
    document.body.classList.add("modal-open");
    this.editor.setRenderingPaused?.(true);
    this.syncPreview();
    await this.captureArtwork();
  }

  close() {
    this.root.classList.add("hidden");
    document.body.classList.remove("modal-open");
    this.stopFluidAnimation();
    if (this.pointerAnimationFrame) cancelAnimationFrame(this.pointerAnimationFrame);
    this.pointerAnimationFrame = null;
    this.pendingPointer = null;
    this.editor.setRenderingPaused?.(false);
    this.setPointer(0.5, 0.5);
  }

  async captureArtwork() {
    const button = this.root.querySelector(".card-refresh");
    button.disabled = true;
    this.setStatus("Capturing the center viewport camera…");
    try {
      const capturedBlob = await this.editor.captureViewportFrame(1560, 1400);
      const blob = await fitVisiblePixelsToFrame(capturedBlob);
      if (this.artworkUrl) URL.revokeObjectURL(this.artworkUrl);
      this.artworkUrl = URL.createObjectURL(blob);
      this.artwork.src = this.artworkUrl;
      await this.artwork.decode();
      this.setStatus("Avatar fitted edge-to-edge.", "success");
    } catch (error) {
      this.setStatus(error.message || "The avatar could not be captured.", "error");
    } finally {
      button.disabled = false;
    }
  }

  syncPreview() {
    const state = this.getState();
    const metadata = this.getMetadata();
    this.card.dataset.theme = state.theme;
    this.card.dataset.foil = state.foil;
    this.card.style.setProperty("--foil-opacity", state.foilIntensity);
    this.card.style.setProperty("--art-scale", state.scale);
    this.syncBackground(state.background, state.theme);
    this.root.querySelector(".card-player-name").textContent = state.name || "PLAYER";
    this.root.querySelector(".card-player-title").textContent = state.title || "POSE MASTER";
    this.root.querySelector(".card-number").textContent = state.number || "BP-001";
    this.root.querySelector(".card-rarity").textContent = state.foil === "none" ? "STANDARD" : state.foil.toUpperCase();
    this.root.querySelector(".card-model").textContent = (metadata.model || "classic").toUpperCase();
    this.root.querySelector(".card-pose").textContent = (metadata.pose || "custom").toUpperCase();
    this.root.querySelector(".card-layer").textContent = metadata.layers3d ? "3D LAYERS" : "OUTER LAYER";
    this.root.querySelector("#cardScaleOutput").textContent = `${Math.round(state.scale * 100)}%`;
    this.root.querySelector("#cardFoilOutput").textContent = `${Math.round(state.foilIntensity * 100)}%`;
  }

  getState() {
    return {
      name: this.root.querySelector("#cardName").value.trim(),
      title: this.root.querySelector("#cardTitle").value.trim(),
      number: this.root.querySelector("#cardNumber").value.trim(),
      theme: this.root.querySelector("#cardTheme").value,
      foil: this.root.querySelector("#cardFoil").value,
      background: this.root.querySelector("#cardBackground").value,
      scale: Number(this.root.querySelector("#cardScale").value) / 100,
      foilIntensity: Number(this.root.querySelector("#cardFoilIntensity").value) / 100,
    };
  }

  syncBackground(background, themeName) {
    if (background === "custom") {
      this.stopFluidAnimation();
      this.fluidCanvas.hidden = true;
      this.background.style.backgroundImage = this.customBackgroundUrl ? `url("${this.customBackgroundUrl}")` : "none";
      return;
    }
    const preset = FLUID_BACKGROUNDS[background] || FLUID_BACKGROUNDS.borealis;
    const theme = THEMES[themeName] || THEMES.overworld;
    const signature = `${background}:${themeName}`;
    this.background.style.backgroundImage = "none";
    this.fluidCanvas.hidden = false;
    if (this.activeFluidBackground !== signature) {
      renderFluid2d(this.fluidCanvas, preset.look, 360, 323, theme, this.fluidTime);
      this.activeFluidBackground = signature;
    }
    this.startFluidAnimation();
  }

  getExportBackgroundUrl(state) {
    if (state.background === "custom") return Promise.resolve(this.customBackgroundUrl);
    const preset = FLUID_BACKGROUNDS[state.background] || FLUID_BACKGROUNDS.borealis;
    const canvas = document.createElement("canvas");
    renderFluid2d(canvas, preset.look, 1236, 1110, THEMES[state.theme] || THEMES.overworld, this.fluidTime);
    return Promise.resolve(canvas.toDataURL("image/png"));
  }

  startFluidAnimation() {
    if (this.fluidAnimationFrame || this.root.classList.contains("hidden") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!this.fluidStartedAt) this.fluidStartedAt = performance.now() - this.fluidTime * 1000;
    const animate = (timestamp) => {
      if (this.root.classList.contains("hidden") || this.getState().background === "custom") {
        this.fluidAnimationFrame = null;
        return;
      }
      if (timestamp - this.lastFluidFrame >= 100) {
        const state = this.getState();
        const preset = FLUID_BACKGROUNDS[state.background] || FLUID_BACKGROUNDS.borealis;
        this.fluidTime = (timestamp - this.fluidStartedAt) / 1000;
        renderFluid2d(this.fluidCanvas, preset.look, 360, 323, THEMES[state.theme] || THEMES.overworld, this.fluidTime);
        this.lastFluidFrame = timestamp;
      }
      this.fluidAnimationFrame = requestAnimationFrame(animate);
    };
    this.fluidAnimationFrame = requestAnimationFrame(animate);
  }

  stopFluidAnimation() {
    if (this.fluidAnimationFrame) cancelAnimationFrame(this.fluidAnimationFrame);
    this.fluidAnimationFrame = null;
  }

  onPointerMove(event) {
    const bounds = this.card.getBoundingClientRect();
    this.pendingPointer = [(event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height];
    if (this.pointerAnimationFrame) return;
    this.pointerAnimationFrame = requestAnimationFrame(() => {
      this.pointerAnimationFrame = null;
      if (!this.pendingPointer) return;
      this.setPointer(this.pendingPointer[0], this.pendingPointer[1]);
      this.pendingPointer = null;
    });
  }

  setPointer(x, y) {
    const safeX = Math.min(1, Math.max(0, x));
    const safeY = Math.min(1, Math.max(0, y));
    const distance = Math.min(1, Math.hypot(safeX - 0.5, safeY - 0.5) / 0.707);
    const angle = Math.atan2(safeY - 0.5, safeX - 0.5) * 180 / Math.PI;
    this.pointer = { x:safeX, y:safeY };
    this.card.style.setProperty("--pointer-x", `${safeX * 100}%`);
    this.card.style.setProperty("--pointer-y", `${safeY * 100}%`);
    this.card.style.setProperty("--pointer-from-left", safeX);
    this.card.style.setProperty("--pointer-from-top", safeY);
    this.card.style.setProperty("--pointer-distance", distance);
    this.card.style.setProperty("--sparkle-opacity", 0.3 + distance * 0.45);
    this.card.style.setProperty("--pointer-angle", `${angle}deg`);
    this.card.style.setProperty("--shadow-x", `${(0.5 - safeX) * 26}px`);
    this.card.style.setProperty("--shadow-y", `${(0.5 - safeY) * 30 + 28}px`);
    this.card.style.setProperty("--rotate-x", `${(0.5 - safeY) * 18}deg`);
    this.card.style.setProperty("--rotate-y", `${(safeX - 0.5) * 22}deg`);
  }

  async exportCard() {
    if (!this.artworkUrl) return this.setStatus("Capture the avatar before exporting.", "error");
    const button = this.root.querySelector(".card-export");
    button.disabled = true;
    button.textContent = "Rendering card…";
    this.setStatus("Compositing the high-resolution foil card…");
    try {
      await document.fonts.ready;
      const state = this.getState();
      const backgroundUrl = await this.getExportBackgroundUrl(state);
      const blob = await renderCardPng({
        state, metadata:this.getMetadata(), artworkUrl:this.artworkUrl, backgroundUrl, pointer:this.pointer,
        width:CARD_WIDTH * 2, height:CARD_HEIGHT * 2,
      });
      const link = document.createElement("a");
      link.download = `burhanpose-card-${safeFilename(this.getState().name)}-${Date.now()}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1200);
      this.setStatus("3000 × 4200 player card saved.", "success");
    } catch (error) {
      this.setStatus(error.message || "The card could not be exported.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "Export 3000 × 4200 PNG";
    }
  }

  setStatus(message, type = "") {
    this.status.textContent = message;
    this.status.className = `card-studio-status ${type}`;
  }
}

async function fitVisiblePixelsToFrame(blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently:true });
  context.drawImage(bitmap, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const rowCoverage = new Uint32Array(canvas.height);
  const columnCoverage = new Uint32Array(canvas.width);
  for (let y = 0; y < canvas.height; y += 1) {
    const rowStart = y * canvas.width * 4;
    for (let x = 0; x < canvas.width; x += 1) {
      if (pixels[rowStart + x * 4 + 3] <= 32) continue;
      rowCoverage[y] += 1;
      columnCoverage[x] += 1;
    }
  }
  const rowThreshold = Math.max(8, Math.floor(canvas.width * 0.006));
  const columnThreshold = Math.max(8, Math.floor(canvas.height * 0.006));
  const top = rowCoverage.findIndex((count) => count >= rowThreshold);
  const bottom = rowCoverage.findLastIndex((count) => count >= rowThreshold);
  const left = columnCoverage.findIndex((count) => count >= columnThreshold);
  const right = columnCoverage.findLastIndex((count) => count >= columnThreshold);
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (top >= 0 && bottom >= top && left >= 0 && right >= left) {
    const sourceWidth = right - left + 1;
    const sourceHeight = bottom - top + 1;
    const edgeOverscan = Math.max(8, Math.round(canvas.height * 0.012));
    const scale = (canvas.height + edgeOverscan * 2) / sourceHeight;
    const drawWidth = sourceWidth * scale;
    context.imageSmoothingEnabled = false;
    context.drawImage(bitmap, left, top, sourceWidth, sourceHeight, (canvas.width - drawWidth) / 2, -edgeOverscan, drawWidth, canvas.height + edgeOverscan * 2);
  } else {
    context.drawImage(bitmap, 0, 0);
  }
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("The avatar cutout could not be prepared.")), "image/png"));
}

// Adapted from Fluid's MIT-licensed canvas-only low-power renderer. It uses
// Fluid's own curated look and palette tables without creating a second WebGL
// context beside the Three.js avatar editor.
function renderFluid2d(canvas, lookName, width, height, theme, time = 0) {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, width, height);
  const look = LOOKS.find((item) => item.label === lookName) || LOOKS[0];
  const values = look.p;
  const state = {
    field:lookName === "HALFTONE" ? 3 : (look.field || 0),
    seed:values[8] || 37,
    warp:values[2] || 0,
    colors:theme
      ? [theme.dark, theme.mid, theme.bright, theme.accent].map(hexToRgb01)
      : (look.cols ? look.cols.map(hexToRgb01) : (PALETTES_RGB[values[7]] || PALETTES_RGB[0])),
  };
  const gradient = context.createLinearGradient(0, 0, width, height);
  state.colors.forEach((color, index) => gradient.addColorStop(index / 3, rgb01ToCss(color)));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.save();
  context.globalCompositeOperation = "screen";
  const max = Math.max(width, height);
  const ramp = (value) => {
    const safe = Math.max(0, Math.min(0.999, value));
    const position = safe * 3;
    const index = Math.floor(position);
    const amount = position - index;
    const from = state.colors[index];
    const to = state.colors[Math.min(3, index + 1)];
    return from.map((channel, channelIndex) => Math.round((channel + (to[channelIndex] - channel) * amount) * 255));
  };
  const stroke = (color, alpha, lineWidth) => {
    context.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
  };
  if (state.field === 3) {
    context.globalCompositeOperation = "source-over";
    const spacing = Math.max(12, Math.round(max / 24));
    const ink = ramp(0.42);
    for (let y = -spacing; y < height + spacing; y += spacing) {
      for (let x = -spacing; x < width + spacing; x += spacing) {
        const wave = Math.sin(x * 0.018 + y * 0.014 + time * 2.2);
        const radius = spacing * (0.13 + (wave + 1) * 0.09);
        context.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},.38)`;
        context.beginPath();
        context.arc(x + Math.sin(time * 1.1 + y * 0.02) * spacing * 0.35, y, radius, 0, Math.PI * 2);
        context.fill();
      }
    }
  } else if (state.field === 2) {
    for (let index = 0; index < 26; index += 1) {
      let x = (Math.sin(index * 12.989 + state.seed) * 43758.5453) % 1;
      let y = (Math.sin(index * 78.233 + state.seed) * 24634.6345) % 1;
      if (x < 0) x += 1;
      if (y < 0) y += 1;
      x = (x + Math.sin(time * 0.5 + index * 1.7) * 0.045 + 1) % 1;
      y = (y + Math.cos(time * 0.42 + index * 1.3) * 0.04 + 1) % 1;
      const color = ramp((index * 0.11) % 1);
      stroke(color, 0.42, Math.max(2, max * 0.009));
      context.beginPath();
      context.arc(x * width, y * height, max * (0.06 + (index % 5) * 0.012) * (1 + Math.sin(time * 0.4 + index) * 0.05), 0, Math.PI * 2);
      context.stroke();
    }
  } else {
    for (let index = 0; index < 14; index += 1) {
      const x = (Math.sin(state.seed * 1.7 + index * 2.31 + time * 0.35) * 0.5 + 0.5) * width;
      const y = (Math.cos(state.seed * 1.1 + index * 1.73 - time * 0.28) * 0.5 + 0.5) * height;
      const radius = (0.1 + ((index + state.warp) % 7) * 0.035) * max;
      const color = ramp(((index * 0.17) + state.seed * 0.013) % 1);
      const glow = context.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},.72)`);
      glow.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    }
  }
  context.restore();
}

function hexToRgb01(hex) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [(value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255];
}

function rgb01ToCss(color) {
  return `rgb(${color.map((channel) => Math.round(channel * 255)).join(",")})`;
}

async function renderCardPng({ state, metadata, artworkUrl, backgroundUrl, pointer, width, height }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const scale = width / CARD_WIDTH;
  context.scale(scale, scale);
  const theme = THEMES[state.theme] || THEMES.overworld;
  const artwork = await loadCanvasImage(artworkUrl);
  const background = backgroundUrl ? await loadCanvasImage(backgroundUrl) : null;
  drawCardBase(context, theme);
  drawArtwork(context, artwork, background, theme, state.scale);
  if (state.foil !== "none" && state.foilIntensity > 0) drawFoil(context, state.foil, state.foilIntensity, pointer);
  drawCardTypography(context, state, metadata, theme);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode the card PNG.")), "image/png"));
}

function drawCardBase(context, theme) {
  context.save();
  roundedRect(context, 20, 20, 1460, 2060, 92);
  context.clip();
  const background = context.createLinearGradient(80, 80, 1420, 2020);
  background.addColorStop(0, theme.mid); background.addColorStop(0.42, theme.dark); background.addColorStop(1, "#060807");
  context.fillStyle = background; context.fillRect(0, 0, 1500, 2100);
  context.globalAlpha = 0.17; context.strokeStyle = theme.bright; context.lineWidth = 2;
  for (let x = -1000; x < 2100; x += 70) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x + 1100, 2100); context.stroke(); }
  context.globalAlpha = 1;
  const rim = context.createLinearGradient(0, 0, 1500, 2100);
  rim.addColorStop(0, theme.accent); rim.addColorStop(0.35, theme.bright); rim.addColorStop(0.7, "#202820"); rim.addColorStop(1, theme.accent);
  context.strokeStyle = rim; context.lineWidth = 34; roundedRect(context, 42, 42, 1416, 2016, 76); context.stroke();
  context.strokeStyle = "rgba(255,255,255,.22)"; context.lineWidth = 3; roundedRect(context, 76, 76, 1348, 1948, 55); context.stroke();
  context.restore();
}

function drawArtwork(context, artwork, backgroundImage, theme, artworkScale) {
  const x = 132, y = 370, width = 1236, height = 1110;
  context.save(); roundedRect(context, x, y, width, height, 58); context.clip();
  const backdrop = context.createRadialGradient(800, 780, 60, 750, 900, 820);
  backdrop.addColorStop(0, theme.mid); backdrop.addColorStop(0.52, theme.dark); backdrop.addColorStop(1, "#060806");
  context.fillStyle = backdrop; context.fillRect(x, y, width, height);
  if (backgroundImage) {
    drawImageCover(context, backgroundImage, x, y, width, height);
    const shade = context.createLinearGradient(x, y, x, y + height);
    shade.addColorStop(0, "rgba(2,5,3,.08)"); shade.addColorStop(0.72, "rgba(2,5,3,.18)"); shade.addColorStop(1, "rgba(2,5,3,.48)");
    context.fillStyle = shade; context.fillRect(x, y, width, height);
  }
  context.globalAlpha = 1;
  const drawWidth = width * artworkScale;
  const drawHeight = height * artworkScale;
  context.drawImage(artwork, x + width / 2 - drawWidth / 2, y + height - drawHeight, drawWidth, drawHeight);
  context.restore();
  context.strokeStyle = theme.accent; context.lineWidth = 8; roundedRect(context, x, y, width, height, 58); context.stroke();
}

function drawImageCover(context, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawFoil(context, foil, intensity, pointer) {
  context.save(); roundedRect(context, 28, 28, 1444, 2044, 86); context.clip();
  context.globalCompositeOperation = "screen"; context.globalAlpha = intensity * 0.72;
  if (foil === "galaxy") {
    const wash = context.createRadialGradient(pointer.x * 1500, pointer.y * 2100, 20, 750, 1050, 1500);
    wash.addColorStop(0, "rgba(255,255,255,.9)"); wash.addColorStop(0.18, "#8f68ff"); wash.addColorStop(0.48, "#1556a8"); wash.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = wash; context.fillRect(0, 0, 1500, 2100);
    let seed = 73421;
    for (let i = 0; i < 190; i += 1) { seed = (seed * 16807) % 2147483647; const x = (seed % 1500); seed = (seed * 16807) % 2147483647; const y = seed % 2100; const r = 1 + (seed % 8); context.fillStyle = i % 5 ? "#a9d9ff" : "#ffffff"; context.fillRect(x, y, r, r); }
  } else {
    const gradient = context.createLinearGradient(0, 2100 * pointer.y, 1500, 2100 * (1 - pointer.y));
    const colors = foil === "aurora"
      ? ["#40ffd2", "#5a8cff", "#d65bff", "#61ffc8", "#fff08c"]
      : ["#ff4d7d", "#ffdc5b", "#67ffb1", "#57a7ff", "#c85cff", "#ff4d7d"];
    colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1), color));
    context.fillStyle = gradient; context.fillRect(0, 0, 1500, 2100);
    context.globalAlpha = intensity * 0.24;
    context.lineWidth = 38;
    for (let offset = -1900; offset < 2200; offset += 138) {
      context.strokeStyle = `hsl(${(offset + pointer.x * 360) % 360} 100% 72%)`;
      context.beginPath(); context.moveTo(offset, 0); context.lineTo(offset + 1320, 2100); context.stroke();
    }
  }
  context.globalCompositeOperation = "screen";
  context.globalAlpha = intensity * 0.38;
  let grainSeed = 98173;
  for (let i = 0; i < 260; i += 1) {
    grainSeed = (grainSeed * 48271) % 2147483647; const x = grainSeed % 1500;
    grainSeed = (grainSeed * 48271) % 2147483647; const y = grainSeed % 2100;
    const radius = 1 + grainSeed % 5;
    context.fillStyle = i % 4 ? "rgba(255,255,255,.75)" : "rgba(120,255,228,.9)";
    context.fillRect(x, y, radius, radius);
  }
  const glare = context.createRadialGradient(pointer.x * 1500, pointer.y * 2100, 0, pointer.x * 1500, pointer.y * 2100, 720);
  glare.addColorStop(0, "rgba(255,255,255,.9)"); glare.addColorStop(0.26, "rgba(255,255,255,.16)"); glare.addColorStop(1, "rgba(255,255,255,0)");
  context.globalAlpha = intensity * 0.55; context.fillStyle = glare; context.fillRect(0, 0, 1500, 2100);
  context.restore();
}

function drawCardTypography(context, state, metadata, theme) {
  context.fillStyle = "rgba(255,255,255,.72)"; context.font = '600 30px "Geist Mono Variable", monospace';
  context.fillText("burhanpose // player", 126, 150);
  context.textAlign = "right"; context.fillText(state.number || "BP-001", 1372, 150); context.textAlign = "left";
  context.fillStyle = "#ffffff"; context.font = '750 92px "Geist Mono Variable", monospace';
  fitText(context, (state.name || "PLAYER").toUpperCase(), 126, 278, 1240, 92);
  context.fillStyle = theme.accent; context.font = '700 52px "Geist Mono Variable", monospace';
  fitText(context, (state.title || "POSE MASTER").toUpperCase(), 126, 1585, 950, 52);
  context.textAlign = "right"; context.fillStyle = "rgba(255,255,255,.78)"; context.font = '700 30px "Geist Mono Variable", monospace';
  context.fillText(state.foil === "none" ? "STANDARD" : state.foil.toUpperCase(), 1372, 1582); context.textAlign = "left";
  const chips = [(metadata.model || "classic").toUpperCase(), (metadata.pose || "custom").toUpperCase(), metadata.layers3d ? "3D LAYERS" : "OUTER LAYER"];
  let chipX = 126;
  chips.forEach((chip) => { context.font = '650 26px "Geist Mono Variable", monospace'; const width = context.measureText(chip).width + 52; context.fillStyle = "rgba(5,9,6,.66)"; roundedRect(context, chipX, 1660, width, 66, 20); context.fill(); context.strokeStyle = "rgba(255,255,255,.19)"; context.lineWidth = 2; context.stroke(); context.fillStyle = "rgba(255,255,255,.82)"; context.fillText(chip, chipX + 26, 1703); chipX += width + 18; });
  context.strokeStyle = theme.bright; context.globalAlpha = 0.45; context.lineWidth = 3; context.beginPath(); context.moveTo(126, 1822); context.lineTo(1374, 1822); context.stroke(); context.globalAlpha = 1;
  context.fillStyle = "rgba(255,255,255,.52)"; context.font = '600 24px "Geist Mono Variable", monospace'; context.fillText("ORIGINAL PLAYER CARD", 126, 1900);
  context.textAlign = "right"; context.fillText("POSE.BURHAN.MY", 1374, 1900); context.textAlign = "left";
  context.fillStyle = "rgba(255,255,255,.32)"; context.font = '500 20px "Geist Mono Variable", monospace'; context.fillText("DEVELOPED BY MATNEPP FROM BURHANBISTRO<3", 126, 1965);
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath(); context.roundRect(x, y, width, height, radius);
}

function fitText(context, text, x, y, maxWidth, startSize) {
  let size = startSize;
  while (size > 34 && context.measureText(text).width > maxWidth) { size -= 2; context.font = `750 ${size}px "Geist Mono Variable", monospace`; }
  context.fillText(text, x, y);
}

function loadCanvasImage(url) {
  return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("The captured avatar could not be loaded.")); image.src = url; });
}

function safeFilename(value) {
  return (value || "player").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "player";
}
