import { expect, test } from "@playwright/test";

test.describe("wallet setup (offline)", () => {
  test("shows the testnet banner and rejects an invalid secret", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Testnet only/)).toBeVisible();

    await page.getByLabel("Testnet secret (S…)").fill("not-a-secret");
    await page.getByRole("button", { name: "Use this secret" }).click();

    // Inline error; the setup form stays usable (no dead-end page).
    await expect(page.getByText("does not look like a valid S... secret")).toBeVisible();
    await expect(page.getByRole("button", { name: "Use this secret" })).toBeEnabled();
  });
});

test.describe("full flow @testnet", () => {
  test("sign in, issue a credential, revoke it, badge flips", async ({ page }) => {
    await page.goto("/?demowallet=1");

    const signIn = page.getByRole("button", { name: "Sign in with Stellar" });
    await expect(signIn).toBeVisible();
    await signIn.click();
    await expect(page.getByText(/Signed in as did:stellar:testnet:G[A-Z2-7]{55}/)).toBeVisible();

    await page.getByRole("button", { name: "Issue demo credential" }).click();
    const credential = page.getByRole("region", { name: "Demo credential" });
    await expect(credential.getByText("Valid credential")).toBeVisible();

    await credential.getByRole("button", { name: "Revoke it" }).click();
    await expect(credential.getByText("Revoked credential")).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("button", { name: "Sign in with Stellar" })).toBeVisible();
  });
});
