# Testnet smoke test — 2026-10-15

Contract: `CBFXX2HCWDIQR45XNPLIMADAKO3N2EXMHJWSGNGNMJQR67TKZ4SCTXXE` (see `../deployments/testnet.json`).
Smoke identity: `smoke` → `GD5C6OVUQB56WJWF2PUZOTMLRC7AYAL2NPVAFRLGJ23B54SB5ED3ZP7F` (throwaway, funded via friendbot, DID deactivated at the end).
Deployer: `GA2DO5BZPTPE4OPB46XXZF37VGIJXG7D535QU4GWYJLZYISSXOZKKF4M`.

All commands use `--network testnet` (never mainnet).

## 1. create_did → version 1, DidCreated event

```
stellar contract invoke --id CBFXX…XXE --source-account smoke --network testnet -- \
  create_did --controller GD5C…7F \
  --doc '{"controller":"GD5C…7F","verification_methods":[{"id":"key-1","kind":"Ed25519","public_key":"197f6b…368d61"}],"authentication":["key-1"],"assertion_method":["key-1"],"services":[]}'
```

- Tx `2cf329c2495d28e9875884de5839d253687d61f5f88c57da4e79cdefd1642521` — success.
- Event: `DidCreated (did_created)`, controller `GD5C…7F`, version 1.

## 2. resolve → full record, version 1

```
stellar contract invoke --id CBFXX…XXE --source-account smoke --network testnet --send=no -- \
  resolve --controller GD5C…7F
```

Returned the record: controller `GD5C…7F`, 1 verification method (`key-1`, Ed25519, pubkey `197f6b…368d61`),
`authentication`/`assertion_method` = `["key-1"]`, no services, `created`/`updated` 1792061782,
`version` 1, `deactivated` false.

## 3. add_verification_method → version 2, DidUpdated event

```
stellar contract invoke --id CBFXX…XXE --source-account smoke --network testnet -- \
  add_verification_method --controller GD5C…7F \
  --vm '{"id":"key-2","kind":"Ed25519","public_key":"2a2a…2a2a"}'
```

- Tx `4dc4ca77549b17da6e4c4d5ad429e36f9ee8d395454ef3609204d1dca8281ba6` — success.
- Event: `DidUpdated (did_updated)`, controller `GD5C…7F`, version 2.

## 4. deactivate_did → version 3, tombstone still resolves

```
stellar contract invoke --id CBFXX…XXE --source-account smoke --network testnet -- \
  deactivate_did --controller GD5C…7F
```

- Tx `86a25ed29cc787e5929a946ef2f99a62834d3bb09f651048f123f5a41278a3f0` — success.
- Event: `DidDeactivated (did_deactivated)`, controller `GD5C…7F`.
- `resolve` afterwards returns the record with both keys, `version` 3, `deactivated` true.

## Notes

- The first deploy attempt failed with a transient `client error (Connect)` on WASM upload; retry succeeded.
- Friendbot rate-limits back-to-back funding: `smoke` funding failed right after `deployer`/`alice`/`bob`, then succeeded via `stellar keys fund smoke --network testnet` a few minutes later.
- `--is-view` is deprecated in CLI 28.1.0; reads use `--send=no`.
