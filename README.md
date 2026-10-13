# Stellar Identity & Authentication Suite

A four-package identity suite on Stellar/Soroban, built in one monorepo that is split into four repositories after Phase 7.

| Package | Future repo | Purpose |
|---|---|---|
| `stellar-id-core/` | stellar-id-core | Soroban contract: `did:stellar` DID + credential anchoring + revocation |
| `stellar-id-client/` | stellar-id-client | TypeScript SDK: resolve, create, update, verify, sign-in challenges, wallet adapters |
| `stellar-id-frontend/` | stellar-id-frontend | React/Next.js components and hooks built on the client SDK |
| `stellar-id-docs/` | stellar-id-docs | Docusaurus guides, API reference, examples |

**Status:** Phase 0 scaffold — testnet only, v0.x. Nothing here implements the DID method yet; see `PLAYBOOK.md` §8 for the phase plan.

## Read first

- `AGENTS.md` — rules for agents (and humans) working in this repo
- `PLAYBOOK.md` — the build plan: decisions, architecture, phases, gates
- `STATUS.md` — living progress log with pinned versions

## Verify everything

```bash
scripts/verify-all.sh
```

On Windows, run it with Git Bash:

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/verify-all.sh
```

## License

Apache-2.0 (each package carries its own copy; root-level files are not carried over when the monorepo splits).
