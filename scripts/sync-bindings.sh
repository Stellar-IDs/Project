#!/usr/bin/env bash
# Regenerate the TypeScript contract bindings and copy them into
# stellar-id-client/src/generated/. This script is the single sanctioned
# bridge between stellar-id-core and stellar-id-client (PLAYBOOK §5.1.4):
# the client never imports from the core folder by path.
#
# Usage (from the monorepo root):
#   CONTRACT_ID=<id> ./scripts/sync-bindings.sh
#   # or rely on the deployed testnet contract recorded in
#   # stellar-id-core/deployments/testnet.json (requires jq):
#   ./scripts/sync-bindings.sh
#
# After syncing, run the client verify from stellar-id-client/:
#   pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build
set -euo pipefail

SRC="$(git rev-parse --show-toplevel)"
DEPLOYMENTS="$SRC/stellar-id-core/deployments/testnet.json"

if [ -z "${CONTRACT_ID:-}" ]; then
  if [ -f "$DEPLOYMENTS" ] && command -v jq >/dev/null 2>&1; then
    CONTRACT_ID="$(jq -r .contract_id "$DEPLOYMENTS")"
  else
    echo "usage: CONTRACT_ID=<id> $0 (or install jq to read $DEPLOYMENTS)" >&2
    exit 1
  fi
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

stellar contract bindings typescript \
  --network testnet \
  --contract-id "$CONTRACT_ID" \
  --output-dir "$TMP/bindings"

mkdir -p "$SRC/stellar-id-client/src/generated"
cp "$TMP/bindings/src/index.ts" "$SRC/stellar-id-client/src/generated/index.ts"

echo "synced bindings for $CONTRACT_ID into stellar-id-client/src/generated/index.ts"
echo "header contract id: $(grep -m1 'contractId:' "$SRC/stellar-id-client/src/generated/index.ts")"
