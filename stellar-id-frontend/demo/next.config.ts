import type { NextConfig } from "next";

/**
 * `DEMO_STATIC_EXPORT=1` builds a static site into `out/` for GitHub Pages
 * (served under `/frontend`, see .github/workflows/deploy.yml). Without it the
 * demo builds for `next start`, which the Playwright e2e uses.
 */
const staticExport = process.env["DEMO_STATIC_EXPORT"] === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticExport ? { output: "export", basePath: "/frontend" } : {}),
};

export default nextConfig;
