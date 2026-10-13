# Security

**Scope:** `stellar-id-client` is an SDK that resolves identities, builds and signs Soroban transactions, and verifies credentials. It runs in Node.js and browsers and may hold key material in memory when a `Signer` is used.

## Supported environment

- **Testnet only** in v1. Mainnet is an explicit non-goal (see `PLAYBOOK.md` §1.4 in the monorepo root).

## Responsible disclosure

If you find a vulnerability:

1. Report it privately — open a **private** issue or use the repository's GitHub security advisory flow, describing the finding and how to reproduce it.
2. Do not post exploits in public issues before a fix exists.

We will triage, respond, and credit reporters (unless they prefer anonymity).

## Key handling rules for contributors

- No secret keys, seed phrases, or API keys in the repository, logs, or commits.
- Signers must never log the material they sign.
- Network configuration (RPC URL, passphrase, contract ID) comes from config, never hard-coded.

## Threat model (summary)

The full version lands with the Phase 4 implementation.

- **Assets:** user DID control, signed transactions, credential proofs.
- **Attackers:** malicious RPC endpoints, phishing sites, tampered dependency updates.
- **Mitigations:** typed errors, simulation before submission, explicit network configs, pinned lockfile, dependency review in CI.
