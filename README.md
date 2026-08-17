# BurhanPose

BurhanPose 1.0.0 is a focused, browser-based Minecraft character posing and rendering studio. Import a Java Edition skin, arrange one or more avatars, and export the scene as a transparent PNG—without skin painting or animation timelines.

## Features

- Minecraft username lookup with Mojang fallback endpoints
- 64×64 and legacy 64×32 PNG uploads
- Automatic classic/slim arm detection with manual override
- Multiple independently positioned, rotated, and removable avatars
- Base and outer skin layers with separated geometry to prevent Z-fighting
- Optional voxelized 3D outer skin layers with transparent-pixel support
- Direct body-part selection with rotation controls
- 18 expressive pose presets, mirroring, reset, undo, and redo
- Perspective and true orthographic isometric camera presets
- Avatar height controls and floor placement
- Dark Geist Mono interface
- Transparent scene export at 1K, 2K, or 4K
- Card Studio · 06 with center-viewport camera capture, layered interactive holographic foil, and 3000×4200 PNG export

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:4173`.

For a production build:

```bash
npm run build
npm start
```

## Deploy to Cloudflare

BurhanPose deploys as one Cloudflare Worker containing both the Vite frontend and the Minecraft skin API.

```bash
npm run deploy
```

The checked-in `wrangler.jsonc` serves `dist/` as a single-page application and sends `/api/*` requests through the Worker. Cloudflare Builds can connect directly to this GitHub repository for automatic deployments from `main`.

Skin lookup is performed by the same-origin Node server locally and by the Worker in production, so browsers do not depend on third-party skin sites or cross-origin workarounds.

## Credits

The optional 3D outer-layer mode is inspired by [3D Skin Layers by tr7zw](https://github.com/tr7zw/3d-skin-layers). BurhanPose uses its own browser-oriented voxel geometry implementation.

The Card Studio holographic interaction is visually inspired by [pokemon-cards-css by simeydotme](https://github.com/simeydotme/pokemon-cards-css). BurhanPose's card design, CSS, and canvas renderer are original implementations.
