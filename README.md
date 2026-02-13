# Codex HUD

Codex HUD is an open-source status line HUD for Codex CLI, rendering Claude-HUD style usage and session status directly in the terminal.

![Codex HUD screenshot](Codex-HUD/docs/assets/hud-example.png)

## What This Project Does
- Parse Codex rollout logs (`~/.codex/sessions/**/rollout-*.jsonl`)
- Show model, project, branch, and usage windows (5h, 7d) in the HUD
- Auto-select Spark limits when the active model is `spark`, otherwise use default limits
- Support color control via `NO_COLOR` and `FORCE_COLOR`

## Repository Layout
The active project files are currently under `Codex-HUD/`.
- Main guide: `Codex-HUD/README.md`
- Source: `Codex-HUD/src/`
- Tests: `Codex-HUD/tests/`
- Installer: `Codex-HUD/install.sh`
- Codex patch: `Codex-HUD/patches/codex-statusline-command.patch`

## Quick Start
```bash
git clone https://github.com/anhannin/codex-hud.git
cd codex-hud/Codex-HUD
./install.sh
```

`install.sh` automatically:
- Builds the HUD (`npm ci`, `npm run build`)
- Builds patched Codex and installs it to `~/.local/bin/codex`
- Configures `~/.codex/config.toml` with the status line command

## Supported Environment
- Linux (Ubuntu/Debian, Fedora/RHEL, Arch, openSUSE)
- bash / zsh
- Node.js + npm, Rust (`cargo`)

## Validate Install
```bash
codex --version
grep -n "status_line_command" ~/.codex/config.toml
cd codex-hud/Codex-HUD && node dist/index.js --status-line --once --no-clear
```

## Support
- Bug reports: `https://github.com/anhannin/codex-hud/issues`
