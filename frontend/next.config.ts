import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Prevent Next.js from picking a parent directory when multiple lockfiles exist
  // (e.g. /var/www/form/package-lock.json vs /var/www/form/frontend/package-lock.json).
  turbopack: {
    root: frontendRoot,
  },
  outputFileTracingRoot: frontendRoot,
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/logo/Unicoach.jpg",
      },
    ];
  },
};

export default nextConfig;
