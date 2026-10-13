# PLAYBOOK — Stellar Identity & Authentication Suite

A start-to-finish build guide for a four-package identity suite on Stellar/Soroban, built by one developer with the OpenCode agent, in a single monorepo that is split into four repositories at the end.

**Audience:** (a) the human operator, (b) the OpenCode agent. The agent should read `AGENTS.md` (always loaded) and the current phase here. The human should read §0–§6 once, then drive phase by phase.

> **Verification note.** Tool and library versions, CLI flags, and OpenCode config key names change often. Everything here reflects the general shape and the intent. Wherever a command or API matters, the agent must check the official docs or the installed package before relying on it (AGENTS.md rule 5). Where this playbook says "verify", it means it.

---

## Table of contents

0. How to use this playbook
1. Mission, scope, definition of done
2. Decisions and spec corrections (read before building)
3. Architecture
4. Tech stack
5. Monorepo layout and split-readiness rules
6. Environment setup
7. OpenCode setup and working method
8. Phases 0–8 (the build)
9. Cross-cutting standards (security, testing, CI, git, versioning)
10. Splitting the monorepo into four repos
11. Wave readiness checklist
12. Contributor issues: MVP boundary and seeding
13. Soroban pitfalls
14. Troubleshooting
15. Glossary
16. Appendices (STATUS.md template, opencode.json, custom commands, issue template)

---

## 0. How to use this playbook

1. Do §6 (environment) and §7 (OpenCode setup) once.
2. Run phases in order. Each phase has: **goal → tasks → acceptance criteria → gate → agent prompt**.
3. A **gate** is a point where you (the human) review before the agent continues. Do not skip gates on Phases 1 and 3, because changes after they are expensive.
4. Start every OpenCode session with the "session starter" prompt in §7.3. Agents lose context between sessions; `STATUS.md` is the memory.
5. Use OpenCode's **Plan** agent to design each phase, then the **Build** agent to implement it.

Rough sequencing: Phases 0–3 (scaffold, contract, deploy) unblock everything else. Phases 4–6 can overlap loosely once bindings exist. Phase 7 and 8 are the polish and application stages. Budget the most review time for Phase 1.

---

## 1. Mission, scope, definition of done

### 1.1 Mission

Give Stellar a standard, reusable identity layer: a Soroban contract implementing a `did:stellar` DID method, an SDK that hides XDR/Soroban complexity, React components that make identity-aware apps easy, and documentation that gets a developer from zero to a working integration quickly.

### 1.2 Components

| # | Repo | Role |
|---|---|---|
| 1 | `stellar-id-core` | Soroban contract: create/resolve/update/deactivate DIDs, verification methods, services, credential anchoring, revocation |
| 2 | `stellar-id-client` | TypeScript SDK around the contract: `createIdentity()`, `resolveIdentity()`, `verifyCredential()`, wallet adapters, sign-in challenge helpers |
| 3 | `stellar-id-frontend` | React/Next.js components and hooks: `SessionProvider`, `IdentityLogin`, `IdentityProfile`, `CredentialBadge`, `useIdentity`, `useDidDocument`, `useCredential`, `useIdentityStatus`, `withAuth` |
| 4 | `stellar-id-docs` | Docusaurus site: quick-starts, API reference, examples, best practices |

### 1.3 Definition of done (project level)

The project is "done" for the first public release when **all** of these are true:

- [ ] Contract deployed on **Stellar testnet**, contract ID recorded in `deployments/testnet.json`, with passing unit tests and a documented public interface.
- [ ] Client SDK runs an end-to-end flow on testnet: create → resolve → update → issue/anchor credential → verify → revoke → verify fails.
- [ ] Frontend demo app deployed publicly (e.g. Vercel) against testnet, showing login with a real wallet, profile, and a credential badge.
- [ ] Docs site deployed publicly with a working quick-start someone else can follow in under ten minutes.
- [ ] Each repo has: README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CI passing, issue templates, and at least the planned open issues.
- [ ] The split into four repositories is done and CI is green in each.

### 1.4 Explicit non-goals for v1

Mainnet deployment, a production custodial wallet, a custom docs generator, zero-knowledge/selective-disclosure credentials (BBS+), a DID universal-resolver driver (nice later), and any storage of credential contents on-chain.

---

## 2. Decisions and spec corrections (read before building)

The project brief has a few ambiguous or inaccurate items. These are the defaults the agent should use. Change them deliberately, not accidentally.

| # | Brief says | Problem | Default decision |
|---|---|---|---|
| 1 | "Gas efficiency" | Stellar uses **resource fees** (CPU instructions, memory, ledger reads/writes, bytes, TTL rent), not gas | Say "resource-fee efficiency". Measure with simulation/budget. |
| 2 | "Uses XLM for state-changing operations" | True only in the sense that all network fees are paid in XLM | No custom token. Users pay normal network fees. |
| 3 | "did:stellar" | Method name may overlap an existing proposal | Before Phase 1 sign-off, search for existing `did:stellar` specs and the W3C DID method registry. If a conflict exists, document how this method differs, or pick a distinguishing name. Write the method spec regardless. |
| 4 | "Soroban wallet", "XLMbase" | Not specific wallets. "XLMbase" doesn't correspond to a wallet I can vouch for. | Use **Stellar Wallets Kit** (`@creit.tech/stellar-wallets-kit`) as the adapter layer, which covers Freighter, xBull, Albedo, LOBSTR and others. Verify current support. |
| 5 | "Resolver for Stellar DNS" | No standard called "Stellar DNS" | Interpret as: (a) resolve on-chain DIDs (core), and (b) *optionally* link a DID to a domain via SEP-1 `stellar.toml`. Item (b) is not MVP. |
| 6 | "Social login fallback" | Wallet-based identity has no password/OAuth. Social login needs an account abstraction story. | Define an `AuthProvider` interface in the frontend and ship wallet auth only. Social/passkey login is a Wave issue. Soroban supports secp256r1 signature verification, which makes passkey smart accounts a plausible later route. |
| 7 | "Custom documentation generator" | Unnecessary work | Use **Docusaurus** (versioning, search, MDX). |
| 8 | "50+ guides", "over a dozen components" | Aspirational | Build less, ship it working, and make READMEs describe only what exists. |
| 9 | Verifiable credentials | W3C VC data model is large | v1: credentials are **off-chain** JSON; the issuer signs a SHA-256 hash with an Ed25519 key listed in their DID document's `assertionMethod`. On-chain: optional anchoring + revocation status only. |
| 10 | One DID per what? | Not specified | v1: **one DID per controlling Address** (G-account or contract). DID string: `did:stellar:<network>:<address>` where network is `testnet` or `public`. |

### 2.1 DID method design (v1 summary)

- **Method-specific ID:** `<network>:<strkey address>` e.g. `did:stellar:testnet:GABC...`.
- **Controller:** the Address that authorized creation. Only the controller (or a designated key with the `capabilityInvocation` relationship, if you add it) may mutate the document. Mutations call `controller.require_auth()`.
- **Document storage:** a compact struct, **not** JSON-LD. The client renders the W3C JSON-LD document from the struct (`toW3CDocument()`).
- **Verification keys:** Ed25519 public keys as `BytesN<32>`. The client encodes to multibase (`z6Mk...`) for JSON-LD output.
- **Resolution:** a read-only contract function. The client calls it via RPC **simulation** (free, no signing) and wraps the result per the DID Resolution spec (`didResolutionMetadata`, `didDocument`, `didDocumentMetadata`).
- **Lifecycle:** create → update (add/remove verification methods and services, rotate controller) → deactivate (terminal).
- **Privacy:** no PII on-chain. Ever.

---

## 3. Architecture

```
                         ┌────────────────────────────┐
                         │   stellar-id-docs          │
                         │   (Docusaurus)             │
                         └─────────────▲──────────────┘
                                       │ documents
┌──────────────────────┐   hooks/UI   ┌┴─────────────────────┐
│ stellar-id-frontend  │─────────────▶│  stellar-id-client   │
│ React / Next.js      │   uses       │  TypeScript SDK      │
└──────────────────────┘              └──────────┬───────────┘
                                                 │ generated bindings
                                                 │ + @stellar/stellar-sdk (RPC)
                                      ┌──────────▼───────────┐
                                      │  Soroban RPC         │
                                      └──────────┬───────────┘
                                      ┌──────────▼───────────┐
                                      │  stellar-id-core     │
                                      │  Soroban contract    │
                                      │  (testnet)           │
                                      └──────────────────────┘
```

### 3.1 Contract public interface (v1 target)

Names are a starting point; finalize in Phase 1.

**DID lifecycle**
- `create_did(controller: Address, doc: NewDidDoc) -> Result<(), Error>`
- `resolve(controller: Address) -> Result<DidRecord, Error>` (read-only)
- `add_verification_method(controller, vm: VerificationMethod) -> Result<(), Error>`
- `remove_verification_method(controller, vm_id: String) -> Result<(), Error>`
- `set_relationships(controller, ...)`: authentication / assertionMethod membership by VM id
- `add_service(controller, svc: Service)` / `remove_service(controller, svc_id: String)`
- `rotate_controller(controller, new_controller: Address)` (requires auth from both)
- `deactivate_did(controller)`
- `bump_ttl(controller)` (anyone may call and pay, to keep a DID from being archived)

**Credentials (anchoring + revocation)**
- `anchor_credential(issuer: Address, credential_hash: BytesN<32>, expires_at: Option<u64>) -> Result<(), Error>`
- `revoke_credential(issuer: Address, credential_hash: BytesN<32>) -> Result<(), Error>`
- `credential_status(issuer: Address, credential_hash: BytesN<32>) -> CredentialStatus` (`Unknown | Active | Revoked | Expired`)
- `verify_credential_proof(issuer: Address, vm_id: String, message_hash: BytesN<32>, signature: BytesN<64>) -> Result<(), Error>` — loads the issuer's DID, finds the verification method in `assertionMethod`, runs Ed25519 verification. **Note:** Soroban's `ed25519_verify` *traps* on a bad signature rather than returning false, so the function either returns `Ok(())` or the transaction/simulation fails. Document this in the API reference.

**Events** (one per state change): `did/created`, `did/updated`, `did/deactivated`, `did/controller_rotated`, `cred/anchored`, `cred/revoked`.

**Errors** (`#[contracterror]`): `NotFound`, `AlreadyExists`, `Unauthorized`, `Deactivated`, `InvalidVerificationMethod`, `InvalidProof`, `Revoked`, `Expired`, `LimitExceeded`, `InvalidInput`.

**Limits** (bound storage and fees): max 10 verification methods, max 10 services, max string lengths (e.g. 128 bytes for ids, 512 for endpoints). Reject larger inputs with `LimitExceeded`.

### 3.2 Contract data model (sketch)

```rust
#[contracttype]
pub enum DataKey {
    Did(Address),                 // persistent: DidRecord
    Credential(Address, BytesN<32>), // persistent: CredentialRecord (issuer, hash)
    Admin,                        // instance: only if you add admin functions (avoid in v1)
}

#[contracttype]
pub struct VerificationMethod {
    pub id: String,              // fragment, e.g. "key-1"
    pub kind: Symbol,            // "Ed25519" for v1
    pub public_key: BytesN<32>,
}

#[contracttype]
pub struct Service { pub id: String, pub kind: String, pub endpoint: String }

#[contracttype]
pub struct DidRecord {
    pub controller: Address,
    pub verification_methods: Vec<VerificationMethod>,
    pub authentication: Vec<String>,   // vm ids
    pub assertion_method: Vec<String>, // vm ids
    pub services: Vec<Service>,
    pub created: u64,                  // ledger timestamp
    pub updated: u64,
    pub version: u32,
    pub deactivated: bool,
}
```

### 3.3 Sign-in flow (the "authentication" half of the suite)

1. App server (or client in dev) creates a **challenge**: random nonce, domain, issued-at, expiry.
2. User's wallet signs the challenge message (message-signing support varies by wallet; verify per wallet, and fall back to signing a no-op transaction/auth entry if needed, clearly documented).
3. SDK `verifyChallengeResponse()` resolves the user's DID, checks the signing key is in `authentication`, verifies the Ed25519 signature, checks nonce/expiry/domain, and returns an authenticated identity.
4. Frontend `SessionProvider` holds the session state; the app's backend issues its own session cookie/JWT. The SDK does **not** invent a session standard beyond the challenge/response.

---

## 4. Tech stack

Pin exact versions at scaffold time after checking the latest stable. Record them in `STATUS.md`.

| Area | Choice | Notes |
|---|---|---|
| Contract language | Rust + `soroban-sdk` | Match the SDK version to the installed Stellar CLI's supported protocol. |
| Stellar CLI | `stellar` (formerly `soroban-cli`) | Build, deploy, invoke, keys, bindings. |
| Rust toolchain | stable via `rustup` + the wasm target the current CLI requires | Check the Soroban docs for the current wasm target name. |
| Network | Stellar **testnet** | Friendbot funds accounts. |
| JS runtime | Node LTS (20 or 22) | |
| Package manager | **pnpm** workspaces | |
| TS SDK deps | `@stellar/stellar-sdk` | RPC client, XDR, keypairs. |
| Wallets | `@creit.tech/stellar-wallets-kit` | Verify supported wallets and message-signing. |
| SDK build | `tsup` (ESM + CJS + d.ts) | |
| Tests (TS) | `vitest` | Mock RPC for unit tests; real testnet for a small integration suite. |
| Frontend | React + Next.js (App Router) | Library built with `tsup`; demo app is a separate Next.js app inside the frontend folder. |
| UI testing | `@testing-library/react`, `axe-core`/`jest-axe` or Storybook a11y addon, Playwright for one e2e | |
| Storybook | Storybook (current stable) | Component catalog and a11y checks. |
| Docs | Docusaurus 3 | Versioning and search built in. |
| Lint/format | `clippy`+`rustfmt`; ESLint + Prettier | |
| CI | GitHub Actions | |
| Releases | Changesets (TS packages), tags (contract) | |

---

## 5. Monorepo layout and split-readiness rules

```
stellar-identity-suite/
├── AGENTS.md                   # agent rules (monorepo-level)
├── PLAYBOOK.md                 # this file
├── STATUS.md                   # living progress log
├── opencode.json               # OpenCode config (permissions, etc.)
├── .opencode/                  # custom commands/agents (optional)
├── pnpm-workspace.yaml
├── .npmrc
├── package.json                # private root; scripts only
├── .gitignore
├── scripts/
│   ├── verify-all.sh
│   └── split.sh
├── .github/workflows/ci.yml    # monorepo CI (matrix over packages)
│
├── stellar-id-core/
│   ├── Cargo.toml              # workspace with contracts/*
│   ├── contracts/identity/{Cargo.toml,src/{lib.rs,types.rs,error.rs,storage.rs,test.rs}}
│   ├── deployments/testnet.json
│   ├── docs/METHOD_SPEC.md     # the did:stellar method spec
│   ├── README.md LICENSE CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md AGENTS.md
│   └── .github/                # (inactive in monorepo) workflows + ISSUE_TEMPLATE
│
├── stellar-id-client/
│   ├── package.json tsconfig.json tsup.config.ts
│   ├── src/{index.ts,identity.ts,resolver.ts,credentials.ts,challenge.ts,signers/,errors.ts,generated/}
│   ├── test/
│   ├── examples/{node-basic,...}
│   └── README.md LICENSE ... .github/
│
├── stellar-id-frontend/
│   ├── package.json
│   ├── src/{components/,hooks/,hoc/,theme/,index.ts}
│   ├── .storybook/
│   ├── demo/                   # Next.js demo app
│   └── README.md LICENSE ... .github/
│
└── stellar-id-docs/
    ├── package.json docusaurus.config.ts
    ├── docs/ static/ src/
    └── README.md LICENSE ... .github/
```

### 5.1 Split-readiness rules (non-negotiable)

1. **Self-contained folders.** Each folder has its own README, LICENSE, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, AGENTS.md (short), lockfile or Cargo.lock, tests, and CI workflow under its own `.github/`. Root-level files are for the monorepo only and are not carried over by the split.
2. **No path imports across folders.** Not `../`, not `file:../`.
3. **Cross-package dependencies use real semver ranges**, not `workspace:*`. Example in `stellar-id-frontend/package.json`: `"stellar-id-client": "^0.1.0"`. In the monorepo, set `link-workspace-packages=true` in the root `.npmrc` so pnpm links the local package when the range is satisfied. After the split and after publishing the client to npm, the same range resolves from the registry with no edits.
4. **Core → client coupling is via generated bindings.** The client commits the output of `stellar contract bindings typescript` under `src/generated/` (or a documented equivalent). The client never imports from the core folder. Regenerate on every contract change.
5. **Contract address and network config come from config, not code.** Client reads defaults from a `networks.ts` constants file populated from `deployments/testnet.json` at *copy time* (scripted), not at import time.
6. **Per-package CI.** Each folder's `.github/workflows/ci.yml` is written as if it were the repo root. The monorepo root workflow runs each one's verify command with `working-directory`. After the split, the package workflows become active unchanged.
7. **Commit scoping.** One package per commit with `feat(core): …` style scopes. This keeps each package's filtered history clean.
8. **Docs reference published names**, not monorepo paths.
9. **npm package names.** Check availability before Phase 4 (`stellar-id-client`, or a scope such as `@stellar-id/client`). Repo names and npm names do not have to match.

### 5.2 Root configuration files

`pnpm-workspace.yaml`
```yaml
packages:
  - "stellar-id-client"
  - "stellar-id-frontend"
  - "stellar-id-frontend/demo"
  - "stellar-id-docs"
```

`.npmrc`
```
link-workspace-packages=true
```

Root `package.json` is `"private": true` with convenience scripts (`verify:client`, etc.) only.

`.gitignore` must cover: `target/`, `node_modules/`, `dist/`, `.next/`, `build/`, `.env*` (except `.env.example`), `test_snapshots/`, `.DS_Store`, `.stellar/` secrets if any, `*.pem`.

---

## 6. Environment setup (human does this once)

```bash
# 1. Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update stable
# add the wasm target that the current Soroban docs specify (check the docs for its exact name)

# 2. Stellar CLI (see https://developers.stellar.org for the current install method)
stellar --version

# 3. Node + pnpm
node --version        # 20 or 22 LTS
corepack enable && pnpm --version

# 4. git-filter-repo (needed at split time)
pip install git-filter-repo

# 5. Testnet identities (NEVER reuse these on mainnet)
stellar keys generate deployer --network testnet --fund
stellar keys generate alice    --network testnet --fund
stellar keys generate bob      --network testnet --fund
stellar keys address deployer

# 6. Sanity check: scaffold the CLI's hello-world to confirm the toolchain works
stellar contract init /tmp/hello && cd /tmp/hello && cargo test && stellar contract build
```

Create the GitHub accounts/orgs you will need now: decide whether the four repos live under one GitHub **organization** (recommended: one org, e.g. `stellar-id`, so contributor and maintainer settings are shared; confirm Wave's org requirements in its current docs).

---

## 7. OpenCode setup and working method

### 7.1 What OpenCode reads

- **`AGENTS.md`** at the project root is loaded as persistent rules. Already provided.
- **`opencode.json`** configures model, permissions and MCP servers (see Appendix B).
- **Plan vs Build agents.** Use Plan to think and write a task list without editing; use Build to implement. Switch with the keybinding shown in the TUI (commonly Tab). Verify in current docs.
- **Undo/redo** (`/undo`, `/redo`) revert agent edits. Commit often so you have stronger checkpoints than undo.
- **File references** with `@path` pull files into context. Use them: `@PLAYBOOK.md`, `@stellar-id-core/contracts/identity/src/lib.rs`.
- **Custom commands** (markdown files under `.opencode/command/` or `.opencode/commands/` depending on version) let you save the prompts in Appendix C.
- You use BYOK: your provider API key lives in OpenCode's auth store or an environment variable, never in the repo.

### 7.2 Working method (follow this loop)

1. **Plan** (Plan agent): "Read AGENTS.md, STATUS.md and Phase N of the playbook. Produce a numbered task list with acceptance criteria. Do not edit files."
2. **Review the plan.** Trim scope. Add risks.
3. **Implement** (Build agent): one task at a time. After each: verify command → update `STATUS.md` → commit.
4. **Review diffs yourself** at each gate. Read contract code line by line.
5. **Keep sessions short and scoped.** One phase (or half a phase) per session. Start a fresh session when context gets bloated or the agent starts repeating itself; the session starter prompt restores state.
6. **When the agent is stuck** (same failure 3 times): stop it, have it write what it tried and the exact error into `STATUS.md` under Blockers, then investigate docs/source yourself or switch to a stronger model for the debugging step.

### 7.3 Session starter prompt (paste every new session)

```
Read AGENTS.md, STATUS.md, and the section of PLAYBOOK.md for the current phase.
Summarize in 5 lines: current phase, what's done, what's next, any blockers, and the
acceptance criteria for the next task. Do not write code until I confirm.
```

### 7.4 Prompting rules that save time

- Give the **goal, the files, the constraints, and the verification command** in every task prompt.
- Ask for **tests first** on contract functions ("write failing tests for X, then implement").
- Ask the agent to **cite the doc page or source file** it relied on for any Soroban/SDK API.
- Never ask for "the whole contract" in one shot. Ask for one function group at a time.
- If the agent proposes a new dependency, make it justify it against §4.

### 7.5 Model/cost tips (BYOK)

Use a stronger model for: contract design (Phase 1), security review (Phase 7), and hard debugging. Use a cheaper/faster model for: boilerplate, docs, component scaffolding, test expansion. Switch models between phases, not mid-task.

---

## 8. The build

### Phase 0 — Scaffold the monorepo

**Goal:** an empty-but-green monorepo where each package builds and tests, with CI.

**Tasks**
1. `git init`, add `AGENTS.md`, `PLAYBOOK.md`, `STATUS.md`, `.gitignore`, `opencode.json`.
2. Create `pnpm-workspace.yaml`, `.npmrc`, root `package.json`.
3. Scaffold `stellar-id-core` with `stellar contract init` (or by hand): workspace `Cargo.toml`, `contracts/identity`, release profile tuned for size (`opt-level = "z"`, `lto = true`, `codegen-units = 1`, `panic = "abort"`, `overflow-checks = true`, `strip = "symbols"`; use the CLI template's values as the baseline).
4. Scaffold `stellar-id-client` (TS, tsup, vitest, ESLint, Prettier) with a trivial exported function and test.
5. Scaffold `stellar-id-frontend` (library skeleton with tsup, Storybook, vitest) and `demo/` Next.js app.
6. Scaffold `stellar-id-docs` with Docusaurus.
7. Add per-package README, LICENSE (Apache-2.0 or MIT; pick one, use it everywhere), CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, short AGENTS.md pointing at the monorepo rules.
8. Add `scripts/verify-all.sh` running each package's verify command.
9. Add per-package `.github/workflows/ci.yml` and a root workflow that runs them with `working-directory`.
10. First commits, one per package.

**Acceptance criteria**
- `scripts/verify-all.sh` passes from a clean clone.
- No package references another by relative path.
- `STATUS.md` records the exact versions chosen.

**Prompt**
```
Phase 0. Using PLAYBOOK §5 and §8 Phase 0, scaffold the monorepo. Plan first, no edits.
Then implement one package at a time, verifying and committing after each (one package per commit).
Check current docs for the Stellar CLI template, Docusaurus, and Storybook init commands rather than guessing.
```

---

### Phase 1 — Core contract: DID lifecycle

**Goal:** a tested contract implementing create/resolve/update/deactivate for DIDs.

**Design first (gate 1a).** Before any Rust: write `stellar-id-core/docs/METHOD_SPEC.md` covering: method name and syntax, DID document mapping, CRUD semantics, authorization rules, deactivation, security and privacy considerations, and conformance to W3C DID Core. Resolve the §2 item 3 name-conflict check. **Human reviews the spec and the §3 interface before implementation starts.**

**Tasks**
1. `types.rs`: `DataKey`, `VerificationMethod`, `Service`, `DidRecord`, `NewDidDoc`.
2. `error.rs`: `#[contracterror]` enum (see §3.1).
3. `storage.rs`: helpers for read/write with **TTL extension** on every persistent write and on reads that matter. Define constants for threshold/extend-to ledgers and explain the numbers in comments.
4. `lib.rs`: implement, test-first, in this order: `create_did`, `resolve`, `add_verification_method`, `remove_verification_method`, `set_relationships`, `add_service`, `remove_service`, `deactivate_did`, `rotate_controller`, `bump_ttl`.
5. Emit events for every state change.
6. Enforce limits and input validation (id characters/lengths, duplicates, referencing unknown vm ids).
7. Tests (see below).

**Authorization pattern:** every mutating function calls `controller.require_auth()` first, then checks the stored controller equals the caller. In tests use `env.mock_all_auths()` for happy paths and targeted auth assertions for failures.

**Test matrix (minimum)**
| Function | Happy | Failure cases |
|---|---|---|
| create_did | creates, resolvable, version 1 | duplicate, too many VMs, bad ids |
| resolve | returns record | missing DID |
| add/remove VM | updates, bumps `updated`/`version` | wrong caller, duplicate id, unknown id, limit exceeded, removing a VM still referenced by a relationship |
| services | add/remove | duplicate, limit, wrong caller |
| deactivate | sets flag | further mutations rejected with `Deactivated`, resolve still works |
| rotate_controller | old loses, new gains | needs both auths, to same address |
| bump_ttl | extends | missing DID |
Also test: events emitted (check `env.events().all()`), and that TTL is extended (inspect via `env.as_contract` + `storage().persistent().get_ttl` if available; verify the API in the installed SDK).

**Acceptance criteria**
- `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test` all pass.
- `stellar contract build` produces a wasm; its size is recorded in `STATUS.md` (should be small; investigate if it nears the size limit).
- No `unwrap()`/`expect()`/panics-by-index in contract code.
- Every public function is documented with doc comments (they become API reference content).

**Gate 1b:** human reads the whole contract, reruns tests, and signs off the public interface in `STATUS.md` ("Interface frozen at commit abc123"). After this, signature changes require a decision note.

**Prompt**
```
Phase 1 design step only: write stellar-id-core/docs/METHOD_SPEC.md from PLAYBOOK §2.1 and §3.
Do the did:stellar name conflict check using web search and cite what you found. No Rust yet.
```
then
```
Phase 1 implementation. Test-first. Implement create_did and resolve only, with full tests,
then stop and show me the diff. Use the soroban-sdk version pinned in STATUS.md and verify any
API you use against the docs or the crate source. Run the core verify command.
```

---

### Phase 2 — Core contract: credentials, proofs, revocation

**Goal:** credential anchoring, issuer-signature verification, revocation, expiry.

**MVP boundary:** see §12. Per-credential revocation by the issuer; Ed25519 proof only. **Leave** pluggable proof types, batched revocation lists, and method registration for the Wave issues.

**Tasks**
1. `anchor_credential`, `revoke_credential`, `credential_status`.
2. `verify_credential_proof`: load issuer DID, require non-deactivated, find `vm_id` in `assertionMethod`, `env.crypto().ed25519_verify(...)`. Document the trap-on-failure behaviour.
3. Expiry check against ledger timestamp.
4. Events and tests. For signature tests, generate real Ed25519 keys and signatures in test code (use a dev-dependency such as `ed25519-dalek` plus `rand`; verify the Soroban testutils for built-in helpers).
5. Test: revoked credential can't be re-anchored; revocation by non-issuer fails; expired reports `Expired`; signature with wrong key traps; VM not in `assertionMethod` rejected.

**Acceptance:** same as Phase 1, plus a test vector file `stellar-id-core/docs/test-vectors.json` that the client SDK will reuse to prove cross-language compatibility of the hashing and signing format.

**Credential canonicalization (decide and document):** the message that gets hashed must be byte-identical between issuer, SDK and verifier. v1: UTF-8 bytes of the credential JSON canonicalized with JCS (RFC 8785), then SHA-256. Specify this in METHOD_SPEC.md and implement it in the client in Phase 4.

---

### Phase 3 — Deploy to testnet and generate bindings

**Goal:** a live contract and typed client bindings.

**Tasks**
1. `stellar contract build` then, if appropriate, `stellar contract optimize` (check whether the CLI version already optimizes during build).
2. Deploy: `stellar contract deploy --wasm <path> --source-account deployer --network testnet --alias stellar-id-core` (verify flag names against `stellar contract deploy --help`).
3. Record contract ID, wasm hash, network passphrase, deploy date, and CLI/SDK versions in `deployments/testnet.json`.
4. Smoke test with `stellar contract invoke` for create → resolve → add VM → deactivate on a throwaway DID.
5. Generate TypeScript bindings: `stellar contract bindings typescript --network testnet --contract-id <ID> --output-dir <tmp>`; inspect the output.
6. Write `scripts/sync-bindings.sh` that regenerates bindings and copies them into `stellar-id-client/src/generated/` (this is the single sanctioned bridge between core and client).
7. Tag `core-v0.1.0`.

**Acceptance:** `deployments/testnet.json` committed; smoke test transcript saved in `stellar-id-core/docs/SMOKE_TEST.md`; bindings compile in the client with `pnpm typecheck`.

**Gate 3:** human confirms the contract works on testnet by invoking it manually at least once.

**Remember:** upgrading a deployed contract is possible only if you designed for it (`update_current_contract_wasm`) and for storage-layout compatibility. For v1 testnet, redeploying is fine. Record each redeploy in `deployments/`.

---

### Phase 4 — Client SDK

**Goal:** a typed SDK with the three headline functions plus the sign-in helpers, wallet adapters, and a Node example.

**Public API (target)**
```ts
createIdentity(opts: { signer: Signer; network: NetworkConfig; keys?: NewKey[]; services?: Service[] }): Promise<Identity>
resolveIdentity(did: string, opts?: ResolveOptions): Promise<ResolutionResult>
updateIdentity(did: string, patch: IdentityPatch, opts): Promise<TxResult>
deactivateIdentity(did: string, opts): Promise<TxResult>

issueCredential(opts): Promise<{ credential: VerifiableCredential; hash: string; anchorTx?: TxResult }>
verifyCredential(credential: VerifiableCredential, opts?): Promise<VerificationResult>
revokeCredential(hashOrCredential, opts): Promise<TxResult>

createChallenge(opts): Challenge
verifyChallengeResponse(resp: ChallengeResponse, opts): Promise<AuthenticatedIdentity>

toW3CDocument(record): DidDocument   // JSON-LD rendering
parseDid(did: string): { method: 'stellar'; network: Network; address: string }
```

**Signer abstraction**
```ts
interface Signer {
  publicKey(): Promise<string>;
  signTransaction(xdr: string, opts: { networkPassphrase: string }): Promise<string>;
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
}
```
Ship: `KeypairSigner` (Node/tests/CI), and `WalletsKitSigner` (browser, via Stellar Wallets Kit). Anything beyond that is the wallet-connector Wave issue (see §12).

**Tasks**
1. `parseDid`/`formatDid` with exhaustive tests (valid, invalid network, bad strkey, trailing junk).
2. Error classes: `StellarIdError`, `DidNotFoundError`, `DidDeactivatedError`, `InvalidProofError`, `CredentialRevokedError`, `NetworkError`, `SimulationError`, `WalletError`.
3. Resolver: simulate `resolve` (no signing, no fee), map the record to `ResolutionResult`; handle archived/expired entries (`restore` guidance) and missing DIDs.
4. Mutations: build, simulate, assemble, sign, submit, poll for the result; surface a typed `TxResult`. Include retry with backoff for transient RPC errors, and clear timeouts.
5. `toW3CDocument`: render JSON-LD with `@context` (DID Core + Ed25519 suite), `verificationMethod` with `publicKeyMultibase`, relationships, services.
6. Credentials: JCS canonicalize → SHA-256 → Ed25519 sign/verify. Verify using the shared **test vectors** from Phase 2. Verification does: parse, resolve issuer, check key in `assertionMethod`, verify signature locally, then check on-chain status (anchor/revocation/expiry).
7. Challenge/response helpers (see §3.3) with nonce, domain binding, expiry, replay protection hook (`nonceStore` interface; in-memory default for dev only, documented as such).
8. Wallet adapter + wallet-support matrix in README (which wallets, which operations; only list what you tested).
9. Examples: `examples/node-basic` runs the full flow on testnet using `.env` (never committed).
10. Tests: unit (mock RPC) for every function; a small **integration suite** against testnet gated behind `INTEGRATION=1`, run manually and in a scheduled CI job.
11. Build ESM + CJS + types; verify with `publint` or `arethetypeswrong` if available; `exports` map correct.
12. JSDoc on every public export.

**MVP boundary:** resolver reads from the contract only (no fallback logic); only the one DID method; wallet adapter only for Wallets Kit + Keypair.

**Acceptance criteria**
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass.
- `examples/node-basic` completes the full lifecycle on testnet.
- Test vectors from core pass in TS.
- Bundle imports cleanly in a Node ESM script **and** a CJS script (add a smoke test).
- Package published to npm **only at the end of Phase 7**, not now. Until then, `private: false` but unpublished is fine; use `pnpm pack` to test the tarball.

**Prompt**
```
Phase 4, task 1-3 only. Implement parseDid, the error classes, and the resolver with mocked RPC tests.
Use the generated bindings in src/generated. Check @stellar/stellar-sdk docs for current Soroban RPC
class names before using them. Show me the diff when done.
```

---

### Phase 5 — Frontend components

**Goal:** accessible, themeable React components and hooks on top of the client SDK, plus a deployed demo.

**Components and hooks (MVP set; do not exceed)**
- `SessionProvider` — holds wallet connection + identity + session state; configuration for network and contract.
- `IdentityLogin` — connect wallet → create challenge → sign → verify → authenticated.
- `IdentityProfile` — shows DID, verification methods, services (read-only in MVP).
- `CredentialBadge` — status chip (Valid / Revoked / Expired / Unknown) with accessible text, not color-only.
- Hooks: `useIdentity`, `useDidDocument`, `useCredential`, `useIdentityStatus`.
- HOC `withAuth` for client-side route protection (with documented Next.js App Router caveats: real protection must be server-side).

**Rules**
- **Accessibility from the start:** semantic HTML, labels, visible focus, keyboard operability, status announcements via `aria-live`, no color-only meaning, minimum contrast. Add axe checks to component tests and Storybook.
- **Theming:** CSS variables (`--sid-color-primary`, etc.) with sensible defaults and a documented list. Dark mode via a data attribute. No hardcoded colors in component CSS.
- **No UI-library lock-in:** ship unstyled-friendly components with minimal default CSS. Don't depend on Tailwind/Chakra/MUI; document how to style with them.
- **SSR safety:** nothing touching `window` at import time; wallet code only in effects/handlers; mark client components properly for the App Router.
- **Data fetching:** hooks cache and dedupe, expose `{ data, error, status, refetch }`, and never swallow errors.
- **Error and loading states** for every component, tested.

**Tasks**
1. Theme tokens and base CSS.
2. `SessionProvider` + `useIdentityStatus`/`useIdentity` with tests (mock the SDK).
3. `useDidDocument`, `useCredential`.
4. `IdentityLogin`, `IdentityProfile`, `CredentialBadge` with stories (default, loading, error, deactivated, dark).
5. `withAuth`.
6. Demo app in `demo/`: connect wallet, sign in, show profile, issue and verify a demo credential, revoke it, see the badge change. Deploy to Vercel (testnet banner visible: "Testnet only").
7. One Playwright e2e that runs against a mocked wallet (real wallets can't be automated reliably); document manual wallet test steps.
8. Package build (tsup, `"use client"` banners preserved, CSS shipped, types).

**MVP boundary:** wallet login only (no social fallback), read-only profile (no editing), a single default theme + CSS variables (no theme builder), a11y checks present but the formal written audit is a Wave issue.

**Acceptance criteria:** verify command passes; Storybook builds with no a11y violations on the stories; the demo is live and you've done the full flow on testnet with a real wallet.

---

### Phase 6 — Documentation

**Goal:** a docs site a stranger can use.

**MVP content (write only what is true and tested)**
1. **Home / Overview:** what it is, architecture diagram, status (testnet, v0.x).
2. **Concepts:** DIDs, `did:stellar` syntax, documents, verification methods, credentials, revocation, TTL/archival, resource fees.
3. **Quick start (Node):** 10 minutes: install, fund a testnet account, create identity, resolve it.
4. **Quick start (React):** *minimal*, not the full guide (the full React guide is a Wave issue).
5. **API reference:** contract methods (from doc comments), SDK exports (TypeDoc or hand-written from JSDoc), frontend components and hooks props.
6. **Security basics:** key handling and phishing, replay protection, what not to put on-chain, testnet-only warning. (The comprehensive best-practices guide is a Wave issue.)
7. **Migration from traditional auth:** a concise mapping table (password/OAuth → challenge/response) — short, honest.
8. **Compatibility matrix:** contract version ↔ SDK version ↔ components version.
9. **Contributing:** how to run each package locally.

**Tooling:** Docusaurus with local search (or Algolia DocSearch later), versioning enabled once v0.1.0 ships, link checker in CI, code samples extracted from or tested against real example files so they can't rot silently (e.g., include snippets from `stellar-id-client/examples` at build time *after the split by URL*, or copy at build time via a script; during the monorepo phase, copy via script and record the source commit).

**Acceptance:** `pnpm build` passes with broken-link checking on; a person who hasn't seen the project follows the Node quick-start to success (test with a friend or a fresh machine/VM).

---

### Phase 7 — Hardening and release prep

**Goal:** make it safe and presentable.

**Security review (do this carefully, it's a contract that handles identity)**
1. Run `cargo clippy`, `cargo audit`, and `cargo deny` if configured.
2. Run **Soroban Guard** (your own static-analysis CLI) against the contract and triage findings.
3. Manually review against this checklist:
   - Every mutating function calls `require_auth()` on the right Address *before* state changes.
   - No function lets a caller mutate someone else's DID.
   - Controller rotation requires consent from both old and new controllers.
   - Deactivated DIDs can't be mutated and can't issue/anchor/verify.
   - Collection and string size limits are enforced everywhere.
   - No unbounded loops over user-controlled data.
   - TTL/archival behaviour is understood and documented; `bump_ttl` works.
   - Arithmetic uses checked operations; `overflow-checks` on.
   - Replay/domain separation: credential hashes and challenge messages include context so a signature for one use can't be replayed for another.
   - Events don't leak anything sensitive.
4. Have the agent do an adversarial pass in a *fresh session*: "Act as a Soroban security auditor. Find ways to hijack or grief a DID. List findings with severity and a failing test for each." Fix, add regression tests.
5. Add property/fuzz tests for the contract if time allows (`cargo fuzz` or proptest on parse/validate paths).
6. Measure resource usage for key calls via simulation; record numbers in `docs/COSTS.md`. This is also baseline data for the Wave "storage optimization" issue.

**Release prep**
- Versions: `core-v0.1.0`, `client@0.1.0`, `frontend@0.1.0`, `docs` deployed.
- CHANGELOGs; Changesets for TS packages.
- Publish `stellar-id-client` to npm *then* the frontend (since frontend depends on the client's published range after the split). Use npm provenance if available.
- README polish in each package: badges, install, 30-second example, status/limitations, link to docs, contribution links.
- Run the **README honesty pass**: delete or reword anything the code doesn't do.

**Acceptance:** all verify commands green; findings log in `stellar-id-core/docs/SECURITY_REVIEW.md` with each item resolved or explicitly accepted.

---

### Phase 8 — Split, publish, seed issues

Follow §10 (split) and §12 (issues). Then run the §11 checklist.

---

## 9. Cross-cutting standards

### 9.1 Security (project-wide)

- **Secrets:** never in git, prompts, logs, screenshots, or docs. Rotate any key that appears anywhere by accident. Testnet keys only.
- **Agent permissions:** configure `opencode.json` so shell and edit actions require approval for risky commands (see Appendix B). Never let the agent run `git push --force`, `rm -rf` outside build dirs, or anything with mainnet.
- **Supply chain:** pin dependency versions via lockfiles; review every new dependency; prefer well-maintained packages; enable Dependabot and `cargo audit`/`pnpm audit` in CI.
- **Responsible disclosure:** `SECURITY.md` with a contact method.
- **Threat model (write it, one page, in core docs):** assets (DID control, credential integrity), attackers (random caller, malicious issuer, replaying verifier, phishing site), mitigations.

### 9.2 Testing strategy

| Layer | Tool | What |
|---|---|---|
| Contract unit | `cargo test` with `soroban-sdk` testutils | All functions, auth, limits, events |
| Cross-language vectors | JSON file produced in core, consumed by client | Hash/sign format compatibility |
| SDK unit | vitest + mocked RPC | Every public function |
| SDK integration | vitest + real testnet, `INTEGRATION=1` | Lifecycle end-to-end; flaky-tolerant, scheduled not per-PR |
| Components | Testing Library + axe | Behavior, states, accessibility |
| Visual/a11y | Storybook | Stories per state |
| E2E | Playwright with mocked wallet | Login → profile → badge |
| Docs | link checker; snippet tests | No dead links or rotting code |

Target: meaningful coverage on every public function rather than a vanity percentage.

### 9.3 CI (per package, GitHub Actions)

- Core: fmt, clippy, test, build wasm, `cargo audit`; upload wasm artifact.
- Client/frontend/docs: install with frozen lockfile, lint, typecheck, test, build; cache pnpm store; matrix Node LTS versions for the client.
- Monorepo root workflow: path-filtered jobs per package so unrelated changes don't rebuild everything.
- Scheduled workflow: testnet integration tests weekly (testnet resets happen; failures there are information, not always bugs).

### 9.4 Git workflow

- Trunk-based on `main` during the monorepo phase; short-lived branches per task are fine.
- **Conventional Commits** with package scope; one package per commit.
- Tag with package prefixes: `core-v0.1.0`, `client-v0.1.0`, etc. (After the split, tags in each repo should be plain `v0.1.0`; rewrite when splitting, see §10.)
- Don't squash across packages. Don't rewrite published history except through the split procedure.

### 9.5 Versioning

- SemVer per package. 0.x until the interface is stable.
- Compatibility matrix in docs. Breaking contract change ⇒ new contract deployment ⇒ SDK minor/major bump ⇒ docs version.

### 9.6 Licensing and community files

One permissive license across all repos (Apache-2.0 is a good default for a spec-adjacent project). Add a `CODEOWNERS`, PR template, issue templates (bug, feature, wave-task), labels (`good first issue`, `wave`, `help wanted`, `area:*`), and a clear CONTRIBUTING with local setup commands and the verify command.

---

## 10. Splitting the monorepo into four repos

**When:** after Phase 7, before seeding Wave issues.

**Pre-flight checklist**
- [ ] Each folder passes its verify command *in isolation* (copy the folder to a temp dir and run it).
- [ ] `grep -R "\.\./stellar-id-" .` finds nothing.
- [ ] No `workspace:*` or `file:` dependencies in any `package.json`.
- [ ] Client published to npm (so frontend and docs resolve it from the registry).
- [ ] Each folder has its own LICENSE, README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, AGENTS.md, `.github/workflows/ci.yml`, issue templates.
- [ ] `main` is clean and pushed to a backup remote.
- [ ] Four empty GitHub repos created under the org.

**`scripts/split.sh`**
```bash
#!/usr/bin/env bash
set -euo pipefail

ORG="${1:?usage: split.sh <github-org>}"
SRC="$(git rev-parse --show-toplevel)"
OUT="${SRC}/../stellar-id-split"
REPOS=(stellar-id-core stellar-id-client stellar-id-frontend stellar-id-docs)

rm -rf "$OUT" && mkdir -p "$OUT"

for r in "${REPOS[@]}"; do
  git clone --no-local "$SRC" "$OUT/$r"
  (
    cd "$OUT/$r"
    git filter-repo --subdirectory-filter "$r"
    git remote add origin "git@github.com:${ORG}/${r}.git"
    git branch -M main
  )
  echo "prepared $OUT/$r"
done

echo "Review each repo, then push with: git push -u origin main --tags"
```

**After the script, per repo**
1. `git log --oneline | head` — history looks right and only that package's commits remain.
2. **Tags:** prefixed tags (`core-v0.1.0`) from the monorepo will carry over only if they're on commits reachable in the filtered history. Re-tag as `v0.1.0` and delete prefixed tags if you prefer.
3. Run the verify command in the fresh clone. Fix anything that depended on the monorepo.
4. Push (`git push -u origin main --tags`).
5. Confirm CI is green on GitHub.
6. Set repo description, topics (`stellar`, `soroban`, `did`, `decentralized-identity`, ...), website link, enable Issues and Discussions, add branch protection.
7. Update cross-repo links in READMEs and docs to the final GitHub URLs.
8. Docs repo: update any snippet-sync script to pull from published packages or the new repo URLs.
9. Archive the monorepo (keep it as a private backup, or delete when satisfied).

Caveats: Issues/PRs from the monorepo don't transfer (only commits do). Commits that touched several folders appear in multiple split histories, containing only the relevant folder's changes — this is why the one-package-per-commit rule exists.

---

## 11. Wave readiness checklist

Check the **current** Wave program rules and your dashboard before applying; mechanics change between Waves.

**Project quality bar (what reviewers see first)**
- [ ] Working Soroban contract on testnet with a linked deployment and passing tests.
- [ ] A **live frontend demo** (the combination of a working contract and an active frontend is what distinguishes mature projects).
- [ ] Docs site live; quick-start verified by someone else.
- [ ] CI badges green on every repo; recent commit activity; tagged releases.
- [ ] READMEs that are accurate (no aspirational claims), with a clear "Status: testnet / v0.x" line.
- [ ] CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue and PR templates, labels.
- [ ] Clear differentiation: why this exists, how it relates to existing Stellar identity efforts, and an honest comparison.
- [ ] A public roadmap issue or `ROADMAP.md`.
- [ ] A short demo video or GIF in the main README.

**Issue readiness (see §12)**
- [ ] Every Wave issue is real, unstarted, well-scoped, labeled, and has acceptance criteria and pointers to code.
- [ ] Issue point values match the brief (core 4/3/3/2, client 3/3/2/2, frontend 3/3/2/2, docs 3/3/4/2).
- [ ] You're able to review PRs quickly (maintainer responsiveness matters). Plan your calendar for the Wave window.

**Program constraints to check:** limits on pending applications and on how many issues can be assigned per org per Wave. With 16 issues across four repos, you may need to **stagger** issue publication across Waves instead of opening all at once. Confirm how the program counts repos vs. orgs.

---

## 12. Contributor issues: MVP boundary and seeding

The brief lists 16 contributor issues. If the MVP implements them, there's nothing left for contributors. The rule is: **build the foundation the issue plugs into, but not the issue itself.** The table defines the boundary.

### 12.1 Core (`stellar-id-core`)

| Issue (pts) | MVP leaves | What the issue delivers | Plug-in point |
|---|---|---|---|
| #1 DID method registration (4) | Single hard-coded method `stellar`, network from a constant | A registry so additional method variants/networks/versions can be registered with metadata and governance rules | `// TODO(wave: core-1)` in create/resolve where method is assumed; document the extension design in METHOD_SPEC |
| #2 Credential proof verification (3) | Ed25519 proof of one fixed format | Additional proof types (e.g. secp256r1/passkey proofs), a proof-type enum, and conformance tests | `verify_credential_proof` dispatch on `VerificationMethod.kind` |
| #3 Revocation list support (3) | Per-credential revoke + status | Batched revocation list (status-list/bitstring style) with efficient index lookups | `credential_status` internals; keep the public signature stable |
| #4 Resource-fee optimization (2) | Straightforward storage, measured in `docs/COSTS.md` | Reduce ledger reads/writes/bytes with a benchmark showing improvement | Storage layer in `storage.rs`; the cost table is the baseline |

### 12.2 Client (`stellar-id-client`)

| Issue (pts) | MVP leaves | What the issue delivers |
|---|---|---|
| #1 TS types for new DID methods (3) | Types for the one method; types are discriminated by `method` so extension is easy | Types for newly registered methods, kept in sync with core-1 |
| #2 Wallet connector integration (3) | `KeypairSigner` + `WalletsKitSigner` | Additional/extra connectors, auth-entry signing for smart-wallet flows, wallet capability detection and matrix |
| #3 Resolver fallback logic (2) | Resolve from a single RPC endpoint | Multi-RPC failover, optional cache, archived-entry restore flow, optional history/indexer fallback |
| #4 Comprehensive documentation (2) | JSDoc + README + a Node example | TypeDoc site, cookbook, error reference |

### 12.3 Frontend (`stellar-id-frontend`)

| Issue (pts) | MVP leaves | What the issue delivers |
|---|---|---|
| #1 Social login fallback (3) | `AuthProvider` interface, wallet provider only | A provider for social/passkey-backed login with a documented custody/security model |
| #2 Profile editing UI (3) | Read-only `IdentityProfile` | Edit keys/services with transaction state, confirmations, error handling |
| #3 Theme customization (2) | CSS variables + one default theme | Theme presets, a provider API, documented tokens, dark/high-contrast |
| #4 Accessibility audit (2) | Axe checks in tests | A written WCAG audit with manual keyboard/screen-reader testing and fixes |

### 12.4 Docs (`stellar-id-docs`)

| Issue (pts) | MVP leaves | What the issue delivers |
|---|---|---|
| #1 React integration guide (3) | Minimal React quick-start | Full guide with provider, hooks, protected routes, error handling |
| #2 Vue integration guide (3) | Nothing | Full Vue guide using the SDK directly |
| #3 Full-stack example (4) | Node example only | Complete frontend + backend + contract example repo/folder |
| #4 Security best practices (2) | A short "security basics" page | A comprehensive guide: key management, phishing, replay, revocation, privacy, incident response |

### 12.5 Issue body template

```markdown
## Summary
One paragraph: what and why.

## Background
Link to the relevant files and to METHOD_SPEC / docs sections. Describe the current MVP behavior.

## Scope
- [ ] Concrete deliverable 1
- [ ] Concrete deliverable 2

## Out of scope
- ...

## Acceptance criteria
- [ ] Tests added/updated and passing (`<verify command>`)
- [ ] Docs updated
- [ ] No breaking change to public API (or a documented, approved one)

## Hints
Plug-in point(s): `path/to/file` (search for `TODO(wave: core-1)`).

## How to test locally
Commands.

**Points:** N · **Labels:** wave, good first issue?, area:xyz
```

**Sequencing tip:** publish the lowest-risk, most self-contained issues first. Make sure each has pointers precise enough that a newcomer can start within an hour. Keep your own work off those issues.

---

## 13. Soroban pitfalls (read before Phase 1)

1. **State archival & TTL.** Persistent entries expire unless TTL is extended; archived entries need restoration. Extend on writes; offer `bump_ttl`; handle "entry archived" errors in the SDK with a clear message and a restore path.
2. **Storage types.** `persistent` for DIDs/credentials (must not vanish silently), `instance` for contract-wide config (shares the contract instance's TTL), `temporary` only for data you can afford to lose (e.g. nonces). Never put per-user data in `instance`.
3. **`#![no_std]`.** Use `soroban_sdk::{String, Vec, Map, Bytes, BytesN, Symbol, Address}`, not `std` types. `String` is not `std::string::String`; manipulating it is limited, so keep ids short and validate lengths.
4. **`Symbol` limits.** `symbol_short!` is for short symbols (≤ 9 chars); `Symbol::new` allows more (≤ 32), characters limited to `[a-zA-Z0-9_]`.
5. **Auth.** `address.require_auth()` is the only authorization primitive. Auth is enforced by the host with the invocation arguments; use `require_auth_for_args` when only specific args matter. In tests, `mock_all_auths()` hides auth bugs: add tests that *don't* mock and assert failure for the wrong caller.
6. **Signature verification traps.** `ed25519_verify` panics (traps) on failure. You cannot "catch" it. Design APIs accordingly.
7. **Ledger entry size and contract size limits** exist; unbounded `Vec`s in a single entry are a risk. Cap sizes.
8. **No floating point, no randomness you can rely on.** Don't generate secrets on-chain.
9. **Timestamps** come from the ledger (`env.ledger().timestamp()`), in seconds. Don't assume wall-clock precision.
10. **Contract SDK API drift.** Registering a contract in tests (`env.register(...)` vs older `register_contract`), testutils, and event APIs have changed across SDK versions. Check the installed version's docs.
11. **Fees are multi-dimensional.** Resource usage (CPU instructions, memory, ledger entry reads/writes, bytes, rent) determines the fee. Always simulate before submit; add a fee buffer in the SDK.
12. **Testnet resets** periodically; contract IDs and accounts disappear. Keep `deployments/testnet.json` current and make redeploy a one-command script.
13. **`Address` vs strkey strings.** `Address::to_string()` gives the strkey. Keep one canonical conversion in the client (`parseDid`).
14. **Upgradeability.** If you ever need it, design storage versioning up front. For v1 on testnet, document "redeploy, don't upgrade".

---

## 14. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `cargo build` fails on wasm target | Missing or wrong target for the current SDK | Check the current Soroban docs for the target name and `rustup target add` it |
| Tests pass but real invoke fails with auth error | Tests used `mock_all_auths` | Add non-mocked auth tests; check the signer/source account |
| `HostError: Error(Storage, MissingValue)` | Entry missing or archived | Verify the DID exists; check TTL; restore if archived |
| `HostError: Error(Auth, InvalidAction)` | Missing `require_auth` or wrong Address | Review auth path and invocation args |
| `Error(Budget, ExceededLimit)` | Too much work per call | Bound loops/sizes; measure; optimize storage |
| Simulation succeeds, submit fails | Stale sequence number, fee too low, ledger expiry | Rebuild from fresh account state; add fee buffer; retry |
| Bindings don't compile | CLI/SDK version mismatch, old `stellar-sdk` | Regenerate with current CLI; align `@stellar/stellar-sdk` |
| Wallet can't sign messages | Wallet doesn't support message signing | Use documented fallback; list per-wallet support in README |
| Next.js "window is not defined" | Browser code at import time | Move into effects; mark `"use client"` |
| Package works in monorepo but not after split | Hidden `workspace:*`, `file:`, or path import | Pre-flight checklist in §10 |
| Agent keeps looping | Context bloat or ambiguous task | New session, session starter, smaller task, include the exact error |
| Agent invents an API | Stale training data | Make it open the docs or read `node_modules`/`~/.cargo/registry` source |

---

## 15. Glossary

- **DID:** Decentralized Identifier, a URI like `did:stellar:testnet:G…` that resolves to a DID document.
- **DID document:** the set of keys, relationships and services for a DID.
- **Verification method:** a public key (or similar) listed in a DID document.
- **Verification relationship:** a role for a key: `authentication`, `assertionMethod`, etc.
- **Controller:** the entity that can change a DID document.
- **Verifiable Credential (VC):** a signed claim about a subject, issued by an issuer.
- **Issuer / holder / verifier:** who signs the credential / who carries it / who checks it.
- **Anchoring:** recording a credential's hash on-chain so status can be checked.
- **Revocation:** invalidating a previously issued credential.
- **Soroban:** Stellar's smart contract platform (Wasm, Rust SDK).
- **Resource fee:** Soroban's fee for CPU, memory, ledger I/O, bytes and rent.
- **TTL / archival / restore:** ledger-based lifetime of storage entries.
- **RPC / simulation:** Soroban RPC endpoint; simulation estimates fees and returns results without submitting.
- **Strkey:** Stellar's base32 address format (`G…` accounts, `C…` contracts).
- **Wave:** the Drips Network Stellar Wave program: contributors earn points for resolving maintainers' issues.
- **JCS:** JSON Canonicalization Scheme (RFC 8785).
- **SEP:** Stellar Ecosystem Proposal.

---

## 16. Appendices

### Appendix A — `STATUS.md` template

```markdown
# STATUS

**Updated:** YYYY-MM-DD HH:MM
**Current phase:** N — name
**Current task:** …

## Environment / pinned versions
- rustc …, soroban-sdk …, stellar-cli …
- node …, pnpm …, typescript …, @stellar/stellar-sdk …, react …, next …, docusaurus …

## Done
- [x] Phase 0 (commit abc123)
- [x] Phase 1: create_did, resolve (commit def456)

## In progress
- …

## Next
1. …

## Decisions (append-only, dated)
- 2025-01-01: DID per controlling Address (see PLAYBOOK §2 #10)

## Blockers / open questions
- …

## Interface freeze
- Contract interface frozen at commit: (blank until Gate 1b)

## Deployments
- testnet contract ID: … wasm hash: … deployed: …
```

### Appendix B — `opencode.json` (starting point; verify key names in the current OpenCode docs)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "edit": "ask",
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "git diff*": "allow",
      "git log*": "allow",
      "cargo test*": "allow",
      "cargo fmt*": "allow",
      "cargo clippy*": "allow",
      "pnpm lint*": "allow",
      "pnpm typecheck*": "allow",
      "pnpm test*": "allow",
      "pnpm build*": "allow",
      "git push*": "deny",
      "rm -rf*": "deny"
    }
  }
}
```
Loosen `edit` to `allow` after you trust the workflow, keep `bash` guarded. Anything with `--network mainnet` should always be a human-typed command.

### Appendix C — OpenCode custom commands (markdown files; confirm directory name for your version)

`.opencode/command/phase.md`
```markdown
---
description: Plan the given phase without editing files
---
Read AGENTS.md, STATUS.md and the PLAYBOOK section for phase $ARGUMENTS.
Produce a numbered task list with acceptance criteria, risks, and the exact verify command.
Do not edit any files.
```

`.opencode/command/verify.md`
```markdown
---
description: Run the verify command for a package and summarize
---
Run the verify command from AGENTS.md for the package "$ARGUMENTS".
Report pass/fail per step. If anything fails, show the minimal error and propose a fix; do not apply it until I confirm.
```

`.opencode/command/handoff.md`
```markdown
---
description: Update STATUS.md and prepare a clean handoff for the next session
---
Update STATUS.md: done, in progress, next, decisions, blockers, and any version pins you learned.
Then list uncommitted changes. Do not commit.
```

`.opencode/command/audit.md`
```markdown
---
description: Adversarial security review of the core contract
---
Act as an independent Soroban security auditor reviewing stellar-id-core.
List ways to hijack, grief, or bypass authorization on a DID or credential, with severity.
For each, write a failing test that demonstrates it. Do not fix anything yet.
```

### Appendix D — Per-package README skeleton

```markdown
# <package>
One-sentence purpose · badges (CI, license, version)

**Status:** testnet / v0.x — <honest limitations>

## Install
## 30-second example
## What's implemented (and what isn't yet)
## Documentation
## Development (setup + verify command)
## Contributing (link) · Security (link) · License
```

### Appendix E — Phase gate summary

| Gate | Human checks |
|---|---|
| 1a | METHOD_SPEC.md and interface reviewed; name-conflict check resolved |
| 1b | Contract read line by line; tests rerun; interface frozen |
| 3 | Live testnet invocation done by hand |
| 4 | Node example runs the full lifecycle on testnet |
| 5 | Demo flow done with a real wallet |
| 7 | Security review log signed off; README honesty pass done |
| 8 | All four repos green; Wave checklist complete |
