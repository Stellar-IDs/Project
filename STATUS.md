# STATUS

**Updated:** 2026-10-13
**Current phase:** 0 — Scaffold the monorepo ✅ GREEN
**Current task:** Phase 0 commits (one package per commit), then Phase 1 gate 1a

## Environment / pinned versions

| Tool | Version | Notes |
|---|---|---|
| rustc / cargo | 1.99.0 (stable, x86_64-pc-windows-msvc) | installed via rustup this session; `rustfmt`+`clippy` components added explicitly (minimal profile omits them) |
| wasm targets | wasm32-unknown-unknown, wasm32v1-none | SDK 28 builds for **wasm32v1-none** (new target name); both installed |
| stellar CLI | 28.1.0 | `stellar` (soroban-cli), `~/bin/stellar-cli`, on user PATH |
| soroban-sdk | 28.0.0 (exact, per Cargo.lock) | `soroban-sdk = "28"` in workspace deps; major matches CLI 28.1.0 (no CLI v29 exists; SDK 29.0.1 must not be mixed in) |
| node | v24.18.0 | system install (playbook says 20/22 LTS; CI uses 20/22 — see Windows notes below) |
| pnpm | 12.11.2 | global install in `~/npm-global` (`corepack enable` fails: Program Files is read-only); `packageManager` field + CI use pnpm 12 |
| typescript | ^5.9.3 (resolved 5.9.3) | TS 6/7 unusable: typescript-eslint 8.71.2 peers require `typescript >=4.8.4 <6.1.0` |
| typescript-eslint (meta-package) | ^8.71.2 | eslint flat configs import from `typescript-eslint`; the separate parser/plugin deps were dropped |
| tsup | ^8.5.1 | |
| vitest | ^5.0.4 | |
| eslint | ^10.12.0 | + @eslint/js ^10, eslint-config-prettier ^10 |
| prettier | ^3.9.10 | |
| react / react-dom | ^19.3.0 | |
| @types/react / @types/react-dom | ^19.3.0 | |
| next | ^16.4.0 | demo app only; Next 16 rewrote demo tsconfig (`jsx: react-jsx`) on first build — committed as-is |
| storybook / @storybook/react-vite | ^10.6.2 | config present; no stories until Phase 5 |
| @docusaurus/core / preset-classic / faster | ^3.10.2 | `future: { v4: true }` → Rspack bundler; see Windows notes |
| @docusaurus/types, plugin-content-docs, module-type-aliases, tsconfig | ^3.10.2 | direct devDeps (pnpm strictness: @docusaurus/types + plugin-content-docs needed for `tsc`; SidebarsConfig comes from plugin-content-docs `src/*.d.ts`, not the entry) |

Contract build: `stellar_id_core.wasm`, **587 bytes**, hash `97e098e32f9e8778dece07610f4ec5f8558395458b470eb93a403b937ba53167`, exports `contract_version`.

## Done
- [x] Environment setup (PLAYBOOK §6 partial): git, node, pnpm, rust + wasm targets, stellar CLI 28.1.0
- [x] Phase 0 task 1: git init, AGENTS.md, PLAYBOOK.md, STATUS.md, .gitignore, opencode.json
- [x] Phase 0 task 2: pnpm-workspace.yaml, .npmrc, root package.json
- [x] Phase 0 task 3: stellar-id-core (workspace Cargo.toml matching CLI template incl. `release-with-logs` profile; contracts/identity with placeholder `contract_version` + generated-client test)
- [x] Phase 0 task 4: stellar-id-client (TS strict, tsup ESM+CJS+dts, vitest, ESLint flat, Prettier, placeholder fn + tests)
- [x] Phase 0 task 5: stellar-id-frontend (tsup, Storybook 10, vitest) + demo/ Next.js 16 app (builds, prerenders)
- [x] Phase 0 task 6: stellar-id-docs (Docusaurus 3.10 + faster/Rspack, link-check build, config smoke test)
- [x] Phase 0 task 7: per-package README, LICENSE (Apache-2.0), CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, AGENTS.md
- [x] Phase 0 task 8: scripts/verify-all.sh — **passes end-to-end** (`All packages verified.`)
- [x] Phase 0 task 9: per-package .github/workflows/ci.yml + root path-filtered workflow (core uploads wasm artifact)
- [x] Phase 0 task 10: first commits, one per package (see git log)
- [x] Acceptance: no cross-package relative imports (only prose mentions in AGENTS.md/PLAYBOOK.md); pnpm-lock.yaml + Cargo.lock committed

## In progress
- (nothing — Phase 0 complete)

## Next
1. Phase 1 gate 1a: write `stellar-id-core/docs/METHOD_SPEC.md` + did:stellar name-conflict check (web search, cite sources). **Human review required before any Rust.**
2. Then Phase 1 implementation, test-first, one function group at a time.

## Decisions (append-only, dated)
- 2026-10-13: soroban-sdk pinned to 28.0.0 to match stellar CLI 28.1.0 major. SDK 29.0.1 exists but no CLI v29 is released — do not mix majors.
- 2026-10-13: TypeScript pinned to ^5.9.3 — typescript-eslint 8.71.2 requires `typescript <6.1.0`, so TS 6.0.3/7.0.2 are out. Revisit when typescript-eslint supports TS 6+.
- 2026-10-13: Apache-2.0 everywhere (PLAYBOOK §9.6 default).
- 2026-10-13: pnpm installed globally to `~/npm-global` because `corepack enable` cannot write to `C:\Program Files\nodejs`.
- 2026-10-13: pnpm 12 renamed `onlyBuiltDependencies` → **`allowBuilds`** (map form: `name: true`). The old key is silently inert. Whitelisted: esbuild, core-js, @swc/core (each reviewed; reasons in pnpm-workspace.yaml).
- 2026-10-13: Contract needs the **wasm32v1-none** Rust target (SDK 28), not just wasm32-unknown-unknown. CI artifact path is `target/wasm32v1-none/release/*.wasm`.
- 2026-10-13: eslint configs import the `typescript-eslint` meta-package (must be a direct devDep); `exports` maps list `types` first (silences tsup condition-order warning).
- 2026-10-13: Docs site matches the official Docusaurus 3.10 template: `@docusaurus/faster` + `future: { v4: true }` (Rspack), `markdown.hooks.onBrokenMarkdownLinks`, `SidebarsConfig` from `@docusaurus/plugin-content-docs`, plain `<h1>` (no `@docusaurus/Heading`, which does not exist), `@docusaurus/types` + `@types/react` as direct devDeps.
- 2026-10-13: **Docusaurus packages must NOT set `"type": "module"`** (official template doesn't). With it, Rspack parses generated `.docusaurus/registry.js` as ESM and leaves `require.resolveWeak(...)` untransformed → SSR crash (`require.resolveWeak is not a function`). Client/frontend libraries keep `"type": "module"` (correct for dual builds).
- 2026-10-13: `SWC_NATIVE_BINDING_CACHE=C:\swc-native-cache` (locked-down ACLs, user env var) works around SWC 1.16's hardened loader rejecting the default cache dirs on this Windows box (another local account holds rights on the profile; the validator walks ancestors). CI/Linux unaffected. See Blockers.
- 2026-10-13: pnpm auto-appended `minimumReleaseAgeExclude` entries to pnpm-workspace.yaml (its supply-chain feature reacting to day-old releases: vitest 5.0.4, storybook 10.6.2, typescript-eslint 8.71.2). Left as written.
- 2026-10-13: git identity is a repo-local placeholder (`stellar-id-dev <dev@stellar-id.local>`) — replace with your identity before pushing.
- 2026-10-13: `project-stellar-identity.md` (original brief) left UNCOMMITTED — user input file, not a build artifact. Commit it deliberately if you want it in history.

## Blockers / open questions
- `stellar keys generate deployer/alice/bob --network testnet --fund` (PLAYBOOK §6 step 5) not run yet — needed from Phase 3. Testnet resets; run before deployment.
- Windows dev machines with multi-user profiles may hit the SWC native-cache ACL rejection (`ERR_SWC_NATIVE_CACHE`): fix is a locked-down `SWC_NATIVE_BINDING_CACHE` dir (see stellar-id-docs/CONTRIBUTING.md note to be added in Phase 6, or STATUS decision above). Node 22 (playbook LTS) untested locally — system has Node 24; CI covers 20/22.
- Demo has no dependency on stellar-id-client yet (added in Phase 5). At split time, stellar-id-frontend needs its own pnpm-workspace.yaml listing `demo` (no nested workspace file during monorepo phase — see STATUS decision in Phase 0; recorded here for the split checklist).

## Interface freeze
- Contract interface frozen at commit: (blank until Gate 1b)

## Deployments
- testnet contract ID: — wasm hash: — deployed: —
