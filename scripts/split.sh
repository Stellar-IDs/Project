#!/usr/bin/env bash
# Split the monorepo into four standalone repos (PLAYBOOK §10).
#
# Usage (from the monorepo root, Git Bash on Windows):
#   ./scripts/split.sh [OUT_DIR] [GITHUB_ORG]
#
# - OUT_DIR defaults to ../stellar-id-split and must not exist yet (the
#   script never deletes anything).
# - GITHUB_ORG, if given, adds `origin` remotes. Nothing is ever pushed.
# - Requires git-filter-repo and pnpm 12 on PATH (override pnpm with $PNPM).
#
# Per repo: fresh clone → filter to the package folder → `main` branch →
# standalone fixups for JS repos (own pnpm-workspace.yaml + lockfile),
# committed as one `chore` commit. The monorepo itself is not modified.
#
# Known limitation until stellar-id-client is on npm: the frontend repo's
# `workspace:` dependency on the client cannot resolve, so its lockfile
# step is skipped and reported (see the printed checklist).
set -euo pipefail

SRC="$(git rev-parse --show-toplevel)"
OUT="${1:-$SRC/../stellar-id-split}"
ORG="${2:-}"
PNPM="${PNPM:-pnpm}"
REPOS=(stellar-id-core stellar-id-client stellar-id-frontend stellar-id-docs)

if [ -e "$OUT" ]; then
  echo "refusing to overwrite existing $OUT" >&2
  exit 1
fi
git filter-repo --version >/dev/null
mkdir -p "$OUT"

# Settings every JS repo needs from the root pnpm-workspace.yaml (reviewed
# build-script allowlist + release-age exceptions), minus `packages`.
settings_block() {
  awk '/^packages:/{skip=1;next} skip&&/^[^ ]/{skip=0} !skip' "$SRC/pnpm-workspace.yaml"
}

pending=()
for r in "${REPOS[@]}"; do
  git clone --quiet --no-local "$SRC" "$OUT/$r"
  (
    cd "$OUT/$r"
    git filter-repo --quiet --subdirectory-filter "$r"
    git branch -M main
    # filter-repo moves every tag onto this history; keep only this
    # package's own prefixed tags (e.g. core-v0.1.0 stays in core only).
    short="${r#stellar-id-}"
    { git tag | grep -Ev "^${short}[-@]" || true; } | xargs -r git tag -d >/dev/null
    # Carry over the monorepo's repo-local identity (clones don't copy it).
    git config user.name "$(git -C "$SRC" config user.name)"
    git config user.email "$(git -C "$SRC" config user.email)"
    if [ -n "$ORG" ]; then
      git remote add origin "git@github.com:${ORG}/${r}.git"
    fi
  )

  if [ -f "$OUT/$r/package.json" ]; then
    (
      cd "$OUT/$r"
      {
        if [ "$r" = "stellar-id-frontend" ]; then
          printf 'packages:\n  - "demo"\n\n'
        fi
        settings_block
      } > pnpm-workspace.yaml
      if [ "$r" = "stellar-id-frontend" ]; then
        # The client must come from npm after the split.
        sed -i 's/"stellar-id-client": "workspace:\^0\.1\.0"/"stellar-id-client": "^0.1.0"/' \
          package.json demo/package.json
      fi
      git add -A
      git commit --quiet -m "chore: standalone pnpm workspace config after split"
    )
    if (cd "$OUT/$r" && "$PNPM" install >/dev/null 2>&1); then
      (cd "$OUT/$r" && git add pnpm-lock.yaml && git commit --quiet -m "chore: add standalone lockfile")
    else
      pending+=("$r: 'pnpm install' failed (expected for the frontend until stellar-id-client is on npm)")
    fi
  fi
  echo "prepared $OUT/$r"
done

echo
echo "Next, per repo: run its verify command, review 'git log', then push"
echo "with: git push -u origin main --tags  (needs GitHub repos; see PLAYBOOK §10)."
if [ "${#pending[@]}" -gt 0 ]; then
  echo
  echo "Pending:"
  printf '  - %s\n' "${pending[@]}"
fi
