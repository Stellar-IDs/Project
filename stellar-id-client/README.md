# stellar-id-client

TypeScript SDK for the Stellar Identity & Authentication Suite: `createIdentity()`, `resolveIdentity()`, `updateIdentity()`, `deactivateIdentity()`, `issueCredential()`, `verifyCredential()`, `revokeCredential()`, sign-in challenge helpers, wallet adapters, and `toW3CDocument()` — typed wrappers around the `stellar-id-core` Soroban contract (`did:stellar` DIDs, credential anchoring, revocation).

**Status:** testnet / v0.x. Live against testnet contract `CAFPRFXKOSHELQAB7TRMLEUEYIVYRJIKSZIZ6UU5WXB5DDEUMCBHGAWV` (see `stellar-id-core/deployments/testnet.json`). Not published to npm yet (Phase 7 step). Mainnet is an explicit non-goal for v1.

## Install

```bash
pnpm add stellar-id-client
```

Requires Node 20+.

## 30-second example

```ts
import {
  createIdentity,
  KeypairSigner,
  resolveIdentity,
} from "stellar-id-client";

const signer = KeypairSigner.fromSecret(process.env.STELLAR_ID_SECRET!);
const identity = await createIdentity({ signer });
console.log(identity.did); // did:stellar:testnet:G...

const resolved = await resolveIdentity(identity.did);
console.log(resolved.didDocument);
```

Full lifecycle on testnet: `examples/node-basic` (fund an account, set `STELLAR_ID_SECRET`, `node run.mjs`). It runs create → resolve → update → issue/anchor → verify → revoke → verify-fails → deactivate.

## What's implemented (and what isn't)

- `parseDid` / `formatDid` with checksum validation
- Typed errors (`StellarIdError` subclasses — never strings)
- Resolver via RPC simulation (free, no signing); tombstones for deactivated DIDs
- Mutations with simulate → sign → submit → poll, retry with backoff on transport errors
- `toW3CDocument` JSON-LD rendering with `publicKeyMultibase`
- Credentials: JCS canonicalize → SHA-256 → Ed25519 sign/verify; cross-language vectors in `test/fixtures/test-vectors.json` (copied from `stellar-id-core`)
- Challenge/response sign-in with domain binding, expiry, and a pluggable nonce store (`InMemoryNonceStore` is dev-only)
- `KeypairSigner` (Node/tests/CI) and `WalletsKitSigner` (browser, via Stellar Wallets Kit)
- Not yet: social/passkey login, multi-RPC failover, archived-entry restore, TypeDoc site (all Wave issues)

## Wallet support matrix (only what is tested)

| Wallet / signer | Connect | Sign tx | Sign message | Notes |
|---|---|---|---|---|
| `KeypairSigner` (secret seed) | n/a | ✅ tested | ✅ tested | Node/tests/CI only. Never ship seeds in browser code. |
| `WalletsKitSigner` + any kit wallet | via kit UI | ✅ interface-tested (fake kit) | ⚠️ adapter only | Real-wallet flows (Freighter, xBull, Albedo, LOBSTR) not yet exercised against testnet. Message signing varies by wallet; absence surfaces as `WalletError`. |

## Development

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test          # unit tests (mocked RPC)
pnpm build         # ESM + CJS + d.ts
INTEGRATION=1 pnpm vitest run test/integration.test.ts  # testnet (funds a throwaway via friendbot)
```

Full monorepo verification: `scripts/verify-all.sh` (from the repo root, Git Bash on Windows).

## Documentation

- Contract interface and method spec: `stellar-id-core/docs/METHOD_SPEC.md`
- API reference: JSDoc on every public export (`src/*.ts`)

## Contributing

See `CONTRIBUTING.md`. Issue and PR templates live in `.github/`.

## Security

See `SECURITY.md`. Secrets never belong in git, logs, or bundles — the example reads `STELLAR_ID_SECRET` from the environment (`.env` is gitignored).

## License

Apache-2.0. See `LICENSE`.
