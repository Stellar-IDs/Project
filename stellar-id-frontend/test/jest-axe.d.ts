/**
 * Register jest-axe's matcher on vitest's Assertion type so
 * `expect(x).toHaveNoViolations()` typechecks. (Value-level types come
 * from @types/jest-axe; runtime wiring is in setup.ts.)
 */
export {};

declare module "vitest" {
  interface Assertion<T> {
    toHaveNoViolations(): T;
  }
}
