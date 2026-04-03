import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import type { Plugin } from "vite";

function imageProxyPlugin(): Plugin {
  return {
    name: "image-proxy",
    configureServer(server) {
      // Add middleware BEFORE Vite's proxy so it doesn't get swallowed
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/__image-proxy")) {
          next();
          return;
        }
        const url = new URL(req.url, "http://localhost");
        const imageUrl = url.searchParams.get("url");
        if (!imageUrl) {
          res.statusCode = 400;
          res.end("Missing url param");
          return;
        }
        try {
          const response = await fetch(imageUrl);
          const buf = await response.arrayBuffer();
          res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
          res.setHeader("Cache-Control", "public, max-age=3600");
          res.end(Buffer.from(buf));
        } catch {
          res.statusCode = 502;
          res.end("Proxy fetch failed");
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), imageProxyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/roblox": {
        target: "https://apis.roblox.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/roblox/, ""),
      },
      "/api/thumbnails": {
        target: "https://thumbnails.roblox.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/thumbnails/, ""),
      },
      "/api/games": {
        target: "https://games.roblox.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/games/, ""),
      },
    },
  },
});
