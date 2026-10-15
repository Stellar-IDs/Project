import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  // base-x ships ESM-only: bundling it avoids broken CJS default-import
  // interop in the .cjs output (verified by the ESM+CJS import smoke test).
  noExternal: ["base-x"],
});
