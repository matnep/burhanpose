const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

async function fetchMinecraft(url) {
  return fetch(url, {
    headers: { Accept: "application/json" },
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

async function fetchSkin(username) {
  if (!/^[A-Za-z0-9_]{1,16}$/.test(username)) {
    return json({ error: "Enter a valid Minecraft Java username." }, 400);
  }

  try {
    const identity = await lookupIdentity(username);
    if (!identity) return json({ error: "Minecraft Java player not found." }, 404);

    const profileResponse = await fetchMinecraft(
      `https://sessionserver.mojang.com/session/minecraft/profile/${identity.id}?unsigned=false`,
    );
    if (!profileResponse.ok) throw new Error(`Profile lookup failed (${profileResponse.status})`);

    const profile = await profileResponse.json();
    const encodedTextures = profile.properties?.find((property) => property.name === "textures")?.value;
    if (!encodedTextures) return json({ error: "This profile has no skin texture." }, 404);

    const skin = decodeTexturePayload(encodedTextures).textures?.SKIN;
    if (!skin?.url) return json({ error: "This profile has no active skin." }, 404);

    const textureResponse = await fetch(skin.url.replace(/^http:/, "https:"), {
      signal: AbortSignal.timeout(10000),
    });
    if (!textureResponse.ok) throw new Error(`Texture download failed (${textureResponse.status})`);

    return new Response(textureResponse.body, {
      headers: {
        "Content-Type": textureResponse.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=300",
        "X-Skin-Model": skin.metadata?.model === "slim" ? "slim" : "classic",
        "X-Player-Name": identity.name,
        "X-Skin-Source": "Minecraft",
      },
    });
  } catch (error) {
    console.error(JSON.stringify({
      message: "Skin lookup failed",
      error: error instanceof Error ? error.message : String(error),
    }));
    return json({ error: "Minecraft skin services are unavailable. Try uploading a PNG." }, 502);
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

      const cache = caches.default;
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetchSkin(username);
      if (response.ok) context.waitUntil(cache.put(request, response.clone()));
      return response;
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "API route not found." }, 404);
    return env.ASSETS.fetch(request);
  },
};
