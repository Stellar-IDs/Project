# Security

**Scope:** `stellar-id-frontend` renders identity UIs and drives wallet sign-in flows in browsers.

## Supported environment

- **Testnet only** in v1. Mainnet is an explicit non-goal (see `PLAYBOOK.md` §1.4 in the monorepo root).

## Responsible disclosure

If you find a vulnerability:

1. Report it privately — open a **private** issue or use the repository's GitHub security advisory flow, describing the finding and how to reproduce it.
2. Do not post exploits in public issues before a fix exists.

We will triage, respond, and credit reporters (unless they prefer anonymity).

## Frontend rules for contributors

- Never log key material, signed messages, or session tokens.
- Wallet interaction code only in effects and event handlers — never at module import time (SSR safety).
- No PII in URLs, storage, or analytics.
- Dependency changes need maintainer review (supply chain).

## Threat model (summary)

The full version lands with the Phase 5 implementation.

- **Assets:** user sessions, DID control via connected wallets.
- **Attackers:** phishing sites, malicious wallet prompts, XSS through credential metadata.
- **Mitigations:** React escaping, content security policy at the demo host, minimal DOM surface, typed errors.
