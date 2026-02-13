# Codex HUD Launch Kit

Use this file to publish quickly without rewriting copy each time.

## Recommended Launch Order
1. GitHub release note (source of truth)
2. Hacker News (`Show HN`)
3. Product Hunt
4. Reddit (`r/opensource`, `r/commandline`, `r/terminal`)
5. X / LinkedIn / Discord communities

## One-Line Pitch
Codex HUD adds a Claude-HUD style status line to Codex CLI with model, Git branch, and 5h/7d usage visibility.

## Show HN Post
Title:
`Show HN: Codex HUD — Claude-HUD style status line for Codex CLI`

Body:
I built Codex HUD to make Codex CLI sessions easier to monitor at a glance.

It parses Codex rollout logs and renders a status line with:
- active model
- project + Git branch
- 5h and 7d usage bars
- Spark vs default limit auto-selection

Install:
```bash
git clone https://github.com/anhannin/codex-hud.git
cd codex-hud/Codex-HUD
./install.sh
```

Repo:
https://github.com/anhannin/codex-hud

Feedback on reliability, parsing edge cases, and UI readability is very welcome.

## Product Hunt Copy
Tagline:
`Claude-HUD style status line for Codex CLI`

Short description:
`Track model, branch, and 5h/7d usage in Codex CLI with a clean real-time HUD.`

First comment:
Codex HUD is a lightweight harness for Codex CLI that adds a practical status line for everyday sessions. It helps you track usage windows and context state without leaving the terminal.

## Reddit Post Template
Title:
`I built an open-source HUD for Codex CLI (model/git/usage in status line)`

Body:
I open-sourced Codex HUD, a status line harness for Codex CLI inspired by Claude-HUD.

Highlights:
- model + repository context
- Git branch/dirty indicator
- 5h and 7d usage bars
- Spark-aware rate window selection

Repo:
https://github.com/anhannin/codex-hud

Quick install:
```bash
git clone https://github.com/anhannin/codex-hud.git
cd codex-hud/Codex-HUD
./install.sh
```

I would appreciate feedback on usability and portability across Linux setups.

## X (Twitter) Post
I open-sourced Codex HUD: a Claude-HUD style status line for Codex CLI.
Model + Git + 5h/7d usage at a glance, directly in terminal sessions.

Repo: https://github.com/anhannin/codex-hud

## Post-Publish Checklist
- Add one screenshot or short GIF
- Pin the repo on your GitHub profile
- Reply to early comments within 24h
- Collect bug reports into GitHub issues
