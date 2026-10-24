import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Concepts",
      items: ["concepts/concepts-overview"],
    },
    {
      type: "category",
      label: "Quick Start",
      items: ["quickstart/quickstart-node", "quickstart/quickstart-react"],
    },
    {
      type: "category",
      label: "API Reference",
      items: ["api/api-overview", "api/api-frontend", "api/api-contract"],
    },
    {
      type: "category",
      label: "Security",
      items: ["security/security-basics"],
    },
    {
      type: "category",
      label: "Migration",
      items: ["migration/migration-from-auth"],
    },
    {
      type: "category",
      label: "Reference",
      items: ["reference/compatibility-matrix", "reference/contributing"],
    },
  ],
};

export default sidebars;