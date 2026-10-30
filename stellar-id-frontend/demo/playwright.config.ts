import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the demo. The "wallet" is the demo's `?demowallet=1`
 * throwaway keypair signer (real wallet extensions can't be automated
 * reliably), but the chain is real: tests that hit testnet are tagged
 * `@testnet` and need friendbot + Soroban RPC to be reachable.
 */
const PORT = 3100;
const NEXT = "node node_modules/next/dist/bin/next";

export default defineConfig({
  testDir: "./e2e",
  timeout: 240_000,
  expect: { timeout: 120_000 },
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `${NEXT} build && ${NEXT} start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: !process.env["CI"],
  },
});
