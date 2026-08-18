import express from "express";
import { createServer as createViteServer } from "vite";
import { fetchSkin } from "./worker/index.js";

const app = express();
const port = Number(process.env.PORT || 4173);
const production = process.env.NODE_ENV === "production";

app.get("/api/skin/:username", async (request, response) => {
  const username = request.params.username.trim();
  try {
    const result = await fetchSkin(username);
    result.headers.forEach((value, name) => response.setHeader(name, value));
    response.status(result.status).send(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    console.error("Skin lookup failed:", error);
    response.status(502).json({ error: "Minecraft skin services are unavailable. Try uploading a PNG." });
  }
});

if (production) {
  app.use(express.static("dist"));
  app.get("/{*splat}", (_request, response) => response.sendFile("index.html", { root: "dist" }));
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    optimizeDeps: { exclude: ["three", "fluid-core"] },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`BurhanPose running at http://localhost:${port}`);
});
