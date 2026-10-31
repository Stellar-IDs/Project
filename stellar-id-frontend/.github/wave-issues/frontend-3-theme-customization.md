**Title:** Theme customization: presets, provider API, high contrast

## Summary
Components use `--sid-*` CSS variables with one default theme and dark mode
via `data-sid-theme`. Add theme presets, a small provider API, documented
tokens, and a high-contrast mode.

## Background
- `src/theme/variables.css` (search `TODO(wave: frontend-3)`).
- No hardcoded colors are allowed in component CSS.

## Scope
- [ ] Documented token list (name, purpose, default light/dark values)
- [ ] 2–3 presets plus high-contrast, meeting WCAG AA contrast
- [ ] Optional `ThemeProvider` (or a documented attribute-based API) that is SSR-safe

## Out of scope
- A visual theme builder

## Acceptance criteria
- [ ] Contrast checks for every preset (automated or documented)
- [ ] Storybook shows each preset; axe clean
- [ ] Verify command passes

**Points:** 2 · **Labels:** wave, area:react, design
