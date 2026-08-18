import "@fontsource-variable/geist-mono";
import "./style.css";
import { BurhanPoseEditor, POSES } from "./pose-editor.js";

const icon = (name) => {
  const paths = {
    upload: '<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5"/>',
    download: '<path d="M12 4v12m0 0l4.5-4.5M12 16l-4.5-4.5M5 20h14"/>',
    undo: '<path d="M9 7H4v-5M4.5 7.5A8 8 0 1 1 6 18"/>',
    redo: '<path d="M15 7h5v-5m-.5 5.5A8 8 0 1 0 18 18"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5M4 4v4.5h4.5"/>',
    camera: '<path d="M4 7h3l1.5-2h7L17 7h3v11H4z"/><circle cx="12" cy="12.5" r="3.5"/>',
    person: '<circle cx="12" cy="5" r="2.5"/><path d="M8 22l1-7-2-4 3-2h4l3 2-2 4 1 7M9 15h6M7 11l-2 5m12-5 2 5"/>',
    move: '<path d="M12 2v20M2 12h20M12 2l-3 3m3-3 3 3M12 22l-3-3m3 3 3-3M2 12l3-3m-3 3 3 3m17-3-3-3m3 3-3 3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',
    discord: '<path class="icon-fill" d="M18.9 5.3A16 16 0 0 0 15.7 4l-.4.8a14 14 0 0 0-6.6 0L8.3 4a16 16 0 0 0-3.2 1.3C3 8.4 2.4 11.4 2.7 14.4a13 13 0 0 0 4 2l1-1.4a8 8 0 0 1-1.5-.8l.4-.3c2.9 1.3 7.6 1.3 10.4 0l.5.3c-.5.3-1 .6-1.6.8l1 1.4a13 13 0 0 0 4-2c.4-3.5-.7-6.4-2-9.1ZM8.8 13c-1 0-1.7-.9-1.7-2s.8-2 1.7-2c1 0 1.8.9 1.8 2s-.8 2-1.8 2Zm6.4 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.7.9 1.7 2-.8 2-1.7 2Z"/>',
    sparkles: '<path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14ZM5 14l.7 2.1 2.1.7-2.1.7L5 20l-.7-2.5-2.1-.7 2.1-.7L5 14Z"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
};

const poseIcon = (name) => {
  const figures = {
    idle: '<circle cx="16" cy="5" r="2.5"/><path d="M16 8v11m0-7-6 5m6-5 6 5m-6 2-5 10m5-10 5 10"/>',
    stride: '<circle cx="17" cy="5" r="2.5"/><path d="m16 8-2 10m1-6-7 2m7-2 6 5m-7 1-8 8m8-8 7 10"/>',
    wave: '<circle cx="15" cy="6" r="2.5"/><path d="m15 9 1 10m0-7-7-7m7 7 6 5m-6 2-5 10m5-10 6 9"/>',
    hero: '<circle cx="16" cy="5" r="2.5"/><path d="M16 8v11m0-7-7 3 3 5m4-8 7 3-3 5m-4-1-5 10m5-10 5 10"/>',
    run: '<circle cx="20" cy="6" r="2.5"/><path d="m18 9-5 9m3-6-7-2m7 2 7 5m-10 1-9 5m9-5 8 8"/>',
    point: '<circle cx="15" cy="5" r="2.5"/><path d="M15 8v11m0-7-6 5m6-5h13m-13 7-5 10m5-10 5 10"/>',
    jump: '<circle cx="16" cy="7" r="2.5"/><path d="m16 10 0 10m0-7L8 4m8 9 8-9m-8 16-8 7m8-7 8 7"/>',
    crouch: '<circle cx="19" cy="11" r="2.5"/><path d="m17 14-7 6m4-3-6-3m5 4 7 3m-10-1-5 7h8m7-6 5 6h5"/>',
    salute: '<circle cx="16" cy="6" r="2.5"/><path d="M16 9v11m0-8-6 5m6-5 5-4 4 1m-9 11-5 9m5-9 5 9"/>',
    dab: '<circle cx="14" cy="9" r="2.5"/><path d="m16 11 2 9m-1-6-9-5m9 5 10-7m-9 13-7 8m7-8 7 6"/>',
    cheer: '<circle cx="16" cy="8" r="2.5"/><path d="M16 11v10m0-7L7 4m9 10 9-10m-9 17-6 8m6-8 6 8"/>',
    tpose: '<circle cx="16" cy="5" r="2.5"/><path d="M16 8v12M3 13h26M16 20l-6 9m6-9 6 9"/>',
    sit: '<circle cx="14" cy="8" r="2.5"/><path d="m14 11 1 10m0-7-6 5m6-5 6 5m-6 2h9v8m-9-8-6 8"/>',
    easy: '<circle cx="15" cy="6" r="2.5"/><path d="m15 9 2 11m-1-7-6 5m6-5 5 3m-4 4-4 9m4-9 7 8"/>',
    sneak: '<circle cx="21" cy="10" r="2.5"/><path d="m19 13-8 5m4-3-7-3m7 3 8 4m-12-1-7 7m7-7 9 8"/>',
    lie: '<circle cx="27" cy="22" r="2.5"/><path d="M24 22H13m6 0 5-7m-11 7-7-5m7 5-8 5m8-5 8 6"/>',
    landing: '<circle cx="16" cy="10" r="2.5"/><path d="m16 13 0 8m0-6-9 4m9-4 9 4m-9 2-8 6h8m0-6 8 6h5"/>',
    groove: '<circle cx="17" cy="6" r="2.5"/><path d="m16 9-2 11m1-7-8 4m8-4 8-5m-9 12-8 6m8-6 8 8"/>',
  };
  return `<svg viewBox="0 0 32 34" aria-hidden="true">${figures[name] || figures.idle}</svg>`;
};

document.querySelector("#app").innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="burhanpose home">
        <img class="brand-logo" src="/burhan-logo.png" alt="" />
        <span class="brand-name">burhan<span>pose</span></span><small class="beta-badge">Beta</small>
      </a>
      <div class="document-name">
        <span class="status-dot"></span>
        <span id="documentName">Untitled pose</span>
      </div>
      <div class="top-actions">
        <button class="icon-button" id="undoButton" title="Undo (Ctrl+Z)">${icon("undo")}</button>
        <button class="icon-button" id="redoButton" title="Redo (Ctrl+Shift+Z)">${icon("redo")}</button>
        <span class="top-divider"></span>
        <button class="secondary-button" id="frameButton">${icon("camera")} Frame</button>
        <div class="export-controls">
          <select id="exportResolution" aria-label="PNG export resolution" title="PNG export resolution">
            <option value="1024">1K</option>
            <option value="2048" selected>2K</option>
            <option value="4096">4K</option>
          </select>
          <button class="primary-button" id="exportButton">${icon("download")} Export PNG</button>
        </div>
      </div>
    </header>

    <main class="workspace">
      <aside class="panel left-panel">
        <section class="panel-section import-section" data-mobile-panel="character">
          <div class="section-heading"><span>Character</span><span class="step-label">01</span></div>
          <div class="avatar-list" id="avatarList"></div>
          <button class="add-avatar-button" id="addAvatarButton">${icon("plus")} Add avatar</button>
          <form class="username-form" id="usernameForm">
            <label for="usernameInput">Minecraft username</label>
            <div class="input-row">
              <input id="usernameInput" maxlength="16" autocomplete="off" placeholder="e.g. Matnepp" />
              <button type="submit" id="fetchButton">Fetch</button>
            </div>
          </form>
          <div class="or-divider"><span>or</span></div>
          <label class="upload-button" for="skinFile">${icon("upload")} Upload skin PNG</label>
          <input id="skinFile" type="file" accept="image/png" hidden />
          <p class="inline-message" id="importMessage" role="status"></p>
        </section>

        <section class="panel-section poses-section" data-mobile-panel="pose">
          <div class="section-heading"><span>Pose presets</span><span class="step-label">02</span></div>
          <div class="pose-grid" id="poseGrid">
            ${Object.entries(POSES).map(([key, pose], index) => `<button data-pose="${key}" class="${index === 0 ? "active" : ""}"><span class="pose-figure pose-${key}">${poseIcon(key)}</span><span>${pose.label}</span></button>`).join("")}
          </div>
        </section>

        <section class="panel-section layers-section" data-mobile-panel="pose">
          <div class="section-heading"><span>Skin layers</span><span class="step-label">03</span></div>
          <div class="toggle-row layer-toggle"><span><strong>Outer layer</strong><small>Hat, jacket & sleeves</small></span><label class="switch"><input id="outerLayerToggle" type="checkbox" checked><i></i></label></div>
          <div class="toggle-row layer-toggle"><span><strong>3D skin layers</strong><small>Extrude visible outer pixels</small></span><label class="switch"><input id="skinLayers3dToggle" type="checkbox"><i></i></label></div>
          <p class="feature-credit">Inspired by <a href="https://github.com/tr7zw/3d-skin-layers" target="_blank" rel="noopener noreferrer">3D Skin Layers by tr7zw</a>.</p>
        </section>
      </aside>

      <section class="viewport-shell">
        <div class="viewport-toolbar">
          <div class="tool-group">
            <button class="tool active" id="selectTool" title="Pose body parts">${icon("person")}</button>
            <button class="tool" id="moveTool" title="Drag avatars to place them">${icon("move")}</button>
            <span></span>
            <button class="tool" id="resetPoseButton" title="Reset pose">${icon("reset")}</button>
          </div>
        </div>
        <div id="viewport" class="viewport" aria-label="3D character posing viewport"></div>
        <div class="viewport-hint"><kbd>Drag</kbd> orbit <i></i><kbd>Scroll</kbd> zoom <i></i><kbd>Click</kbd> select limb</div>
        <div class="loading-overlay" id="loadingOverlay"><span></span><p>Preparing character</p></div>
      </section>

      <aside class="panel right-panel">
        <section class="panel-section inspector-section" data-mobile-panel="transform">
          <div class="section-heading"><span>Transform</span><span class="selected-chip" id="selectedChip">Head</span></div>
          <div class="transform-targets">
            <button class="active" id="partTargetButton">Selected part</button>
            <button id="avatarTargetButton">Whole avatar</button>
          </div>
          <div class="height-control">
            <div class="property-title"><span>Avatar height</span><button id="groundAvatarButton">Place on floor</button></div>
            <div class="height-inputs">
              <label for="avatarHeight">Y</label>
              <input id="avatarHeight" type="range" min="-4" max="4" value="0" step="0.01">
              <div class="number-wrap"><input id="avatarHeightNumber" type="number" min="-4" max="4" value="0" step="0.01"><span>u</span></div>
            </div>
          </div>
          <div class="selected-part">
            <span class="part-cube"><img id="partPreview" alt="Selected avatar skin" /></span>
            <div><strong id="selectedPartName">Head</strong><small>Rotation pivot</small></div>
            <button class="mini-reset" id="resetPartButton" title="Reset selected part">${icon("reset")}</button>
          </div>
          <div class="rotation-control">
            <div class="property-title"><span>Rotation</span><small>degrees</small></div>
            ${["x", "y", "z"].map((axis) => `
              <div class="axis-row axis-${axis}">
                <label for="rotation-${axis}">${axis.toUpperCase()}</label>
                <input id="rotation-${axis}" type="range" min="-180" max="180" value="0" step="1">
                <div class="number-wrap"><input id="rotation-${axis}-number" type="number" min="-180" max="180" value="0"><span>°</span></div>
              </div>`).join("")}
          </div>
          <div class="inspector-actions">
            <button id="mirrorButton"><span class="mirror-icon">↔</span> Mirror pose</button>
            <button id="resetAllButton">${icon("reset")} Reset all</button>
          </div>
        </section>

        <section class="panel-section scene-section" data-mobile-panel="scene">
          <div class="section-heading"><span>Scene</span><span class="step-label">04</span></div>
          <div class="color-setting">
            <div><strong>Background</strong><small>Canvas color</small></div>
            <div class="color-input-wrap"><input id="backgroundColor" type="color" value="#111512"><span>#111512</span></div>
          </div>
          <div class="slider-setting"><div><strong>Light direction</strong><output id="lightOutput">35°</output></div><input id="lightDirection" type="range" min="-180" max="180" value="35"></div>
        </section>

        <section class="panel-section camera-section" data-mobile-panel="scene">
          <div class="section-heading"><span>Camera</span><span class="step-label">05</span></div>
          <div class="camera-presets">
            <button data-camera="front">Front</button><button data-camera="three-quarter" class="active">3/4</button><button data-camera="profile">Profile</button><button data-camera="isometric">Isometric</button>
          </div>
          <div class="slider-setting"><div><strong>Field of view</strong><output id="fovOutput">35°</output></div><input id="fovSlider" type="range" min="20" max="70" value="35"></div>
        </section>

        <section class="panel-section card-launch-section" data-mobile-panel="card">
          <div class="section-heading"><span>Card studio</span><span class="step-label">06</span></div>
          <p class="card-launch-copy">Use the center viewport as your camera, then turn its composition into a holographic player card.</p>
          <button class="card-launch-button" id="openCardStudioButton">${icon("sparkles")} Create player card</button>
        </section>
      </aside>
      <nav class="mobile-panel-tabs" aria-label="Editor controls">
        <button class="active" data-mobile-tab="character">Character</button>
        <button data-mobile-tab="pose">Pose</button>
        <button data-mobile-tab="transform">Transform</button>
        <button data-mobile-tab="scene">Scene</button>
        <button data-mobile-tab="card">Card</button>
      </nav>
    </main>
    <footer class="statusbar">
      <span>developed by Matnepp from burhanbistro&lt;3</span>
      <a class="discord-link" href="https://discord.burhan.my" target="_blank" rel="noopener noreferrer" aria-label="Join the BurHan Discord" title="Join the BurHan Discord">${icon("discord")}</a>
    </footer>
  </div>
`;

const $ = (selector) => document.querySelector(selector);

function activateMobilePanel(name) {
  document.querySelectorAll("[data-mobile-tab]").forEach((button) => button.classList.toggle("active", button.dataset.mobileTab === name));
  document.querySelectorAll("[data-mobile-panel]").forEach((section) => section.classList.toggle("mobile-active", section.dataset.mobilePanel === name));
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("mobile-empty", !panel.querySelector(".mobile-active")));
}

document.querySelector(".mobile-panel-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-mobile-tab]");
  if (button) activateMobilePanel(button.dataset.mobileTab);
});
activateMobilePanel("character");

const rotationInputs = ["x", "y", "z"].map((axis) => ({
  axis,
  range: $(`#rotation-${axis}`),
  number: $(`#rotation-${axis}-number`),
}));
let updatingInputs = false;
const DEFAULT_AVATAR_NAMES = ["Matnepp", "MoonWiRaja", "AshotSenpai", "Amadszz", "iquzo"];
const defaultAvatarName = DEFAULT_AVATAR_NAMES[Math.floor(Math.random() * DEFAULT_AVATAR_NAMES.length)];
let activeAvatarSnapshot = { name: defaultAvatarName, model: "classic" };
let activePoseLabel = "Idle";

let editor;
editor = new BurhanPoseEditor($("#viewport"), {
  onSelectionChange(part, rotation) {
    $("#selectedPartName").textContent = part.label;
    $("#selectedChip").textContent = part.label;
    $("#partTargetButton").classList.toggle("active", !part.isAvatar);
    $("#avatarTargetButton").classList.toggle("active", Boolean(part.isAvatar));
    updateRotationInputs(rotation);
  },
  onRotationChange(rotation) {
    updateRotationInputs(rotation);
    activatePoseButton();
  },
  onAvatarHeightChange(height) {
    const value = Number(height.toFixed(2));
    $("#avatarHeight").value = value;
    $("#avatarHeightNumber").value = value;
  },
  onAvatarsChange(avatars) {
    renderAvatarList(avatars);
    const active = avatars.find((avatar) => avatar.active);
    if (active) {
      activeAvatarSnapshot = active;
      $("#partPreview").src = active.preview;
      $("#documentName").textContent = `${active.name}'s pose`;
    }
  },
  onExportComplete({ transparent, resolution }) {
    const button = $("#exportButton");
    button.dataset.alphaVerified = String(transparent);
    button.dataset.exportResolution = String(resolution);
    button.innerHTML = `${icon("download")} ${transparent ? `${resolution}px PNG saved` : "PNG saved"}`;
    setTimeout(() => { button.innerHTML = `${icon("download")} Export PNG`; }, 1800);
  },
}, { name:defaultAvatarName, source:"Loading Minecraft profile…" });

let cardStudio = null;
const getCardMetadata = () => ({
    name: activeAvatarSnapshot?.name || "PLAYER",
    model: activeAvatarSnapshot?.model || "classic",
    pose: activePoseLabel,
    layers3d: $("#skinLayers3dToggle").checked && $("#outerLayerToggle").checked,
});

async function getCardStudio() {
  if (cardStudio) return cardStudio;
  const { CardStudio } = await import("./card-studio.js");
  cardStudio = new CardStudio({ editor, getMetadata:getCardMetadata });
  return cardStudio;
}

function renderAvatarList(avatars) {
  $("#avatarList").innerHTML = avatars.map((avatar) => `
    <div class="skin-card ${avatar.active ? "active" : ""}" data-avatar-id="${avatar.id}">
      <button class="avatar-select" aria-label="Select ${avatar.name}">
        <span class="skin-avatar"><img alt="${avatar.name} skin face" src="${avatar.preview}" /></span>
        <span class="skin-meta"><strong>${avatar.name}</strong><small>${avatar.source}</small></span>
      </button>
      <button class="avatar-delete" data-delete-avatar="${avatar.id}" aria-label="Delete ${avatar.name}" title="Delete avatar" ${avatars.length === 1 ? "disabled" : ""}>${icon("trash")}</button>
    </div>`).join("");
}
function updateRotationInputs(rotation) {
  updatingInputs = true;
  rotationInputs.forEach(({ axis, range, number }) => {
    const value = Math.round(rotation[axis]);
    range.value = value;
    number.value = value;
  });
  updatingInputs = false;
}

rotationInputs.forEach(({ axis, range, number }) => {
  const change = (event) => {
    if (updatingInputs) return;
    const value = Number(event.target.value);
    range.value = value;
    number.value = value;
    editor.setSelectedRotation(axis, value);
  };
  range.addEventListener("input", change);
  range.addEventListener("change", () => editor.commitHistory());
  number.addEventListener("change", change);
  number.addEventListener("change", () => editor.commitHistory());
});

const updateAvatarHeight = (event) => {
  const value = Number(event.target.value);
  $("#avatarHeight").value = value;
  $("#avatarHeightNumber").value = value;
  editor.setAvatarHeight(value);
};
$("#avatarHeight").addEventListener("input", updateAvatarHeight);
$("#avatarHeight").addEventListener("change", () => editor.commitHistory());
$("#avatarHeightNumber").addEventListener("change", updateAvatarHeight);
$("#avatarHeightNumber").addEventListener("change", () => editor.commitHistory());
$("#groundAvatarButton").addEventListener("click", () => editor.placeOnGround());

$("#skinFile").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  setMessage("Loading uploaded skin…", "loading");
  try {
    const result = await editor.loadSkinFile(file);
    setSkinIdentity(file.name.replace(/\.png$/i, ""), `Uploaded · ${result.model}`);
    setMessage(`Detected ${result.model} model.`, "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
  event.target.value = "";
});

$("#usernameForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = $("#usernameInput").value.trim();
  if (!username) return setMessage("Enter a Minecraft Java username.", "error");
  const button = $("#fetchButton");
  button.disabled = true;
  button.textContent = "…";
  setMessage(`Fetching ${username}…`, "loading");
  try {
    const result = await editor.loadSkinUsername(username);
    setSkinIdentity(result.name, `Minecraft profile · ${result.model}`);
    setMessage(`Loaded ${result.name} as ${result.model}.`, "success");
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Fetch";
  }
});

function setSkinIdentity(name, source) {
  editor.setAvatarIdentity(name, source);
}

function setMessage(message, type = "") {
  const element = $("#importMessage");
  element.textContent = message;
  element.className = `inline-message ${type}`;
}

function profileCandidates(preferred) {
  const remaining = DEFAULT_AVATAR_NAMES.filter((name) => name !== preferred).sort(() => Math.random() - 0.5);
  return [preferred, ...remaining];
}

async function loadApprovedSkin(preferred) {
  for (const username of profileCandidates(preferred)) {
    editor.setAvatarIdentity(username, "Loading Minecraft profile…");
    try {
      const result = await editor.loadSkinUsername(username);
      setSkinIdentity(result.name, `Minecraft profile · ${result.model}`);
      $("#usernameInput").placeholder = `e.g. ${username}`;
      return true;
    } catch {
      // Try another approved default when a profile service is temporarily unavailable.
    }
  }
  editor.setAvatarIdentity(preferred, "Profile temporarily unavailable");
  return false;
}

async function loadDefaultAvatar() {
  const loaded = await loadApprovedSkin(defaultAvatarName);
  setMessage(loaded ? "" : "Default skin could not be fetched. You can retry or upload a PNG.", loaded ? "" : "error");
}

function activatePoseButton(name) {
  activePoseLabel = name ? (POSES[name]?.label || "Custom") : "Custom";
  document.querySelectorAll("[data-pose]").forEach((button) => button.classList.toggle("active", button.dataset.pose === name));
}

$("#avatarList").addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-avatar]");
  if (deleteButton) {
    if (editor.removeAvatar(deleteButton.dataset.deleteAvatar)) setMessage("Avatar removed.", "success");
    return;
  }
  const card = event.target.closest("[data-avatar-id]");
  if (card) editor.activateAvatar(card.dataset.avatarId);
});

$("#addAvatarButton").addEventListener("click", async () => {
  const button = $("#addAvatarButton");
  const username = DEFAULT_AVATAR_NAMES[Math.floor(Math.random() * DEFAULT_AVATAR_NAMES.length)];
  button.disabled = true;
  editor.addAvatar({ name:username, source:"Loading Minecraft profile…", visible:false });
  setMessage(`Loading ${username}…`, "loading");
  const loaded = await loadApprovedSkin(username);
  setMessage(loaded ? "Avatar added. Choose Move, then drag it into place." : "Avatar profile could not be fetched.", loaded ? "success" : "error");
  button.disabled = false;
});

function setTool(mode) {
  editor.setInteractionMode(mode);
  $("#selectTool").classList.toggle("active", mode === "pose");
  $("#moveTool").classList.toggle("active", mode === "move");
  document.querySelector(".viewport-hint").innerHTML = mode === "move"
    ? "<kbd>Drag avatar</kbd> place <i></i><kbd>Scroll</kbd> zoom"
    : "<kbd>Drag</kbd> orbit <i></i><kbd>Scroll</kbd> zoom <i></i><kbd>Click</kbd> select limb";
}

$("#selectTool").addEventListener("click", () => setTool("pose"));
$("#moveTool").addEventListener("click", () => setTool("move"));
$("#partTargetButton").addEventListener("click", () => editor.selectPart(editor.lastPartKey || "head"));
$("#avatarTargetButton").addEventListener("click", () => editor.selectPart("avatar"));

$("#poseGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-pose]");
  if (!button) return;
  editor.applyPose(button.dataset.pose);
  activatePoseButton(button.dataset.pose);
});

$("#outerLayerToggle").addEventListener("change", (event) => editor.setOuterLayer(event.target.checked));
$("#skinLayers3dToggle").addEventListener("change", (event) => editor.set3dSkinLayers(event.target.checked));
$("#backgroundColor").addEventListener("input", (event) => {
  editor.setBackground(event.target.value);
  event.target.nextElementSibling.textContent = event.target.value.toUpperCase();
});
$("#lightDirection").addEventListener("input", (event) => {
  editor.setLightDirection(Number(event.target.value));
  $("#lightOutput").textContent = `${event.target.value}°`;
});
$("#fovSlider").addEventListener("input", (event) => {
  editor.setFov(Number(event.target.value));
  $("#fovOutput").textContent = `${event.target.value}°`;
});
document.querySelector(".camera-presets").addEventListener("click", (event) => {
  const button = event.target.closest("[data-camera]");
  if (!button) return;
  editor.setCameraPreset(button.dataset.camera);
  document.querySelectorAll("[data-camera]").forEach((item) => item.classList.toggle("active", item === button));
  $("#fovSlider").disabled = button.dataset.camera === "isometric";
});

$("#frameButton").addEventListener("click", () => editor.frameCharacter());
$("#resetPoseButton").addEventListener("click", () => { editor.applyPose("idle"); activatePoseButton("idle"); });
$("#resetAllButton").addEventListener("click", () => { editor.applyPose("idle"); activatePoseButton("idle"); });
$("#resetPartButton").addEventListener("click", () => editor.resetSelectedPart());
$("#mirrorButton").addEventListener("click", () => editor.mirrorPose());
$("#undoButton").addEventListener("click", () => editor.undo());
$("#redoButton").addEventListener("click", () => editor.redo());
$("#exportButton").addEventListener("click", async () => {
  const button = $("#exportButton");
  button.disabled = true;
  button.innerHTML = `${icon("download")} Rendering…`;
  try {
    await editor.exportPng(Number($("#exportResolution").value));
  } catch (error) {
    setMessage(error.message || "PNG export failed.", "error");
    button.innerHTML = `${icon("download")} Export PNG`;
  } finally {
    button.disabled = false;
  }
});

$("#openCardStudioButton").addEventListener("click", async () => {
  const button = $("#openCardStudioButton");
  button.disabled = true;
  button.innerHTML = `${icon("sparkles")} Capturing pose…`;
  try {
    const studio = await getCardStudio();
    await studio.open();
  } finally {
    button.disabled = false;
    button.innerHTML = `${icon("sparkles")} Create player card`;
  }
});

window.addEventListener("keydown", (event) => {
  if (!(event.ctrlKey || event.metaKey)) return;
  if (event.key.toLowerCase() === "z") {
    event.preventDefault();
    event.shiftKey ? editor.redo() : editor.undo();
  }
});

requestAnimationFrame(() => {
  $("#loadingOverlay").classList.add("hidden");
  editor.selectPart("head");
  loadDefaultAvatar();
});
