**Title:** Resolver fallback: multi-RPC failover, cache and archived-entry restore

## Summary
`resolveIdentity` uses one RPC endpoint and fails if it's down or if the DID
entry is archived. Add failover across endpoints, an optional cache, and a
restore flow for archived entries.

## Background
- `src/resolver.ts`: `createDidReader` (search `TODO(wave: client-3)`), `resolveIdentity`.
- `src/gateway.ts`: error mapping (`NetworkError`, `SimulationError`).
- `src/networks.ts`: `NetworkConfig` (single `rpcUrl`).

## Scope
- [ ] `NetworkConfig` accepts several RPC URLs; reader fails over on `NetworkError`
- [ ] Optional cache (TTL-bounded) behind an interface
- [ ] Detect archived entries and expose a restore helper

## Out of scope
- An indexer/history service

## Acceptance criteria
- [ ] Tests for failover order, all-endpoints-down, cache hit/miss, archived detection
- [ ] Backward compatible: a single `rpcUrl` still works
- [ ] Verify command passes

## How to test locally
```bash
pnpm test
INTEGRATION=1 pnpm vitest run test/integration.test.ts   # optional, testnet
```

**Points:** 2 · **Labels:** wave, area:sdk
