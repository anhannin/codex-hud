#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CMD="cd '$REPO_DIR' && node dist/index.js --tmux-line --once 2>/dev/null"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux not found"
  exit 1
fi

if [[ -z "${TMUX:-}" ]]; then
  echo "Not inside tmux. Start tmux first, then run this script again."
  exit 1
fi

tmux set-option -g status on
tmux set-option -g status-interval 2
tmux set-option -g status-right-length 200
tmux set-option -g status-right "#($CMD)"

echo "tmux HUD enabled on status-right"
