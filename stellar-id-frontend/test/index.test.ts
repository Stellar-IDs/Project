import { describe, expect, it } from "vitest";
import { PACKAGE_NAME, PACKAGE_VERSION } from "../src/index";

describe("package metadata", () => {
  it("exposes the package name", () => {
    expect(PACKAGE_NAME).toBe("stellar-id-frontend");
  });

  it("exposes a semver version", () => {
    expect(PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
