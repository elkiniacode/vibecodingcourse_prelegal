import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build to static files in out/ so the FastAPI backend can serve the frontend
  output: "export",
  // Emit out/<route>/index.html, which a plain static file server resolves without rewrites
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
