# STATUS

**Updated:** 2026-10-14
**Current phase:** 1 — Core contract: DID lifecycle
**Current task:** Phase 2 complete — `anchor_credential`, `revoke_credential`, `credential_status`, `verify_credential_proof` implemented with tests (24 passing), `docs/test-vectors.json` written, contract builds (6 exports). Still pending: Phase 1 update-functions (`add_verification_method` … `bump_ttl`) + Gate 1b interface freeze.

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

Contract build: `stellar_id_core.wasm`, **12474 bytes**, hash `2a6bdd16383884e960bcb8d1d24ecee9942adb161a7401a57294cd41ebb0cd6b`, exports `anchor_credential`, `create_did`, `credential_status`, `resolve`, `revoke_credential`, `verify_credential_proof`.

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
- [x] Phase 1 Gate 1a: METHOD_SPEC.md written, name conflict documented, human review complete
- [x] Phase 1 implementation: `create_did` and `resolve` with full test coverage (8 tests), authorization, validation, events, TTL extension
- [x] Phase 2 credentials: `CredentialRecord` + `CredentialStatus` types, credential storage helpers with TTL, `anchor_credential` / `revoke_credential` / `credential_status` (11 new tests: duplicates, re-anchor-after-revoke, double-revoke, non-issuer isolation, expiry boundaries, revoked-beats-expired, event topics), `verify_credential_proof` with real Ed25519 signatures (5 tests incl. trap-on-wrong-key, VM-not-in-assertionMethod, unknown VM, missing DID) — 24 tests total, all green
- [x] Phase 2 acceptance artifact: `stellar-id-core/docs/test-vectors.json` (JCS canonical + SHA-256 + Ed25519 vectors incl. one invalid-sig vector), byte-identical canonical string to the Rust test const (verified by script)

## In progress
- (nothing — Phase 1 `create_did` + `resolve` complete)

## Next
1. Phase 1 remaining functions: `add_verification_method`, `remove_verification_method`, `set_relationships`, `add_service`, `remove_service`, `deactivate_did`, `rotate_controller`, `bump_ttl` (one function group at a time, test-first) — note `verify_credential_proof`'s `Deactivated` path and deactivation-dependent tests are uncovered until `deactivate_did` lands
2. Phase 1 Gate 1b: human reads the whole contract, reruns tests, signs off the public interface in STATUS.md ("Interface frozen at commit abc123")
3. Phase 3: testnet deploy + TypeScript bindings (needs `stellar keys` identities — see Blockers)

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
- 2026-10-13: **Name conflict:** ACTA-Team has an existing `did:stellar` method (v0.1 spec 2026-07-03, repo ACTA-Team/contracts-acta, SDK @acta-team/did-stellar, resolver did.acta.build, testnet contract CB7ATU...). Our method uses the **Stellar address directly as method-specific ID** (`did:stellar:<network>:<strkey-address>`) instead of their opaque 128-bit ID (`did:stellar:<network>:<base32-128bit>`). This is a fundamental architectural difference (1:1 address mapping vs opaque ID + registry). If W3C registry rejects the name, we will rename to `did:stellar-id` with minimal spec changes (rename contingency documented in METHOD_SPEC.md §12).
- 2026-10-14: Contract events use individual structs with `#[contractevent]` (not enum) per soroban-sdk 28 pattern. Errors use `#[contracterror]` macro. TTL extension uses `extend_ttl` with threshold/extend-to (host checks internally).
- 2026-10-14 (Phase 2): `anchor_credential` requires the issuer to own a non-deactivated DID (`NotFound`/`Deactivated` otherwise) — anchoring is tied to identity, not free-floating. Revoked credentials can never be re-anchored (`AlreadyExists`); double-revoke returns `Revoked`. `credential_status` precedence: `Unknown` > (missing) / `Revoked` > `Expired` > `Active`; expiry is inclusive (`timestamp >= expires_at`). `verify_credential_proof` checks DID + `assertionMethod` membership + Ed25519 kind, then `ed25519_verify` (traps on bad sig — verified empirically: `try_` yields a host error, never a `ContractError`).
- 2026-10-14 (Phase 2): test-only dev-deps `ed25519-dalek 2`, `rand 0.8`, `sha2 0.10` added to the identity crate — versions match the existing transitive tree (Cargo.lock: 2.2.0 / 0.8.8 / 0.10.9), host-only, no wasm impact (12474 bytes total).
- 2026-10-14 (Phase 2): in soroban-sdk 28's test env, `env.events().all()` reflects the most recent invocation only (proven by debug test: cumulative counts fail, per-invocation count is 1). Event tests therefore assert immediately after each mutating call, before any read-only call.
- 2026-10-14 (Phase 2): `// TODO(wave: core-1)` (method registration, in `create_did`), `// TODO(wave: core-2)` (proof-type dispatch, in `verify_credential_proof`), `// TODO(wave: core-3)` (revocation lists, in `credential_status` + types) markers placed.

## Blockers / open questions
- `stellar keys generate deployer/alice/bob --network testnet --fund` (PLAYBOOK §6 step 5) not run yet — needed from Phase 3. Testnet resets; run before deployment.
- Windows dev machines with multi-user profiles may hit the SWC native-cache ACL rejection (`ERR_SWC_NATIVE_CACHE`): fix is a locked-down `SWC_NATIVE_BINDING_CACHE` dir (see stellar-id-docs/CONTRIBUTING.md note to be added in Phase 6, or STATUS decision above). Node 22 (playbook LTS) untested locally — system has Node 24; CI covers 20/22.
- Demo has no dependency on stellar-id-client yet (added in Phase 5). At split time, stellar-id-frontend needs its own pnpm-workspace.yaml listing `demo` (no nested workspace file during monorepo phase — see STATUS decision in Phase 0; recorded here for the split checklist).

## Interface freeze
- Contract interface frozen at commit: (blank until Gate 1b)

## Deployments
- testnet contract ID: — wasm hash: — deployed: —

(End of file - total 92 lines)