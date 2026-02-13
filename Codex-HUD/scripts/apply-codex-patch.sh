#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <path-to-openai-codex-repo>"
  exit 1
fi

CODEX_REPO="$1"
PATCH_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/patches/codex-statusline-command.patch"

if [[ ! -d "$CODEX_REPO/.git" ]]; then
  echo "Not a git repo: $CODEX_REPO"
  exit 1
fi

if [[ ! -f "$PATCH_FILE" ]]; then
  echo "Patch file not found: $PATCH_FILE"
  exit 1
fi

git -C "$CODEX_REPO" apply --check "$PATCH_FILE"
git -C "$CODEX_REPO" apply "$PATCH_FILE"

echo "Applied patch: external status line command support"
echo "Next: build Codex from source and run with config.toml containing [tui] status_line_command"
