**Title:** Security best-practices guide

## Summary
`docs/security/basics.md` is a short checklist. Expand it into a full guide:
key management, phishing, replay protection, revocation strategy, privacy,
and incident response.

## Background
- `docs/security/basics.md` (search `TODO(wave: docs-4)`).
- `stellar-id-core` `docs/SECURITY_REVIEW.md` (known findings, e.g. credentials
  keyed by issuer address survive controller rotation).

## Scope
- [ ] Sections: key custody, phishing-resistant sign-in (domain binding), nonce persistence, revocation and expiry, on-chain privacy (no PII), rotation and recovery, incident response
- [ ] Each recommendation tied to an SDK/contract feature or clearly marked as app responsibility

## Acceptance criteria
- [ ] Reviewed by a maintainer for accuracy against the code
- [ ] `pnpm build` passes with broken-link checking

**Points:** 2 · **Labels:** wave, documentation, security
