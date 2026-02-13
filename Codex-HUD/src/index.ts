#!/usr/bin/env node

import { buildSnapshot, findLatestRollout } from './rollout.js';
import { render, renderTmuxLine } from './render.js';
import { loadConfig } from './config.js';

interface CliArgs {
  once: boolean;
  clear: boolean;
  tmuxLine: boolean;
  intervalMs?: number;
  rolloutPath?: string;
  codexHome?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = { once: false, clear: true, tmuxLine: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--once' || arg === 'print') {
      out.once = true;
    } else if (arg === '--tmux-line' || arg === '--status-line') {
      out.tmuxLine = true;
      out.clear = false;
    } else if (arg === '--no-clear') {
      out.clear = false;
    } else if (arg === '--rollout' && argv[i + 1]) {
      out.rolloutPath = argv[i + 1];
      i += 1;
    } else if (arg === '--codex-home' && argv[i + 1]) {
      out.codexHome = argv[i + 1];
      i += 1;
    } else if (arg === '--interval' && argv[i + 1]) {
      const n = Number.parseInt(argv[i + 1], 10);
      if (!Number.isNaN(n) && n > 0) out.intervalMs = n;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return out;
}

function printHelp(): void {
  console.log(`codex-hud\n
Usage:
  codex-hud             Watch latest Codex rollout and refresh HUD
  codex-hud --once      Print once and exit
  codex-hud --tmux-line --once
  codex-hud --status-line --once
  codex-hud --rollout <path> [--once]
  codex-hud --codex-home <path>

Options:
  --interval <ms>       Refresh interval (default from ~/.codex-hud/config.json)
  --tmux-line           Print compact single line for tmux status bar
  --status-line         Alias of --tmux-line for generic status bar integration
  --no-clear            Do not clear the terminal between refreshes
  --help                Show this help
`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function tick(args: CliArgs): Promise<number> {
  const config = loadConfig();
  const rolloutPath = args.rolloutPath ?? await findLatestRollout(args.codexHome);

  if (!rolloutPath) {
    console.log(args.tmuxLine ? 'HUD waiting: no rollout' : '[codex-hud] No rollout file found. Start a Codex session first.');
    return args.intervalMs ?? config.refreshMs;
  }

  const snapshot = await buildSnapshot(rolloutPath);
  if (args.tmuxLine) {
    console.log(renderTmuxLine(snapshot));
    return args.intervalMs ?? config.refreshMs;
  }

  const lines = render(snapshot, {
    ...config,
    refreshMs: args.intervalMs ?? config.refreshMs,
  });

  if (args.clear) {
    process.stdout.write('\x1Bc');
  }

  for (const line of lines) {
    console.log(line);
  }

  return args.intervalMs ?? config.refreshMs;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.once) {
    await tick(args);
    return;
  }

  for (;;) {
    const next = await tick(args);
    await sleep(next);
  }
}

void main();
