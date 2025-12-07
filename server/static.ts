import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files with proper cache headers for Vite builds
  // Files with hash in filename (e.g., index-DwDSKR7L.js) get immutable caching
  // index.html gets no-cache to always fetch latest version
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        const ext = path.extname(filePath);
        const basename = path.basename(filePath);

        // index.html should never be cached to ensure users get latest version
        if (basename === "index.html") {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
        // Vite hashed assets (contain hash like index-DwDSKR7L.js) can be cached forever
        else if (/\.[a-f0-9]{8,}\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp)$/i.test(basename)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
        // Other assets get short cache
        else if ([".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".woff", ".woff2", ".ttf", ".eot"].includes(ext)) {
          res.setHeader("Cache-Control", "public, max-age=86400");
        }
      },
    })
  );

  // SPA fallback: only for navigation requests, NOT for missing assets
  // This prevents returning index.html for missing JS/CSS files which causes MIME type errors
  app.use("*", (req: Request, res: Response, _next: NextFunction) => {
    const requestPath = req.originalUrl;

    // Don't serve index.html for asset requests - return 404 instead
    // This prevents the "Expected JavaScript module but got text/html" error
    const assetExtensions = [".js", ".css", ".map", ".json", ".woff", ".woff2", ".ttf", ".eot", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"];
    const isAssetRequest = assetExtensions.some(ext => requestPath.endsWith(ext));

    if (isAssetRequest) {
      res.status(404).send("Not found");
      return;
    }

    // For page navigation requests, serve index.html with no-cache headers
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
