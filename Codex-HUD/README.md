# Codex HUD

Real-time HUD harness for Codex sessions.

`codex-hud` reads Codex rollout JSONL files (`~/.codex/sessions/**/rollout-*.jsonl`) and renders a concise, multi-line operational view:
- model + project + git state
- context usage + rate-limit windows
- running/recent tool activity (exec + MCP)
- current plan progress

## Why this shape
Codex currently provides built-in `tui.status_line` items, but not a Claude-style external statusline command plugin API. This project uses rollout events as the durable data source.

## Install
One-shot install (recommended):
```bash
git clone https://github.com/anhannin/codex-hud.git
cd codex-hud
./install.sh
```

What `install.sh` does automatically:
- detects or clones `openai/codex` source
- applies the Codex status-line patch
- installs Rust (`rustup`) if missing, then builds patched `codex`
- installs patched binary to `~/.local/bin/codex` and updates shell PATH preference
- configures `~/.codex/config.toml` with HUD status-line settings

Manual install:
```bash
npm ci
npm run build
npm link
```

Then run:
```bash
codex-hud
```

## Usage
```bash
# Watch latest session
codex-hud

# One-shot render
codex-hud --once

# Target a specific rollout file
codex-hud --rollout ~/.codex/sessions/2026/02/13/rollout-....jsonl --once

# Custom refresh interval
codex-hud --interval 500
```

## Tmux Bottom Bar (same screen)
If you use Codex inside tmux, you can pin HUD to the bottom status bar:

```bash
cd /home/avees/Codex-HUD
npm run build
./scripts/tmux-enable.sh
```

Disable later:

```bash
./scripts/tmux-disable.sh
```

## Config
Optional config file: `~/.codex-hud/config.json`

```json
{
  "refreshMs": 700,
  "maxTools": 3,
  "showPlan": true,
  "showRates": true
}
```

## Development
```bash
npm run build
npm test
```

## References
- Analysis and port notes: `docs/claude-hud-analysis.md`

## Codex Source Patch (same-screen bottom line)
To get Claude-hud-style inline bottom status in the same Codex TUI screen, use the provided Codex source patch.

1. Clone `openai/codex`
2. Apply patch:

```bash
cd /home/avees/Codex-HUD
./scripts/apply-codex-patch.sh /path/to/openai-codex
```

3. Build/run patched Codex from source
4. Auto-configure `~/.codex/config.toml`:

```bash
./scripts/configure-codex-statusline.sh
```

Manual equivalent:

```toml
[tui]
status_line = []
status_line_command = "cd /home/avees/Codex-HUD && node dist/index.js --status-line --once --no-clear"
```

Notes:
- `status_line_command` output is appended to the TUI status line.
- Command is executed asynchronously with a short timeout to avoid UI stalls.
