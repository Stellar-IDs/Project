import { describe, expect, it } from "vitest";
import { greet, PACKAGE_NAME, PACKAGE_VERSION } from "../src/index";

describe("greet", () => {
  it("greets by name", () => {
    expect(greet("stellar")).toBe("Hello, stellar!");
  });
});

describe("package metadata", () => {
  it("exposes the package name", () => {
    expect(PACKAGE_NAME).toBe("stellar-id-client");
  });

  it("exposes a semver version", () => {
    expect(PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
