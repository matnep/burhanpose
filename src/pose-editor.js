import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DEG = Math.PI / 180;
const SKIN_SIZE = 64;
// Adjacent parts meet exactly. The outer shells expand away from joints so
// their visible faces share an edge without overlapping or exposing a seam.
const JOINT_GAP = 0;
const OUTER_LAYER_TOTAL = 0.0625;
const OUTER_LAYER_SIDE = OUTER_LAYER_TOTAL / 2;
const JOINT_TRIM = JOINT_GAP / 2;
const LIMB_OUTER_EXPANSION = OUTER_LAYER_SIDE - JOINT_TRIM;
const LIMB_OUTER_OFFSET = (OUTER_LAYER_SIDE + JOINT_TRIM) / 2;

export const POSES = {
  idle: { label: "Idle", parts: { torso: [0, -3, 2], head: [-2, 5, -2], leftArm: [4, -2, -5], rightArm: [-3, 2, 4], leftLeg: [2, 0, -2], rightLeg: [-2, 0, 2] } },
  stride: { label: "Stride", parts: { torso: [4, -6, 3], head: [-4, 8, -2], leftArm: [-34, -4, -8], rightArm: [30, 4, 9], leftLeg: [34, 0, -4], rightLeg: [-30, 0, 5] } },
  wave: { label: "Wave", parts: { torso: [0, -8, 4], head: [-6, 16, -4], leftArm: [-142, -12, -22], rightArm: [10, 8, 10], leftLeg: [5, 0, -5], rightLeg: [-7, 0, 7] } },
  hero: { label: "Hero", parts: { torso: [-5, -12, 2], head: [-6, 15, -2], leftArm: [12, -8, -30], rightArm: [8, 8, 30], leftLeg: [6, 0, -8], rightLeg: [-9, 0, 11] } },
  run: { label: "Run", parts: { torso: [15, -12, 4], head: [-11, 14, -4], leftArm: [-58, -7, -12], rightArm: [62, 8, 14], leftLeg: [58, 0, -6], rightLeg: [-54, 0, 8] } },
  point: { label: "Point", parts: { torso: [1, -14, 3], head: [-4, -28, -3], leftArm: [16, 10, -12], rightArm: [-92, -12, 5], leftLeg: [5, 0, -5], rightLeg: [-6, 0, 7] } },
  jump: { label: "Jump", parts: { torso: [-8, 4, 2], head: [-12, -6, -2], leftArm: [-156, -12, -24], rightArm: [-150, 14, 26], leftLeg: [26, 0, -15], rightLeg: [-34, 0, 18] } },
  crouch: { label: "Crouch", parts: { torso: [24, -8, 4], head: [-16, 12, -4], leftArm: [-28, -12, -18], rightArm: [-38, 14, 20], leftLeg: [-42, 0, -14], rightLeg: [-52, 0, 16] } },
  salute: { label: "Salute", parts: { torso: [0, -8, 3], head: [-5, 14, -3], leftArm: [8, 7, -10], rightArm: [-114, -20, 34], leftLeg: [4, 0, -5], rightLeg: [-6, 0, 7] } },
  dab: { label: "Dab", parts: { torso: [2, -13, 7], head: [18, -28, -12], leftArm: [-122, -20, -48], rightArm: [-76, 28, 60], leftLeg: [8, 0, -9], rightLeg: [-11, 0, 13] } },
  cheer: { label: "Cheer", parts: { torso: [-6, 7, -3], head: [-12, -8, 3], leftArm: [-154, -10, -30], rightArm: [-140, 14, 34], leftLeg: [13, 0, -9], rightLeg: [-18, 0, 12] } },
  tpose: { label: "T-pose", parts: { leftArm: [0, 0, 90], rightArm: [0, 0, -90] } },
  sit: { label: "Sit", parts: { torso: [5, -7, 3], head: [-2, 10, -3], leftArm: [-18, -8, -12], rightArm: [-10, 10, 13], leftLeg: [-92, 0, -4], rightLeg: [-86, 0, 5] } },
  easy: { label: "Easy", parts: { torso: [0, -9, 6], head: [-4, 13, -6], leftArm: [10, -7, -14], rightArm: [-8, 8, 12], leftLeg: [6, 0, -6], rightLeg: [-8, 0, 9] } },
  sneak: { label: "Sneak", parts: { torso: [26, -10, 4], head: [-17, 16, -5], leftArm: [-42, -14, -22], rightArm: [-62, 16, 26], leftLeg: [42, 0, -13], rightLeg: [-35, 0, 15] } },
  lie: { label: "Lie down", avatar: [-90, 0, 0], parts: { torso: [2, -3, 0], head: [-5, 8, -2], leftArm: [18, -5, -24], rightArm: [12, 7, 22], leftLeg: [7, 0, -7], rightLeg: [-5, 0, 8] } },
  landing: { label: "Landing", parts: { torso: [31, 8, -6], head: [-21, -12, 8], leftArm: [-54, -13, -46], rightArm: [-58, 15, 43], leftLeg: [-46, 0, -18], rightLeg: [-62, 0, 21] } },
  groove: { label: "Groove", parts: { torso: [6, -22, 12], head: [7, 28, -11], leftArm: [-64, -26, -42], rightArm: [22, 22, 34], leftLeg: [22, 0, -15], rightLeg: [-19, 0, 17] } },
};

const PART_LABELS = {
  head: "Head",
  torso: "Torso",
  leftArm: "Left arm",
  rightArm: "Right arm",
  leftLeg: "Left leg",
  rightLeg: "Right leg",
};

const UV = {
  head: skinBoxUv(0, 0, 8, 8, 8),
  headOuter: skinBoxUv(32, 0, 8, 8, 8),
  torso: skinBoxUv(16, 16, 8, 12, 4),
  torsoOuter: skinBoxUv(16, 32, 8, 12, 4),
  rightArm: skinBoxUv(40, 16, 4, 12, 4),
  rightArmOuter: skinBoxUv(40, 32, 4, 12, 4),
  leftArm: skinBoxUv(32, 48, 4, 12, 4),
  leftArmOuter: skinBoxUv(48, 48, 4, 12, 4),
  rightLeg: skinBoxUv(0, 16, 4, 12, 4),
  rightLegOuter: skinBoxUv(0, 32, 4, 12, 4),
  leftLeg: skinBoxUv(16, 48, 4, 12, 4),
  leftLegOuter: skinBoxUv(0, 48, 4, 12, 4),
};

export class BurhanPoseEditor {
  constructor(container, callbacks = {}, initialAvatar = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.model = "classic";
    this.avatars = [];
    this.avatarCounter = 0;
    this.activeAvatar = null;
    this.interactionMode = "pose";
    this.avatarDrag = null;
    this.parts = {};
    this.selectedKey = null;
    this.lastPartKey = "head";
    this.outerMeshes = [];
    this.history = [];
    this.future = [];
    this.poseRootOverride = false;
    this.exporting = false;
    this.background = new THREE.Color("#111512");
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.scene.background = this.background;
    this.perspectiveCamera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);
    this.perspectiveCamera.position.set(5.3, 3.3, 7.1);
    this.orthographicCamera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.05, 100);
    this.orthographicCamera.position.copy(this.perspectiveCamera.position);
    this.orthographicHeight = 5.4;
    this.camera = this.perspectiveCamera;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.target.set(0, 2, 0);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.minDistance = 3.8;
    this.orbit.maxDistance = 14;
    this.orbit.maxPolarAngle = Math.PI * 0.94;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x63705d, 2.1));
    this.keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    this.keyLight.position.set(4, 7, 5);
    this.scene.add(this.keyLight);
    const rim = new THREE.DirectionalLight(0xc9f7a9, 1.1);
    rim.position.set(-4, 3, -5);
    this.scene.add(rim);

    this.addAvatar({
      name: initialAvatar.name || "Matnepp",
      source: initialAvatar.source || "Loading Minecraft profile…",
      texture: this.createEmptyTexture(),
      model: "classic",
      visible: false,
    }, false);
    this.setCameraPreset("three-quarter", false);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.renderer.domElement.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.renderer.domElement.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.renderer.domElement.addEventListener("pointerup", () => this.onPointerUp());
    this.renderer.domElement.addEventListener("pointercancel", () => this.onPointerUp());
    this.animate();
    this.commitHistory();
  }

  addAvatar(options = {}, frame = true) {
    const id = `avatar-${++this.avatarCounter}`;
    const avatar = {
      id,
      name: options.name || `Avatar ${this.avatarCounter}`,
      source: options.source || "Loading Minecraft profile…",
      model: options.model || "classic",
      texture: options.texture || this.createEmptyTexture(),
      character: null,
      parts: {},
      outerMeshes: [],
      history: [],
      future: [],
      selectedKey: "head",
    };
    this.avatars.push(avatar);
    this.activateAvatar(id, false);
    this.buildCharacter();
    avatar.character.position.x = (this.avatars.length - 1) * 2.5;
    avatar.character.visible = options.visible !== false;
    this.commitHistory();
    this.emitAvatarsChange();
    if (frame) this.frameCharacter();
    return id;
  }

  removeAvatar(id) {
    if (this.avatars.length <= 1) return false;
    const index = this.avatars.findIndex((avatar) => avatar.id === id);
    if (index < 0) return false;
    const [removed] = this.avatars.splice(index, 1);
    if (removed.character) {
      this.scene.remove(removed.character);
      removed.character.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        object.material.dispose();
      });
    }
    removed.texture?.dispose();
    if (removed === this.activeAvatar) {
      const next = this.avatars[Math.min(index, this.avatars.length - 1)];
      this.activateAvatar(next.id, false);
    }
    this.emitAvatarsChange();
    this.frameCharacter();
    return true;
  }

  activateAvatar(id, notify = true) {
    const avatar = this.avatars.find((item) => item.id === id);
    if (!avatar) return;
    this.activeAvatar = avatar;
    this.character = avatar.character;
    this.parts = avatar.parts;
    this.outerMeshes = avatar.outerMeshes;
    this.texture = avatar.texture;
    this.model = avatar.model;
    this.history = avatar.history;
    this.future = avatar.future;
    this.selectedKey = avatar.selectedKey;
    if (avatar.character) this.selectPart(this.selectedKey || "head");
    this.emitAvatarHeight();
    if (notify) this.emitAvatarsChange();
  }

  emitAvatarsChange() {
    this.callbacks.onAvatarsChange?.(this.avatars.map((avatar) => ({
      id: avatar.id,
      name: avatar.name,
      source: avatar.source,
      model: avatar.model,
      active: avatar === this.activeAvatar,
      preview: this.getFacePreview(avatar.texture),
    })));
  }

  setAvatarIdentity(name, source) {
    if (!this.activeAvatar) return;
    this.activeAvatar.name = name;
    this.activeAvatar.source = source;
    this.emitAvatarsChange();
  }

  setInteractionMode(mode) {
    this.interactionMode = mode === "move" ? "move" : "pose";
    this.orbit.enabled = this.interactionMode !== "move";
  }

  createEmptyTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 64, 64);
    return this.textureFromCanvas(canvas);
  }

  textureFromCanvas(canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    texture.userData.sourceCanvas = canvas;
    return texture;
  }

  buildCharacter() {
    const previousPosition = this.character?.position.clone() || new THREE.Vector3();
    if (this.character) {
      this.scene.remove(this.character);
    }
    this.parts = {};
    this.outerMeshes = [];
    this.character = new THREE.Group();
    this.character.name = this.activeAvatar?.name || "Character";
    this.character.userData.avatarId = this.activeAvatar?.id;
    this.character.position.copy(previousPosition);
    this.scene.add(this.character);

    this.makePart("torso", [1, 1.5, 0.5], [0, 3, 0], [0, -0.75, 0], UV.torso, UV.torsoOuter, {
      expansion: [JOINT_GAP, JOINT_GAP, OUTER_LAYER_TOTAL],
    });
    this.makePart("head", [1, 1, 1], [0, 3 + JOINT_GAP, 0], [0, 0.5, 0], UV.head, UV.headOuter, {
      expansion: [0.125, 0.125, 0.125],
    });

    const armWidth = this.model === "slim" ? 0.375 : 0.5;
    const armX = 0.5 + armWidth / 2 + JOINT_GAP;
    const shoulderY = this.model === "slim" ? 2.9375 : 3;
    const armPixels = this.model === "slim" ? 3 : 4;
    const leftArmUv = skinBoxUv(32, 48, armPixels, 12, 4);
    const leftArmOuterUv = skinBoxUv(48, 48, armPixels, 12, 4);
    const rightArmUv = skinBoxUv(40, 16, armPixels, 12, 4);
    const rightArmOuterUv = skinBoxUv(40, 32, armPixels, 12, 4);
    const leftLimbOuter = {
      expansion: [LIMB_OUTER_EXPANSION, LIMB_OUTER_EXPANSION, OUTER_LAYER_TOTAL],
      offset: [LIMB_OUTER_OFFSET, -LIMB_OUTER_OFFSET, 0],
    };
    const rightLimbOuter = {
      expansion: [LIMB_OUTER_EXPANSION, LIMB_OUTER_EXPANSION, OUTER_LAYER_TOTAL],
      offset: [-LIMB_OUTER_OFFSET, -LIMB_OUTER_OFFSET, 0],
    };
    this.makePart("leftArm", [armWidth, 1.5, 0.5], [armX, shoulderY, 0], [0, -0.75, 0], leftArmUv, leftArmOuterUv, leftLimbOuter);
    this.makePart("rightArm", [armWidth, 1.5, 0.5], [-armX, shoulderY, 0], [0, -0.75, 0], rightArmUv, rightArmOuterUv, rightLimbOuter);
    this.makePart("leftLeg", [0.5, 1.5, 0.5], [0.25 + JOINT_GAP / 2, 1.5 - JOINT_GAP, 0], [0, -0.75, 0], UV.leftLeg, UV.leftLegOuter, leftLimbOuter);
    this.makePart("rightLeg", [0.5, 1.5, 0.5], [-0.25 - JOINT_GAP / 2, 1.5 - JOINT_GAP, 0], [0, -0.75, 0], UV.rightLeg, UV.rightLegOuter, rightLimbOuter);

    if (this.activeAvatar) {
      this.activeAvatar.character = this.character;
      this.activeAvatar.parts = this.parts;
      this.activeAvatar.outerMeshes = this.outerMeshes;
      this.activeAvatar.texture = this.texture;
      this.activeAvatar.model = this.model;
    }
    this.selectPart(this.selectedKey || "head");
  }

  makePart(key, size, pivotPosition, meshPosition, uv, outerUv, outerOptions = {}) {
    const pivot = new THREE.Group();
    pivot.position.set(...pivotPosition);
    pivot.userData = { partKey: key, label: PART_LABELS[key] };
    this.character.add(pivot);
    this.parts[key] = pivot;

    const mesh = this.makeBox(size, uv, false);
    mesh.position.set(...meshPosition);
    mesh.userData.partKey = key;
    mesh.userData.avatarId = this.activeAvatar?.id;
    pivot.add(mesh);

    const expansion = outerOptions.expansion || [OUTER_LAYER_TOTAL, OUTER_LAYER_TOTAL, OUTER_LAYER_TOTAL];
    const offset = outerOptions.offset || [0, 0, 0];
    const outerSize = size.map((value, axis) => value + expansion[axis]);
    const outer = this.makeBox(outerSize, outerUv, true);
    outer.position.set(...meshPosition.map((value, axis) => value + offset[axis]));
    outer.userData.partKey = key;
    outer.userData.avatarId = this.activeAvatar?.id;
    outer.renderOrder = 1;
    pivot.add(outer);
    this.outerMeshes.push(outer);
  }

  makeBox(size, uvMap, transparent) {
    const geometry = new THREE.BoxGeometry(...size);
    applyBoxUv(geometry, uvMap);
    const material = new THREE.MeshStandardMaterial({
      map: this.texture,
      // Base skin pixels are opaque, while hats/jackets/sleeves/trousers may
      // contain genuinely translucent pixels (for example tinted glasses).
      transparent,
      alphaTest: transparent ? 0.001 : 0,
      depthWrite: true,
      roughness: 0.82,
      metalness: 0,
      side: THREE.FrontSide,
      // The torso shell is intentionally flush on joint-facing axes. Bias its
      // fragments toward the camera so those coincident shell/base faces do
      // not flicker while adjacent parts remain geometrically disjoint.
      polygonOffset: transparent,
      polygonOffsetFactor: transparent ? -1 : 0,
      polygonOffsetUnits: transparent ? -1 : 0,
    });
    material.userData.baseEmissive = new THREE.Color(0x000000);
    return new THREE.Mesh(geometry, material);
  }

  selectPart(key) {
    const part = key === "avatar" ? this.character : this.parts[key];
    if (!part) return;
    this.selectedKey = key;
    if (key !== "avatar") this.lastPartKey = key;
    if (this.activeAvatar) this.activeAvatar.selectedKey = key;
    this.avatars.forEach((avatar) => avatar.character?.traverse((object) => {
      if (!object.isMesh) return;
      const selected = avatar === this.activeAvatar && (key === "avatar" || object.userData.partKey === key);
      object.material.emissive.set(selected ? 0x243218 : 0x000000);
      object.material.emissiveIntensity = selected ? 0.28 : 0;
    }));
    const selection = key === "avatar" ? { partKey:"avatar", label:"Whole avatar", isAvatar:true } : part.userData;
    this.callbacks.onSelectionChange?.(selection, this.getSelectedRotation());
  }

  onPointerDown(event) {
    if (event.button !== 0) return;
    this.updatePointer(event);
    const roots = this.avatars.map((avatar) => avatar.character).filter(Boolean);
    const hits = this.raycaster.intersectObjects(roots, true).filter((item) => item.object.userData.partKey);
    const hit = this.interactionMode === "move"
      ? hits.find((item) => item.object.userData.avatarId === this.activeAvatar?.id) || hits[0]
      : hits[0];
    if (!hit) return;
    const avatarId = hit.object.userData.avatarId;
    if (avatarId && avatarId !== this.activeAvatar?.id) this.activateAvatar(avatarId);
    if (this.interactionMode === "move") {
      const point = this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
      if (!point) return;
      this.avatarDrag = { offset: this.character.position.clone().sub(point), height:this.character.position.y };
      this.orbit.enabled = false;
      this.renderer.domElement.setPointerCapture?.(event.pointerId);
      return;
    }
    this.selectPart(hit.object.userData.partKey);
  }

  updatePointer(event) {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  onPointerMove(event) {
    if (!this.avatarDrag || !this.character) return;
    this.updatePointer(event);
    const point = this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    if (!point) return;
    const next = point.add(this.avatarDrag.offset);
    this.character.position.set(next.x, this.avatarDrag.height, next.z);
    this.emitAvatarHeight();
    this.emitAvatarsChange();
  }

  onPointerUp() {
    if (!this.avatarDrag) return;
    this.avatarDrag = null;
    this.orbit.enabled = this.interactionMode !== "move";
    this.commitHistory();
  }

  getSelectedRotation() {
    const rotation = (this.selectedKey === "avatar" ? this.character : this.parts[this.selectedKey])?.rotation || { x:0, y:0, z:0 };
    return { x: rotation.x / DEG, y: rotation.y / DEG, z: rotation.z / DEG };
  }

  emitRotation() { this.callbacks.onRotationChange?.(this.getSelectedRotation()); }

  setSelectedRotation(axis, degrees) {
    const part = this.selectedKey === "avatar" ? this.character : this.parts[this.selectedKey];
    if (!part) return;
    part.rotation[axis] = THREE.MathUtils.clamp(degrees, -180, 180) * DEG;
    this.emitRotation();
  }

  resetSelectedPart() {
    const part = this.selectedKey === "avatar" ? this.character : this.parts[this.selectedKey];
    if (!part) return;
    part.rotation.set(0, 0, 0);
    this.emitRotation();
    this.commitHistory();
  }

  getPose() {
    return {
      _avatar: [this.character.rotation.x, this.character.rotation.y, this.character.rotation.z],
      _position: [this.character.position.x, this.character.position.y, this.character.position.z],
      ...Object.fromEntries(Object.entries(this.parts).map(([key, part]) => [key, [part.rotation.x, part.rotation.y, part.rotation.z]])),
    };
  }

  setPose(pose, record = true) {
    if (pose._avatar) this.character.rotation.set(...pose._avatar);
    if (pose._position) this.character.position.set(...pose._position);
    Object.entries(this.parts).forEach(([key, part]) => {
      const rotation = pose[key] || [0, 0, 0];
      part.rotation.set(...rotation);
    });
    this.emitRotation();
    this.emitAvatarHeight();
    if (record) this.commitHistory();
  }

  applyPose(name) {
    const preset = POSES[name] || POSES.idle;
    const pose = {};
    Object.keys(this.parts).forEach((key) => { pose[key] = (preset.parts[key] || [0,0,0]).map((value) => value * DEG); });
    if (preset.avatar) {
      pose._avatar = preset.avatar.map((value) => value * DEG);
      this.poseRootOverride = true;
    } else if (this.poseRootOverride) {
      pose._avatar = [0, 0, 0];
      this.poseRootOverride = false;
    }
    this.setPose(pose, false);
    this.placeOnGround(false);
    this.commitHistory();
  }

  mirrorPose() {
    const pose = this.getPose();
    const mirrored = { _avatar:pose._avatar, _position:pose._position };
    const pair = { leftArm:"rightArm", rightArm:"leftArm", leftLeg:"rightLeg", rightLeg:"leftLeg" };
    Object.keys(this.parts).forEach((key) => {
      const source = pose[pair[key] || key];
      mirrored[key] = [source[0], -source[1], -source[2]];
    });
    this.setPose(mirrored);
  }

  commitHistory() {
    const state = JSON.stringify(this.getPose());
    if (this.history.at(-1) === state) return;
    this.history.push(state);
    if (this.history.length > 60) this.history.shift();
    this.future.length = 0;
  }

  undo() {
    if (this.history.length < 2) return;
    this.future.push(this.history.pop());
    this.setPose(JSON.parse(this.history.at(-1)), false);
  }

  redo() {
    const state = this.future.pop();
    if (!state) return;
    this.history.push(state);
    this.setPose(JSON.parse(state), false);
  }

  async loadSkinFile(file) {
    if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) throw new Error("Choose a PNG skin file.");
    const image = await loadImage(URL.createObjectURL(file));
    return this.loadSkinImage(image);
  }

  async loadSkinUsername(username) {
    const refresh = Date.now();
    const response = await fetch(`/api/skin/${encodeURIComponent(username)}?refresh=${refresh}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Could not fetch this Minecraft skin.");
    }
    const model = response.headers.get("X-Skin-Model") || undefined;
    const name = response.headers.get("X-Player-Name") || username;
    const image = await loadImage(URL.createObjectURL(await response.blob()));
    const loaded = await this.loadSkinImage(image, model);
    return { name, model: loaded.model };
  }

  loadSkinImage(image, suppliedModel) {
    if (image.width !== 64 || ![32, 64].includes(image.height)) throw new Error("Choose a 64×64 or legacy 64×32 Java skin.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    if (image.height === 32) upgradeLegacySkin(ctx);
    const model = suppliedModel || (image.height === 32 ? "classic" : (detectSlim(ctx) ? "slim" : "classic"));
    this.texture.dispose();
    this.texture = this.textureFromCanvas(canvas);
    this.model = model;
    this.activeAvatar.texture = this.texture;
    this.activeAvatar.model = model;
    const pose = this.getPose();
    this.buildCharacter();
    this.character.visible = true;
    this.setPose(pose, false);
    this.emitAvatarsChange();
    return { model };
  }

  getFacePreview(texture = this.texture) {
    const source = texture.userData.sourceCanvas;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    context.drawImage(source, 8, 8, 8, 8, 0, 0, 64, 64);
    context.drawImage(source, 40, 8, 8, 8, 0, 0, 64, 64);
    return canvas.toDataURL("image/png");
  }

  setModel(model) {
    if (model === this.model) return;
    const pose = this.getPose();
    this.model = model;
    this.activeAvatar.model = model;
    this.buildCharacter();
    this.setPose(pose, false);
    this.emitAvatarsChange();
  }

  setOuterLayer(visible) { this.outerMeshes.forEach((mesh) => { mesh.visible = visible; }); }
  setBackground(color) { this.background.set(color); this.scene.background = this.background; }
  setLightDirection(degrees) {
    const radians = degrees * DEG;
    this.keyLight.position.set(Math.sin(radians) * 6, 7, Math.cos(radians) * 6);
  }
  setFov(value) {
    this.perspectiveCamera.fov = value;
    this.perspectiveCamera.updateProjectionMatrix();
  }

  emitAvatarHeight() { this.callbacks.onAvatarHeightChange?.(this.character?.position.y || 0); }

  setAvatarHeight(value, record = false) {
    if (!this.character) return;
    this.character.position.y = THREE.MathUtils.clamp(Number(value) || 0, -4, 4);
    this.emitAvatarHeight();
    if (record) this.commitHistory();
  }

  placeOnGround(record = true) {
    if (!this.character) return;
    const bounds = new THREE.Box3().setFromObject(this.character);
    if (Number.isFinite(bounds.min.y)) this.character.position.y -= bounds.min.y;
    this.emitAvatarHeight();
    if (record) this.commitHistory();
  }

  setCameraPreset(preset, animate = true) {
    const isometric = preset === "isometric";
    const nextCamera = isometric ? this.orthographicCamera : this.perspectiveCamera;
    if (nextCamera !== this.camera) {
      nextCamera.position.copy(this.camera.position);
      nextCamera.quaternion.copy(this.camera.quaternion);
      this.camera = nextCamera;
      this.orbit.object = nextCamera;
      this.cameraTransition = null;
    }
    const positions = { front:[0, 2.15, 8.4], "three-quarter":[5.3, 3.3, 7.1], profile:[8.4, 2.15, 0], isometric:[6.6, 6.6, 6.6] };
    const targetPosition = new THREE.Vector3(...positions[preset]);
    const targetLook = new THREE.Vector3(0, 2, 0);
    if (isometric) this.updateOrthographicProjection();
    if (!animate) {
      this.camera.position.copy(targetPosition);
      this.orbit.target.copy(targetLook);
      this.orbit.update();
      return;
    }
    this.cameraTransition = { start:performance.now(), duration:420, from:this.camera.position.clone(), to:targetPosition, lookFrom:this.orbit.target.clone(), lookTo:targetLook };
  }

  frameCharacter() {
    const box = new THREE.Box3();
    this.avatars.forEach((avatar) => { if (avatar.character) box.expandByObject(avatar.character); });
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const direction = this.camera.position.clone().sub(this.orbit.target).normalize();
    if (this.camera.isOrthographicCamera) {
      this.orthographicHeight = Math.max(2.5, sphere.radius * 2.45);
      this.updateOrthographicProjection();
      this.cameraTransition = {
        start:performance.now(), duration:380, from:this.camera.position.clone(),
        to:sphere.center.clone().add(direction.multiplyScalar(10)),
        lookFrom:this.orbit.target.clone(), lookTo:sphere.center.clone(),
      };
      return;
    }
    const fov = this.perspectiveCamera.fov * DEG;
    const distance = sphere.radius / Math.sin(fov / 2) * 1.12;
    this.cameraTransition = {
      start:performance.now(), duration:380, from:this.camera.position.clone(),
      to:sphere.center.clone().add(direction.multiplyScalar(distance)),
      lookFrom:this.orbit.target.clone(), lookTo:sphere.center.clone(),
    };
  }

  async exportPng(requestedResolution = 2048) {
    if (this.exporting) throw new Error("An export is already in progress.");
    const maxResolution = Math.min(4096, this.renderer.capabilities.maxTextureSize || 4096);
    const resolution = THREE.MathUtils.clamp(Math.round(Number(requestedResolution) || 2048), 512, maxResolution);
    const oldPixelRatio = this.renderer.getPixelRatio();
    const oldSize = this.renderer.getSize(new THREE.Vector2());
    const oldBackground = this.scene.background;
    const oldClearColor = this.renderer.getClearColor(new THREE.Color()).clone();
    const oldClearAlpha = this.renderer.getClearAlpha();
    const oldPerspectiveAspect = this.perspectiveCamera.aspect;
    let result;

    this.exporting = true;
    try {
      this.scene.background = null;
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(resolution, resolution, false);
      if (this.camera.isPerspectiveCamera) {
        this.camera.aspect = 1;
        this.camera.updateProjectionMatrix();
      } else {
        this.updateOrthographicProjection(1);
      }
      this.renderer.clear(true, true, true);
      this.renderer.render(this.scene, this.camera);

      const blob = await new Promise((resolve) => this.renderer.domElement.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("The browser could not encode the PNG export.");
      const transparent = await verifyTransparentCorners(blob);
      const link = document.createElement("a");
      link.download = `burhanpose-${resolution}px-${Date.now()}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      result = { transparent, resolution };
    } finally {
      this.scene.background = oldBackground;
      this.renderer.setClearColor(oldClearColor, oldClearAlpha);
      this.renderer.setPixelRatio(oldPixelRatio);
      this.renderer.setSize(oldSize.x, oldSize.y, false);
      this.perspectiveCamera.aspect = oldPerspectiveAspect;
      this.perspectiveCamera.updateProjectionMatrix();
      this.updateOrthographicProjection(this.container.clientWidth / Math.max(this.container.clientHeight, 1));
      this.exporting = false;
      this.renderer.render(this.scene, this.camera);
    }
    this.callbacks.onExportComplete?.(result);
    return result;
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    this.perspectiveCamera.aspect = aspect;
    this.perspectiveCamera.updateProjectionMatrix();
    this.updateOrthographicProjection(aspect);
  }

  updateOrthographicProjection(aspect = this.container.clientWidth / Math.max(this.container.clientHeight, 1)) {
    const halfHeight = this.orthographicHeight / 2;
    this.orthographicCamera.left = -halfHeight * aspect;
    this.orthographicCamera.right = halfHeight * aspect;
    this.orthographicCamera.top = halfHeight;
    this.orthographicCamera.bottom = -halfHeight;
    this.orthographicCamera.updateProjectionMatrix();
  }

  animate = (time = performance.now()) => {
    requestAnimationFrame(this.animate);
    if (this.cameraTransition) {
      const transition = this.cameraTransition;
      const t = Math.min((time - transition.start) / transition.duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.camera.position.lerpVectors(transition.from, transition.to, eased);
      this.orbit.target.lerpVectors(transition.lookFrom, transition.lookTo, eased);
      if (t >= 1) this.cameraTransition = null;
    }
    this.orbit.update();
    if (!this.exporting) this.renderer.render(this.scene, this.camera);
    if (!this.lastStats || time - this.lastStats > 1000) {
      this.lastStats = time;
      this.callbacks.onStats?.({ drawCalls:this.renderer.info.render.calls, triangles:this.renderer.info.render.triangles });
    }
  };
}

function skinBoxUv(u, v, width, height, depth) {
  return {
    right: [u + width + depth, v + depth, depth, height],
    left: [u, v + depth, depth, height],
    top: [u + depth, v, width, depth],
    bottom: [u + width + depth, v, width, depth],
    front: [u + depth, v + depth, width, height],
    back: [u + width + depth * 2, v + depth, width, height],
  };
}

function applyBoxUv(geometry, uvMap) {
  const uv = geometry.attributes.uv;
  const faces = ["right", "left", "top", "bottom", "front", "back"];
  faces.forEach((face, faceIndex) => {
    const [x, y, width, height] = uvMap[face];
    const u0 = x / SKIN_SIZE, u1 = (x + width) / SKIN_SIZE;
    const v0 = 1 - (y + height) / SKIN_SIZE, v1 = 1 - y / SKIN_SIZE;
    const offset = faceIndex * 4;
    if (face === "bottom") {
      uv.setXY(offset, u0, v0);
      uv.setXY(offset + 1, u1, v0);
      uv.setXY(offset + 2, u0, v1);
      uv.setXY(offset + 3, u1, v1);
    } else {
      uv.setXY(offset, u0, v1);
      uv.setXY(offset + 1, u1, v1);
      uv.setXY(offset + 2, u0, v0);
      uv.setXY(offset + 3, u1, v0);
    }
  });
  uv.needsUpdate = true;
}

function detectSlim(context) {
  const pixels = context.getImageData(0, 0, 64, 64).data;
  const transparent = (x, y) => pixels[(y * 64 + x) * 4 + 3] === 0;
  const sample = [];
  for (let y = 20; y < 32; y++) for (let x = 54; x < 56; x++) sample.push(transparent(x, y));
  for (let y = 52; y < 64; y++) for (let x = 46; x < 48; x++) sample.push(transparent(x, y));
  return sample.every(Boolean);
}

function upgradeLegacySkin(context) {
  const source = document.createElement("canvas");
  source.width = source.height = 64;
  source.getContext("2d").drawImage(context.canvas, 0, 0);
  const copyMirrored = (from, to) => {
    context.save();
    context.translate(to[0] * 2 + to[2], 0);
    context.scale(-1, 1);
    context.drawImage(source, from[0], from[1], from[2], from[3], to[0], to[1], to[2], to[3]);
    context.restore();
  };

  const legacyPairs = [
    [[4,16,4,4],[20,48,4,4]], [[8,16,4,4],[24,48,4,4]],
    [[8,20,4,12],[16,52,4,12]], [[4,20,4,12],[20,52,4,12]],
    [[0,20,4,12],[24,52,4,12]], [[12,20,4,12],[28,52,4,12]],
    [[44,16,4,4],[36,48,4,4]], [[48,16,4,4],[40,48,4,4]],
    [[48,20,4,12],[32,52,4,12]], [[44,20,4,12],[36,52,4,12]],
    [[40,20,4,12],[40,52,4,12]], [[52,20,4,12],[44,52,4,12]],
  ];
  legacyPairs.forEach(([from, to]) => copyMirrored(from, to));
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The skin image could not be read.")); };
    image.src = url;
  });
}

async function verifyTransparentCorners(blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 2;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const maxX = bitmap.width - 1;
  const maxY = bitmap.height - 1;
  context.drawImage(bitmap, 0, 0, 1, 1, 0, 0, 1, 1);
  context.drawImage(bitmap, maxX, 0, 1, 1, 1, 0, 1, 1);
  context.drawImage(bitmap, 0, maxY, 1, 1, 0, 1, 1, 1);
  context.drawImage(bitmap, maxX, maxY, 1, 1, 1, 1, 1, 1);
  bitmap.close();
  const pixels = context.getImageData(0, 0, 2, 2).data;
  return [3, 7, 11, 15].every((index) => pixels[index] === 0);
}
