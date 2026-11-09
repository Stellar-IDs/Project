import type { Config } from "@docusaurus/types";

// Hosted on GitHub Pages by .github/workflows/deploy.yml:
// https://stellar-ids.github.io/docs/
const config: Config = {
  title: "Stellar Identity Suite",
  tagline: "Decentralized identity for Stellar — DIDs, verifiable credentials, and sign-in",
  url: "https://stellar-ids.github.io",
  baseUrl: "/docs/",
  organizationName: "Stellar-IDs",
  projectName: "docs",
  trailingSlash: false,
  // Future flags: v4 mode uses the Rspack-based faster bundler.
  // Requires the @docusaurus/faster dependency (see package.json).
  future: {
    v4: true,
  },
  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "docs",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: "Stellar Identity",
      items: [
        { to: "docs/intro", label: "Docs", position: "left" },
        {
          href: "https://github.com/Stellar-IDs/docs",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      copyright: "Stellar Identity & Authentication Suite — testnet only, v0.x",
    },
  },
};

export default config;
