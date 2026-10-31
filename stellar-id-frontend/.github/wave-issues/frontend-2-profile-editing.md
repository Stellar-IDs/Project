**Title:** Profile editing UI: manage keys and services

## Summary
`IdentityProfile` is read-only. Add editing of verification methods and
service endpoints, with transaction state, confirmations and error handling.

## Background
- `src/components/IdentityProfile.tsx` (search `TODO(wave: frontend-2)`).
- `stellar-id-client`: `updateIdentity(did, { addKeys, removeKeyIds, addServices, removeServiceIds, ... }, { signer })`.
- Contract limits: 10 keys, 10 services, https endpoints ≤ 512 bytes, ids ≤ 128 bytes
  (errors surface as `SimulationError` with the contract error name).

## Scope
- [ ] Add/remove key and add/remove service forms with validation that matches the contract limits
- [ ] Pending / success / error states announced via `aria-live`
- [ ] Confirmation before destructive actions; refresh via `useDidDocument().refetch`

## Out of scope
- Controller rotation and deactivation UI

## Acceptance criteria
- [ ] Tests for each action (happy and failure), keyboard operation, axe clean
- [ ] Storybook stories for the editing states
- [ ] Verify command passes

**Points:** 3 · **Labels:** wave, area:react
