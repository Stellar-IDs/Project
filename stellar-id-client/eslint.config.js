// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    // src/generated is vendored CLI output (see scripts/sync-bindings.sh) — lint the SDK, not the generator.
    // examples are standalone node scripts (node globals, demo style), verified by running, not linting.
    ignores: ["dist/**", "node_modules/**", "coverage/**", "src/generated/**", "examples/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  eslintConfigPrettier,
);
