#!/usr/bin/env bash
# Fails if anything that looks like an Anthropic API key (or another common credential) is present.
#   bash scripts/check-no-secrets.sh                 # all git-tracked files in the repo
#   bash scripts/check-no-secrets.sh results         # a directory (e.g. results before committing them)
#   bash scripts/check-no-secrets.sh --staged        # staged changes (used by the pre-commit hook)
#   bash scripts/check-no-secrets.sh --history       # entire git history (run once before sharing the repo)
set -euo pipefail
PATTERN='(sk-ant-[A-Za-z0-9_-]{16,}|ANTHROPIC_API_KEY[[:space:]]*=[[:space:]]*["'"'"']?[A-Za-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16})'
repo_root="$(git rev-parse --show-toplevel)"
found=0
case "${1:-}" in
  --staged)  git -C "$repo_root" diff --cached -U0 | grep -nE "^\+.*$PATTERN" && found=1 || true ;;
  --history) git -C "$repo_root" log -p --all | grep -nE "$PATTERN" && found=1 || true ;;
  "")        git -C "$repo_root" ls-files -z | (cd "$repo_root" && xargs -0 grep -nIE "$PATTERN" 2>/dev/null) && found=1 || true ;;
  *)         grep -rnIE "$PATTERN" "$1" && found=1 || true ;;
esac
if [ "$found" -eq 1 ]; then
  echo "SECRET SCAN FAILED: credential-like content found (see lines above). Remove it and rotate the credential." >&2
  exit 1
fi
echo "secret scan: clean"
