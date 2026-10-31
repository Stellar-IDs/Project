# stellar-id-docs

Documentation site (Docusaurus 3) for the Stellar Identity & Authentication
Suite: `stellar-id-core`, `stellar-id-client` and `stellar-id-frontend`.

**Status:** testnet only, v0.x. **Not hosted yet**; build and preview it
locally. The Node quick start has been run verbatim against testnet; the
React quick start's real-wallet path is untested (it says so).

## Contents

Overview, concepts (DIDs, `did:stellar`, credentials, revocation, TTL,
fees), Node and React quick starts, API reference (contract, SDK,
components), security basics, migration from password/OAuth, compatibility
matrix, contributing.

## Development

```bash
pnpm install --frozen-lockfile
pnpm dev        # local preview
pnpm lint && pnpm typecheck && pnpm test
pnpm build      # fails on broken links
```

Windows note: if the build fails with `ERR_SWC_NATIVE_CACHE`, set
`SWC_NATIVE_BINDING_CACHE` to a directory only your user can write to.

**Not yet:** hosting, versioned docs, search, and code samples pulled
automatically from the tested examples (they are maintained by hand).

## Contributing · Security · License

[CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · Apache-2.0 ([LICENSE](LICENSE)) · [CHANGELOG.md](CHANGELOG.md)
