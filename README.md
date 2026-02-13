# Codex HUD

Claude-HUD 스타일의 사용량/상태 정보를 Codex TUI 하단 status line에 표시하는 HUD 하네스입니다.

## What This Project Does
- Codex rollout 로그(`~/.codex/sessions/**/rollout-*.jsonl`) 파싱
- 모델/프로젝트/브랜치/사용량(5h, 7d) HUD 표시
- 모델이 `spark`면 Spark limit, 아니면 기본 limit 자동 선택
- `NO_COLOR` / `FORCE_COLOR` 기반 색상 제어 지원

## Repository Layout
현재 실제 프로젝트 코드는 `Codex-HUD/` 하위에 있습니다.
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

`install.sh`가 자동 수행:
- HUD 빌드 (`npm ci`, `npm run build`)
- patched Codex 빌드 및 `~/.local/bin/codex` 설치
- `~/.codex/config.toml`에 status line command 설정

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
