import express from "express";
import { createServer as createViteServer } from "vite";

const app = express();
const port = Number(process.env.PORT || 4173);
const production = process.env.NODE_ENV === "production";

async function fetchMinecraft(url) {
  return fetch(url, {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      "User-Agent": "BurhanPose/1.0",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}

async function lookupIdentity(username) {
  const endpoints = [
    `https://api.minecraftservices.com/minecraft/profile/lookup/name/${encodeURIComponent(username)}`,
    `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
  ];

  let lastError;
  for (const endpoint of endpoints) {
    try {
      const result = await fetchMinecraft(endpoint);
      if (result.status === 204 || result.status === 404) continue;
      if (!result.ok) throw new Error(`Profile lookup failed (${result.status})`);
      return result.json();
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

app.get("/api/skin/:username", async (request, response) => {
  response.set({
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
  });
  const username = request.params.username.trim();
  if (!/^[A-Za-z0-9_]{1,16}$/.test(username)) {
    return response.status(400).json({ error: "Enter a valid Minecraft Java username." });
  }

  try {
    const identity = await lookupIdentity(username);
    if (!identity) return response.status(404).json({ error: "Minecraft Java player not found." });

    const profileResponse = await fetchMinecraft(
      `https://sessionserver.mojang.com/session/minecraft/profile/${identity.id}?unsigned=true`,
    );
    if (!profileResponse.ok) throw new Error(`Profile lookup failed (${profileResponse.status})`);

    const profile = await profileResponse.json();
    const encodedTextures = profile.properties?.find((property) => property.name === "textures")?.value;
    if (!encodedTextures) return response.status(404).json({ error: "This profile has no skin texture." });

    const texturePayload = JSON.parse(Buffer.from(encodedTextures, "base64").toString("utf8"));
    const skin = texturePayload.textures?.SKIN;
    if (!skin?.url) return response.status(404).json({ error: "This profile has no active skin." });

    const textureResponse = await fetch(skin.url.replace(/^http:/, "https:"), { signal: AbortSignal.timeout(10000) });
    if (!textureResponse.ok) throw new Error(`Texture download failed (${textureResponse.status})`);

    const headers = {
      "Content-Type": textureResponse.headers.get("content-type") || "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      "X-Skin-Model": skin.metadata?.model === "slim" ? "slim" : "classic",
      "X-Player-Name": identity.name,
      "X-Skin-Source": "Minecraft",
    };
    const buffer = Buffer.from(await textureResponse.arrayBuffer());
    response.set(headers);
    response.send(buffer);
  } catch (error) {
    console.error("Skin lookup failed:", error);
    response.status(502).json({ error: "Minecraft skin services are unavailable. Try uploading a PNG." });
  }
});

if (production) {
  app.use(express.static("dist"));
  app.get("/{*splat}", (_request, response) => response.sendFile("index.html", { root: "dist" }));
} else {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`BurhanPose running at http://localhost:${port}`);
});
