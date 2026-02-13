#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_PATH="${HOME}/.codex/config.toml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --config)
      CONFIG_PATH="$2"
      shift 2
      ;;
    --repo-dir)
      REPO_DIR="$2"
      shift 2
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: configure-codex-statusline.sh [--config <path>] [--repo-dir <path>]

Updates Codex config.toml with:
  [tui]
  status_line = []
  status_line_command = "cd <repo> && node dist/index.js --status-line --once --no-clear"
USAGE
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

mkdir -p "$(dirname "$CONFIG_PATH")"
if [[ ! -f "$CONFIG_PATH" ]]; then
  : > "$CONFIG_PATH"
fi

STATUS_LINE='status_line = []'
STATUS_CMD="status_line_command = \"cd ${REPO_DIR} && node dist/index.js --status-line --once --no-clear\""

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

awk -v sl="$STATUS_LINE" -v sc="$STATUS_CMD" '
BEGIN {
  in_tui = 0;
  saw_tui = 0;
  wrote_sl = 0;
  wrote_sc = 0;
}

function flush_missing() {
  if (in_tui) {
    if (!wrote_sl) print sl;
    if (!wrote_sc) print sc;
  }
}

/^[[:space:]]*\[[^]]+\][[:space:]]*$/ {
  flush_missing();
  in_tui = ($0 ~ /^[[:space:]]*\[tui\][[:space:]]*$/);
  if (in_tui) {
    saw_tui = 1;
  }
  print $0;
  next;
}

{
  if (in_tui) {
    if ($0 ~ /^[[:space:]]*status_line[[:space:]]*=/) {
      print sl;
      wrote_sl = 1;
      next;
    }
    if ($0 ~ /^[[:space:]]*status_line_command[[:space:]]*=/) {
      print sc;
      wrote_sc = 1;
      next;
    }
  }
  print $0;
}

END {
  flush_missing();
  if (!saw_tui) {
    if (NR > 0) print "";
    print "[tui]";
    print sl;
    print sc;
  }
}
' "$CONFIG_PATH" > "$TMP_FILE"

mv "$TMP_FILE" "$CONFIG_PATH"
trap - EXIT

printf 'Updated %s\n' "$CONFIG_PATH"
printf 'Applied:\n  %s\n  %s\n' "$STATUS_LINE" "$STATUS_CMD"
