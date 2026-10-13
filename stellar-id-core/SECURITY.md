# Security

**Scope:** `stellar-id-core` is a Soroban smart contract that anchors decentralized identity state on Stellar. It handles no custody of user funds.

## Supported environment

- **Testnet only.** Mainnet is an explicit non-goal for v1 (see `PLAYBOOK.md` §1.4 in the monorepo root).

## Responsible disclosure

If you find a vulnerability:

1. Report it privately — open a **private** issue or use the repository's GitHub security advisory flow, describing the finding and how to reproduce it.
2. Do not post exploits in public issues before a fix exists.

We will triage, respond, and credit reporters (unless they prefer anonymity).

## Threat model (summary)

The full version lands with the Phase 1 spec (`docs/METHOD_SPEC.md`).

- **Assets:** DID control (the controller address), credential integrity (SHA-256 hashes), revocation status.
- **Attackers:** random callers, malicious issuers, replaying verifiers, phishing sites.
- **Mitigations:** `require_auth()` on every mutation, controller-rotation consent from both parties, deactivation as a terminal state, collection and string size limits, checked arithmetic, transparent events.

## Key handling

- No secret keys, seed phrases, or API keys belong in this repository, in logs, or in commits.
- Testnet identities only (e.g. `stellar keys generate deployer --network testnet --fund`).
