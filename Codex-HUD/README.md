# Codex HUD

Codex TUI 하단에 Claude-HUD 스타일 사용량/상태 정보를 표시하는 HUD 하네스입니다.

## What It Does
- Codex rollout 로그(`~/.codex/sessions/**/rollout-*.jsonl`)를 파싱
- 현재 모델/프로젝트/깃 브랜치 상태 표시
- 5시간/7일 사용량 바와 남은 시간 표시
- 모델이 `spark`면 Spark limit, 아니면 기본 limit 자동 선택

## Quick Start
```bash
git clone https://github.com/anhannin/codex-hud.git
cd codex-hud
./install.sh
```

## Supported Environment
- Target: Codex CLI Linux 환경용 HUD 하네스
- OS: Linux (Ubuntu/Debian, Fedora/RHEL, Arch, openSUSE)
- Shell: bash, zsh
- Runtime: Node.js + npm, Rust toolchain (`cargo`)
- Package managers auto-detected by installer: `apt-get`, `dnf`, `pacman`, `zypper`
- Not primary target: Windows/macOS native 환경

`install.sh`가 자동으로 수행하는 작업:
- HUD 빌드 (`npm ci`, `npm run build`)
- Codex 소스 패치 적용 및 patched `codex` 빌드
- `~/.local/bin/codex` 배치
- `~/.codex/config.toml`에 `status_line_command` 설정

## Apply in Current Terminal
이미 켜둔 Codex 세션에는 즉시 반영되지 않습니다.

1. 현재 Codex 세션 종료
2. 다시 실행
3. 하단 HUD 확인

확인 명령:
```bash
grep -n "status_line_command" ~/.codex/config.toml
cd ~/codex-hud && node dist/index.js --status-line --once --no-clear
```

## Commands
```bash
npm run build      # TypeScript 빌드
npm run dev        # watch 모드 빌드
npm test           # 빌드 + Node test 실행
```

## Release / Deployment
배포 전 최소 절차:
1. 로컬 검증: `npm test`
2. 설치 검증: 새 터미널에서 `./install.sh`
3. 적용 확인: `codex --version` 및 HUD 출력 확인
4. 커밋/태그 푸시 후 GitHub 릴리즈 노트 업데이트

빠른 설치(사용자 배포용):
```bash
git clone https://github.com/anhannin/codex-hud.git
cd codex-hud
./install.sh
```

## Color Control
```bash
NO_COLOR=1 codex                 # HUD 색상 비활성화
FORCE_COLOR=1 codex              # HUD 색상 강제 활성화
FORCE_COLOR=0 codex              # HUD 색상 강제 비활성화
```

## Example HUD Line
```text
HUD • g5.3c • Usage ██░░░░░░░░ 25% (1h 30m / 5h) | ████████░░ 80% (1d 3h / 7d)
```

## Troubleshooting
- HUD가 깨져 보임: 최신 버전 재설치 후 Codex 세션 재시작
- 설치 후 반영 안 됨: 설치 전에 켠 세션이면 재시작 필요
- `tmux: command not found`: tmux 모드는 선택 사항이며 필수 아님

## Project Layout
- `src/`: HUD 파서/렌더러 소스
- `dist/`: 빌드 결과
- `scripts/`: 설치/패치/적용 스크립트
- `patches/`: Codex TUI 패치 파일
- `tests/`: 테스트
- `docs/`: 분석/설계 문서
