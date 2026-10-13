#!/usr/bin/env bash
# Runs every package's verify command from the monorepo root.
# On Windows, run with Git Bash:
#   & "C:\Program Files\Git\bin\bash.exe" scripts/verify-all.sh
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "==> stellar-id-core"
(
  cd stellar-id-core
  cargo fmt --check
  cargo clippy --all-targets -- -D warnings
  cargo test
  stellar contract build
)

for pkg in stellar-id-client stellar-id-frontend stellar-id-docs; do
  echo "==> $pkg"
  (
    cd "$pkg"
    pnpm install --frozen-lockfile
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm build
  )
done

echo "==> stellar-id-frontend/demo"
(
  cd stellar-id-frontend/demo
  pnpm install --frozen-lockfile
  pnpm build
)

echo "All packages verified."
