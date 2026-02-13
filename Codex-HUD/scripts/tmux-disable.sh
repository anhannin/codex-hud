#!/usr/bin/env bash
set -euo pipefail

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux not found"
  exit 1
fi

if [[ -z "${TMUX:-}" ]]; then
  echo "Not inside tmux. Start tmux first, then run this script again."
  exit 1
fi

tmux set-option -gu status-right || true
echo "tmux HUD disabled from status-right"
