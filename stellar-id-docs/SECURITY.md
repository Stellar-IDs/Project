# Security

**Scope:** `stellar-id-docs` is a static Docusaurus site. It holds no user data and no credentials.

## Responsible disclosure

If you find a vulnerability (for example, a broken-link build bypass or an XSS vector in MDX rendering):

1. Report it privately — open a **private** issue or use the repository's GitHub security advisory flow, describing the finding and how to reproduce it.
2. Do not post exploits in public issues before a fix exists.

We will triage, respond, and credit reporters (unless they prefer anonymity).

## Content rules for contributors

- Never publish secret keys, seed phrases, API keys, or PII — not even in examples.
- Never publish mainnet guidance in v1: the suite is testnet only.
- Code samples must compile and match the tested examples in the other packages.

## Deployment

The site is deployed publicly in Phase 6. The `url` in `docusaurus.config.ts` is a placeholder until then — set the real deployment URL at deploy time.
