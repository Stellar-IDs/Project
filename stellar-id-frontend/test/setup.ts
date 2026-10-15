import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import { afterEach, expect } from "vitest";

expect.extend(toHaveNoViolations);

// Testing Library auto-cleanup only hooks into a global afterEach; with
// explicit vitest imports we register it ourselves (prevents DOM leakage
// between tests).
afterEach(() => {
  cleanup();
});
