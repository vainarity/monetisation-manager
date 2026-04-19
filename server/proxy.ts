import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3001;
const ROBLOX_API = "https://apis.roblox.com";
const THUMBNAILS_API = "https://thumbnails.roblox.com";
const GAMES_API = "https://games.roblox.com";
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
]);
const ALLOWED_IMAGE_HOST_SUFFIXES = [".rbxcdn.com", ".roblox.com"];

function isAllowedOrigin(origin?: string): boolean {
  return !origin || ALLOWED_ORIGINS.has(origin);
}

function isAllowedRobloxImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_IMAGE_HOST_SUFFIXES.some(
      (suffix) => parsed.hostname === suffix.slice(1) || parsed.hostname.endsWith(suffix)
    );
  } catch {
    return false;
  }
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,HEAD,OPTIONS");
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

// Proxy image fetches (to avoid CORS tainting canvas)
app.get("/__image-proxy", async (req, res) => {
  const url = req.query.url as string;
  if (!url) { res.status(400).json({ error: "Missing url param" }); return; }
  if (!isAllowedRobloxImageUrl(url)) {
    res.status(400).json({ error: "Only Roblox-hosted HTTPS images are allowed" });
    return;
  }
  try {
    const response = await fetch(url);
    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    const buf = await response.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch {
    res.status(502).json({ error: "Failed to proxy image" });
  }
});

// Proxy /api/thumbnails/* to thumbnails.roblox.com
app.all("/api/thumbnails/*path", async (req, res) => {
  const thumbPath = req.originalUrl.replace(/^\/api\/thumbnails/, "");
  const targetUrl = `${THUMBNAILS_API}${thumbPath}`;

  try {
    const response = await fetch(targetUrl, { method: "GET" });
    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value);
      }
    });
    const responseBody = await response.arrayBuffer();
    res.send(Buffer.from(responseBody));
  } catch (err) {
    console.error("Thumbnails proxy error:", err);
    res.status(502).json({ error: "Failed to proxy request to Roblox Thumbnails API" });
  }
});

// Proxy /api/games/* to games.roblox.com (public API, no auth needed)
app.all("/api/games/*path", async (req, res) => {
  const gamesPath = req.originalUrl.replace(/^\/api\/games/, "");
  const targetUrl = `${GAMES_API}${gamesPath}`;

  try {
    const response = await fetch(targetUrl, { method: "GET" });
    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value);
      }
    });
    const responseBody = await response.arrayBuffer();
    res.send(Buffer.from(responseBody));
  } catch (err) {
    console.error("Games proxy error:", err);
    res.status(502).json({ error: "Failed to proxy request to Roblox Games API" });
  }
});

// Proxy all /api/roblox/* requests to the Roblox Open Cloud API.
// We stream the request body directly so multipart/form-data passes through.
app.all("/api/roblox/*path", async (req, res) => {
  const robloxPath = req.originalUrl.replace(/^\/api\/roblox/, "");
  const targetUrl = `${ROBLOX_API}${robloxPath}`;

  // Collect raw body
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", async () => {
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

    const headers: Record<string, string> = {
      accept: "application/json, */*",
    };
    if (req.headers["x-api-key"]) {
      headers["x-api-key"] = req.headers["x-api-key"] as string;
    }
    if (req.headers["content-type"]) {
      headers["content-type"] = req.headers["content-type"] as string;
    }

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
      });

      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "transfer-encoding") {
          res.setHeader(key, value);
        }
      });

      const responseBody = await response.arrayBuffer();
      res.send(Buffer.from(responseBody));
    } catch (err) {
      console.error("Proxy error:", err);
      res.status(502).json({ error: "Failed to proxy request to Roblox API" });
    }
  });
});

// In production, serve the built frontend
const distPath = path.resolve(import.meta.dirname, "..", "dist");
app.use(express.static(distPath));
app.get("*path", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
