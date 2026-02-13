# Codex HUD

Codex HUD is an open-source status line HUD for Codex CLI that displays Claude-HUD style usage and status information in the terminal.

![Codex HUD screenshot](docs/assets/hud-example.png)

## What It Does
- Parses Codex rollout logs (`~/.codex/sessions/**/rollout-*.jsonl`)
- Shows current model, project, and Git branch state
- Displays 5-hour and 7-day usage bars with remaining reset time
- Uses Spark limits when the active model is `spark`, otherwise uses default limits

## Quick Start
```bash
git clone https://github.com/anhannin/codex-hud.git
cd codex-hud
./install.sh
```

## Supported Environment
- Target: HUD harness for Codex CLI on Linux
- OS: Linux (Ubuntu/Debian, Fedora/RHEL, Arch, openSUSE)
- Shell: bash, zsh
- Runtime: Node.js + npm, Rust toolchain (`cargo`)
- Package managers auto-detected by installer: `apt-get`, `dnf`, `pacman`, `zypper`
- Not a primary target: native Windows/macOS

`install.sh` automatically:
- Builds the HUD (`npm ci`, `npm run build`)
- Applies the Codex source patch and builds patched `codex`
- Installs patched binary to `~/.local/bin/codex`
- Configures `~/.codex/config.toml` with `status_line_command`

## Apply in Current Terminal
Changes do not appear in already-running Codex sessions.

1. Exit the current Codex session
2. Start Codex again
3. Check the HUD in the bottom status line

Verification commands:
```bash
grep -n "status_line_command" ~/.codex/config.toml
cd ~/codex-hud && node dist/index.js --status-line --once --no-clear
```

## Commands
```bash
npm run build      # Build TypeScript output
npm run dev        # Build in watch mode
npm test           # Build + run Node tests
```

## Release / Deployment
Minimum pre-release checklist:
1. Run local verification: `npm test`
2. Validate install on a fresh terminal: `./install.sh`
3. Confirm runtime behavior: `codex --version` and HUD output
4. Push commit/tag and update GitHub release notes

Quick install for users:
```bash
git clone https://github.com/anhannin/codex-hud.git
cd codex-hud
./install.sh
```

## Color Control
```bash
NO_COLOR=1 codex                 # Disable HUD colors
FORCE_COLOR=1 codex              # Force-enable HUD colors
FORCE_COLOR=0 codex              # Force-disable HUD colors
```

## Example HUD Line
```text
HUD • g5.3c • Usage ██░░░░░░░░ 25% (1h 30m / 5h) | ████████░░ 80% (1d 3h / 7d)
```

## Troubleshooting
- HUD looks broken: reinstall latest build, then restart Codex session
- Install succeeded but HUD not shown: restart sessions launched before install
- `tmux: command not found`: tmux mode is optional, not required

## Support
- Bug reports: `https://github.com/anhannin/codex-hud/issues`

## Project Layout
- `src/`: HUD parser and renderer sources
- `dist/`: Build output
- `scripts/`: Install/patch/config scripts
- `patches/`: Codex TUI patch files
- `tests/`: Test files
- `docs/`: Analysis and design docs

## Promotion
- Launch copy templates: `docs/promo/launch-kit.md`
