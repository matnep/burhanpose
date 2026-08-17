const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  ...NO_CACHE_HEADERS,
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

async function fetchMinecraft(url) {
  return fetch(url, {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
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

function decodeTexturePayload(encodedTextures) {
  const binary = atob(encodedTextures);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function fetchFallbackSkin(username, uuid) {
  const refresh = Date.now();
  const mirrors = [
    { name: "Minotar", url: `https://minotar.net/skin/${encodeURIComponent(username)}?refresh=${refresh}` },
    ...(uuid ? [{ name: "Visage", url: `https://visage.surgeplay.com/skin/${uuid}?refresh=${refresh}` }] : []),
    { name: "MineSkin", url: `https://mineskin.eu/skin/${encodeURIComponent(username)}?refresh=${refresh}` },
  ];

  for (const mirror of mirrors) {
    try {
      const textureResponse = await fetch(mirror.url, {
        headers: { Accept: "image/png", "Cache-Control": "no-cache" },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      const contentType = textureResponse.headers.get("content-type") || "";
      if (!textureResponse.ok || !contentType.includes("image/png")) continue;
      return new Response(textureResponse.body, {
        headers: {
          "Content-Type": "image/png",
          ...NO_CACHE_HEADERS,
          "X-Player-Name": username,
          "X-Skin-Source": mirror.name,
        },
      });
    } catch (error) {
      console.error(JSON.stringify({
        message: `${mirror.name} skin fallback failed`,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  try {
    const profileResponse = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      const player = profile.data?.player;
      const encodedTextures = player?.properties?.find((property) => property.name === "textures")?.value;
      const skin = encodedTextures ? decodeTexturePayload(encodedTextures).textures?.SKIN : undefined;
      if (skin?.url) {
        const textureResponse = await fetch(skin.url.replace(/^http:/, "https:"), {
          signal: AbortSignal.timeout(10000),
        });
        if (!textureResponse.ok) throw new Error(`PlayerDB texture download failed (${textureResponse.status})`);
        return new Response(textureResponse.body, {
          headers: {
            "Content-Type": textureResponse.headers.get("content-type") || "image/png",
            ...NO_CACHE_HEADERS,
            "X-Skin-Model": skin.metadata?.model === "slim" ? "slim" : "classic",
            "X-Player-Name": player.username || username,
            "X-Skin-Source": "PlayerDB",
          },
        });
      }
    }
  } catch (error) {
    console.error(JSON.stringify({
      message: "PlayerDB skin fallback failed; trying MCHeads",
      error: error instanceof Error ? error.message : String(error),
    }));
  }

  const textureResponse = await fetch(`https://mc-heads.net/skin/${encodeURIComponent(username)}`, {
    headers: { Accept: "image/png" },
    signal: AbortSignal.timeout(10000),
  });
  if (textureResponse.status === 404) return json({ error: "Minecraft Java player not found." }, 404);
  if (!textureResponse.ok) throw new Error(`Fallback texture download failed (${textureResponse.status})`);

  const contentType = textureResponse.headers.get("content-type") || "";
  if (!contentType.includes("image/png")) throw new Error("Fallback texture response was not a PNG");

  return new Response(textureResponse.body, {
    headers: {
      "Content-Type": "image/png",
      ...NO_CACHE_HEADERS,
      "X-Player-Name": username,
      "X-Skin-Source": "MCHeads",
    },
  });
}

async function fetchSkin(username) {
  if (!/^[A-Za-z0-9_]{1,16}$/.test(username)) {
    return json({ error: "Enter a valid Minecraft Java username." }, 400);
  }

  let identity;
  try {
    identity = await lookupIdentity(username);
    if (!identity) return fetchFallbackSkin(username);

    const profileResponse = await fetchMinecraft(
      // BurhanPose only needs the texture URL and model metadata. Avoid the
      // signed-profile variant, which is more aggressively rate-limited.
      `https://sessionserver.mojang.com/session/minecraft/profile/${identity.id}?unsigned=true`,
    );
    if (!profileResponse.ok) throw new Error(`Profile lookup failed (${profileResponse.status})`);

    const profile = await profileResponse.json();
    const encodedTextures = profile.properties?.find((property) => property.name === "textures")?.value;
    if (!encodedTextures) return fetchFallbackSkin(username, identity.id);

    const skin = decodeTexturePayload(encodedTextures).textures?.SKIN;
    if (!skin?.url) return fetchFallbackSkin(username, identity.id);

    const textureResponse = await fetch(skin.url.replace(/^http:/, "https:"), {
      signal: AbortSignal.timeout(10000),
    });
    if (!textureResponse.ok) throw new Error(`Texture download failed (${textureResponse.status})`);

    return new Response(textureResponse.body, {
      headers: {
        "Content-Type": textureResponse.headers.get("content-type") || "image/png",
        ...NO_CACHE_HEADERS,
        "X-Skin-Model": skin.metadata?.model === "slim" ? "slim" : "classic",
        "X-Player-Name": identity.name,
        "X-Skin-Source": "Minecraft",
      },
    });
  } catch (error) {
    console.error(JSON.stringify({
      message: "Official Minecraft skin lookup failed; trying fallback",
      error: error instanceof Error ? error.message : String(error),
    }));
    try {
      return await fetchFallbackSkin(username, identity?.id);
    } catch (fallbackError) {
      console.error(JSON.stringify({
        message: "Fallback Minecraft skin lookup failed",
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      }));
      return json({ error: "Minecraft skin services are unavailable. Try uploading a PNG." }, 502);
    }
  }
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname.startsWith("/api/skin/")) {
      let username;
      try {
        username = decodeURIComponent(url.pathname.slice("/api/skin/".length)).trim();
      } catch {
        return json({ error: "Enter a valid Minecraft Java username." }, 400);
      }

      // Skin changes should appear as soon as Mojang's public profile service
      // exposes them. Do not add a browser or Cloudflare edge-cache delay.
      return fetchSkin(username);
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "API route not found." }, 404);
    return env.ASSETS.fetch(request);
  },
};
