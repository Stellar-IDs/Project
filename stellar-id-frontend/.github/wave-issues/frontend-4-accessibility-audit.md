**Title:** Accessibility audit (WCAG 2.2 AA)

## Summary
Components have automated axe checks in unit tests. Do a written WCAG audit
with manual keyboard and screen-reader testing, and fix what it finds.

## Background
- `test/components.test.tsx` (search `TODO(wave: frontend-4)`).
- Components: `IdentityLogin`, `IdentityProfile`, `CredentialBadge`, `withAuth`.
- Storybook has no a11y addon yet.

## Scope
- [ ] Manual audit: keyboard-only, NVDA or VoiceOver, 200% zoom, reduced motion
- [ ] Written report (issue, WCAG criterion, severity, fix) committed as `docs/ACCESSIBILITY.md`
- [ ] Fixes for the findings, plus the Storybook a11y addon

## Acceptance criteria
- [ ] Every finding fixed or explicitly accepted with a reason
- [ ] Verify command passes; Storybook builds with no a11y violations

**Points:** 2 · **Labels:** wave, area:react, accessibility
