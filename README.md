# BurhanPose

BurhanPose 1.0.0 is a focused, browser-based Minecraft character posing and rendering studio. Import a Java Edition skin, arrange one or more avatars, and export the scene as a transparent PNG—without skin painting or animation timelines.

## Features

- Minecraft username lookup with Mojang fallback endpoints
- 64×64 and legacy 64×32 PNG uploads
- Automatic classic/slim arm detection with manual override
- Multiple independently positioned, rotated, and removable avatars
- Base and outer skin layers with separated geometry to prevent Z-fighting
- Direct body-part selection with rotation controls
- 18 expressive pose presets, mirroring, reset, undo, and redo
- Perspective and true orthographic isometric camera presets
- Avatar height controls and floor placement
- Dark Geist Mono interface
- Transparent 1600×1600 PNG export

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

Skin lookup is performed by the local server so browsers do not depend on third-party skin sites or cross-origin workarounds.

