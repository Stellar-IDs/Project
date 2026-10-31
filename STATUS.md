# STATUS

**Updated:** 2026-10-31
**Current phase:** 8 — Split, publish, seed issues (local prep done; every remaining step needs the human's accounts or sign-off)
**Current task:** All four packages pass their verify commands as of this update: core (59 tests, wasm 21909 B), client (47 pass + 1 integration test, which passes live on testnet), frontend (26 unit tests; demo Playwright e2e 2/2 incl. full testnet flow), docs (3 tests, link-checked build). Split dry run: core, client and docs verify standalone. Gates 1b/3/4/5/7 human sign-offs still deferred.

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

Contract build: `stellar_id_core.wasm`, **21089 bytes**, hash `400726ecf5529f2fff8ece0bcf6f7e2411af289f2a4fb5634944f2db51e8e332`, exports `add_service`, `add_verification_method`, `anchor_credential`, `bump_ttl`, `create_did`, `credential_status`, `deactivate_did`, `remove_service`, `remove_verification_method`, `resolve`, `revoke_credential`, `rotate_controller`, `set_relationships`, `verify_credential_proof` (14).

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
- [x] Phase 1 update-functions: `add/remove_verification_method` (8 tests), `set_relationships` (3), `add/remove_service` (6), `deactivate_did` + mutation-rejection matrix + revoke-after-deactivate + verify-after-deactivate (5), `rotate_controller` + `bump_ttl` (10) — 56 tests total, all green; every mutating fn has require_auth + version bump + event; no-auth failure test per group

- [x] Phase 3–6: deployment + bindings, client SDK, frontend components/hooks/withAuth/stories/demo, docs site (see git log)
- [x] Phase 7: security self-review (F-1, F-3, F-8 fixed with regression tests; F-2, F-4 open for Gate 1b), `cargo audit` (one host-only advisory, accepted), `pnpm audit` (Next.js critical + axios/qs/body-parser/fast-uri/postcss-selector-parser fixed in-range), testnet redeploy + fee measurements (`docs/COSTS.md`), CHANGELOGs, README honesty pass on all four packages
- [x] Phase 5 leftovers: demo registers the DID before sign-in (new wallets couldn't sign in before), Playwright e2e (offline + full testnet flow) green
- [x] Phase 6 acceptance substance: Node quick start rewritten and run verbatim from a clean folder against testnet with a packed client tarball (the old one was broken: key-less DID, then issued with key-1)
- [x] Phase 8 local prep: `scripts/split.sh` (non-destructive) dry-run verified; package-level `.gitignore`s; `TODO(wave: …)` markers for all 16 issues; issue drafts in each package's `.github/wave-issues/`

## In progress
- (nothing)

## Next (needs a human or a decision)
1. **Publish `stellar-id-client` to npm** (name is unclaimed: registry 404). Blocks the frontend split (its `workspace:` dep becomes `^0.1.0`) and the docs' install commands. Then publish `stellar-id-frontend`.
2. **Split:** create four empty GitHub repos, then `./scripts/split.sh ../stellar-id-split <org>` (needs git-filter-repo and pnpm 12 on PATH). Push manually after review. Retag `core-v0.1.0`? It points at the first deployment (e83df29), not the current contract; consider `core-v0.1.1` at HEAD.
3. **Seed issues** from `.github/wave-issues/*.md` with `gh issue create --body-file`, staggered per §11 program limits.
4. **Real-wallet test:** the demo isn't wired to `WalletsKitSigner`; no extension wallet has been tried (client-2 Wave issue covers it).
5. **Host the demo and docs** (Vercel or similar). Not done: needs the human's account.
6. Not done (Phase 7 extras): `cargo deny`, Soroban Guard, fresh-session adversarial pass, fuzz tests, axe in Storybook, Changesets (set up per repo after the split; inside the monorepo the CLI treats the whole workspace as one project).
7. Phase 1 Gate 1b: human reads the whole contract, reruns tests, signs off the public interface in STATUS.md ("Interface frozen at commit abc123"). Open review items for the gate: (a) `create_did` returns `InvalidInput` for limit violations while new `add_*` functions return `LimitExceeded` — spec §3.3 says `LimitExceeded`; unify? (b) rotation moves the record (old key 404s, old credentials orphaned) — acceptable? (c) `revoke_credential` allowed after deactivation (safety action) — acceptable?
   Also decide SECURITY_REVIEW F-2 (credentials survive controller rotation) and F-4 (no credential TTL bump).

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
- 2026-10-15 (Phase 1 updates): new `add_*` functions return `LimitExceeded` for count caps (spec §3.3) while `create_did` returns `InvalidInput` for the same caps — inconsistency flagged for Gate 1b, not unilaterally changed. Removing a VM referenced by a relationship → `InvalidVerificationMethod`; unknown VM/service id → `NotFound`; double-deactivate → `Deactivated`.
- 2026-10-15 (Phase 1 updates): `rotate_controller` moves the record (old key → `NotFound`); credentials anchored under the old address are orphaned and must be re-anchored — documented in function docs, flagged for Gate 1b. Self-rotation is validated before any `require_auth` (authorizing one address twice aborts at host level — found via failing test, fixed by reordering).
- 2026-10-15 (Phase 1 updates): `bump_ttl` takes no auth (proven by no-mock test), works on tombstones; TTL values themselves are host-managed and not directly observable in SDK 28 tests, so coverage is behavioral (Ok/NotFound, no state change).
- 2026-10-15 (Phase 5): PLAYBOOK §5.1.3's bare-range + link-workspace-packages mechanism does not work on pnpm 12 for unpublished packages (registry 404 before linking; `link-workspace-packages=true` + `prefer-workspace-packages=true` in root .npmrc had no effect). Frontend uses `"stellar-id-client": "workspace:^0.1.0"` instead — intent-preserving: pnpm auto-converts `workspace:` ranges to real semver on publish, and the Phase 8 split step must rewrite it to bare `^0.1.0` once the client is on npm (client publishes first per Phase 7 order).
- 2026-10-15 (Phase 4): SDK pins @stellar/stellar-sdk ^16.0.1 (matches CLI bindings generator; 16.3.1 resolved) — v17 (pulled transitively by wallets-kit) NOT adopted. New runtime deps: `base-x` 5.0.1 (multibase; bundled via tsup noExternal after CJS interop broke the smoke test), `@creit.tech/stellar-wallets-kit` 2.7.1 (heavy tree incl. appkit; native builds allowlisted with reasons). SHA-256 via sdk `hash`, no extra dep. JCS implemented inline (documented subset). WalletsKit signMessage uses base64 round-trip (Freighter convention, real-wallet untested). publint caught a real exports-map types bug (fixed; `sideEffects:false` declined — vendored bindings touch `window.Buffer`). Integration suite + node-basic example proven on testnet (Gate 4 substance).
- 2026-10-15 (Phase 3): deployed first try failed transiently on WASM upload (`client error (Connect)`), retry succeeded. Friendbot rate-limits back-to-back funding (smoke failed, then `stellar keys fund` worked minutes later). CLI 28.1.0: `stellar contract bindings typescript` is deprecated (still works); `--is-view` deprecated → use `--send=no`. Bindings embed @stellar/stellar-sdk ^16.0.1 → client pins ^16.0.1 (resolves 16.3.1); latest 17.2.1 NOT adopted (generator-compat). Gate 3 substance covered by CLI smoke transcript (docs/SMOKE_TEST.md); human re-confirmation pending.
- 2026-10-15 (unattended run): user ordered a continuous build Phases 3→7 with no human in the loop. Gates 1b/3/4/5/7 human sign-offs are DEFERRED (recorded as pending, not skipped-silently); implementation proceeds on the current interface. AGENTS.md rule-10 "stop and ask" items that arise will be resolved conservatively and logged here instead of blocking. `opencode.json`: `edit` loosened to `allow` per PLAYBOOK Appendix B guidance (`bash *` was already `allow`); `git push`/`rm -rf` stays `deny`; no pushes will be made. Restart opencode to reload config; consider reverting `edit` to `ask` after the run.

- 2026-10-31: contract redeployed twice on testnet (F-1/F-3 fixes, then F-8 documented error variants). Interface unchanged; bindings re-synced each time. Error variant doc comments are load-bearing: stellar-sdk builds `Err({ message })` from them, and the client maps errors by name. The client also maps `Error(Contract, #N)` codes from failed write simulations.
- 2026-10-31: dependency security fixes kept in-range: demo `next` ^16.4.1 (16.4.3), `@stellar/stellar-sdk` ^16.4.1 (pins axios 1.20.0). Not fixed (need major-version overrides inside third-party trees, so risk of breakage): zod, uuid, stream-json, elliptic (wallets-kit tree); tinypool, serialize-javascript, deepmerge, uuid (Docusaurus build-time). `cargo audit` RUSTSEC-2026-0387 (`crypto-bigint`, host-only) accepted.
- 2026-10-31: `@playwright/test` ^1.64.1 added to the demo (PLAYBOOK Phase 5 task 7). The "mocked wallet" is the demo's throwaway keypair; the chain is real testnet.
- 2026-10-31: Changesets deferred to after the split (monorepo CLI would treat the workspace as one project). Hand-written CHANGELOGs in each package for now.
- 2026-10-31: another agent session on this machine replaced the global pnpm with 9.15.9. This session used a private pnpm 12.11.2 from its scratchpad instead of touching the global install. Restore pnpm 12 globally when that session is done (`packageManager` is pnpm@12.11.2).

## Blockers / open questions
- npm publish of `stellar-id-client` (human's npm account) blocks the frontend split and real `npm install` docs.
- Windows dev machines with multi-user profiles may hit the SWC native-cache ACL rejection (`ERR_SWC_NATIVE_CACHE`): fix is a locked-down `SWC_NATIVE_BINDING_CACHE` dir (documented in the docs README). Node 22 (playbook LTS) untested locally — system has Node 24; CI covers 20/22.
- After the split, the client repo has no `sync-bindings.sh` (it lives in the monorepo `scripts/`). Regenerate with `stellar contract bindings typescript --network testnet --contract-id <id> --output-dir <tmp>` and copy `src/index.ts` to `src/generated/index.ts`.

## Interface freeze
- Contract interface frozen at commit: (blank until Gate 1b)

## Deployments
- **current** testnet contract ID: CB2ZHW3TBCVXQ22CLWUTIOJVCIS4CLGFX4WHLZQ663XSGKVYKFUBLZAT — wasm hash 6b0d275bf9243cb48e1a663a7f60be8a011c594474e3d50d7234a36f063cde14 (21909 B) — deployed 2026-10-31 (commit 5cd0692). Verified by client integration test, Node quick start and demo e2e.
- superseded: CAFPRFXKOSHELQAB7TRMLEUEYIVYRJIKSZIZ6UU5WXB5DDEUMCBHGAWV (2026-10-31, commit 95b0feb; fee measurements taken here)
- superseded: testnet contract ID: CBFXX2HCWDIQR45XNPLIMADAKO3N2EXMHJWSGNGNMJQR67TKZ4SCTXXE — wasm hash: 400726ecf5529f2fff8ece0bcf6f7e2411af289f2a4fb5634944f2db51e8e332 — deployed: 2026-10-15 (commit e83df29, tag core-v0.1.0, deployer GA2DO5BZPTPE4OPB46XXZF37VGIJXG7D535QU4GWYJLZYISSXOZKKF4M; smoke DID GD5C6OVUQB56WJWF2PUZOTMLRC7AYAL2NPVAFRLGJ23B54SB5ED3ZP7F created/updated/deactivated, still resolvable)

(End of file - total 92 lines)