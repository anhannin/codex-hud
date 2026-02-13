# Claude HUD Analysis for Codex Port

## What Claude HUD Does Well
- Renders a compact, always-visible operational summary (context, usage, git, tools, agents, todos).
- Uses a native statusline command hook: Claude Code feeds fresh JSON on `stdin` and references `transcript_path`.
- Keeps architecture simple: parse inputs, parse transcript JSONL, render lines, print to `stdout`.
- Uses opt-in activity lines so default UI remains low-noise.

## Codex Constraints (Confirmed from openai/codex source)
- Codex has built-in `tui.status_line` items, but no external command-style statusline API equivalent to Claude plugin statusline.
- Public config supports `notify = ["cmd", ...]` after turn completion.
- Codex persists rich rollout JSONL under `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` including:
  - `event_msg.exec_command_begin/end`
  - `event_msg.mcp_tool_call_begin/end`
  - `event_msg.turn_started/turn_complete`
  - `event_msg.token_count` (context + rate limits)
  - `event_msg.plan_update` / `plan_delta`

## Port Strategy Chosen
- Build `codex-hud` as an external HUD harness that tails rollout JSONL in near real-time.
- Keep the Claude HUD mental model (session line + activity + plan), but drive data from Codex rollout events.
- Ship as a standalone CLI (`codex-hud`) so users can run it in split panes, dedicated terminal tabs, or wrappers.

## Scope of MVP
- Automatic latest rollout discovery.
- Context and rate-limit display from `token_count`.
- Tool activity display from exec and MCP begin/end events.
- Plan progress display from `plan_update`.
- Git branch/dirty status from current session cwd.

## Next Iterations
- Better active-session selection when multiple Codex sessions are running.
- Optional tmux status bar integration.
- More robust plan extraction from streamed deltas.
- Packaging and release automation (npm + GitHub release binaries if needed).
