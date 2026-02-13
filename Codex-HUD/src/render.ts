import { bar, blue, bold, cyan, dim, green, magenta, percentColor, red, yellow } from './colors.js';
import type { HudConfig, HudSnapshot, ToolActivity } from './types.js';

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}`;
}

function formatRemaining(to?: Date): string {
  if (!to) return '';
  const diff = to.getTime() - Date.now();
  if (diff <= 0) return '';
  const mins = Math.ceil(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function toolPrefix(tool: ToolActivity): string {
  if (tool.status === 'running') return yellow('◐');
  if (tool.status === 'completed') return green('✓');
  return red('✗');
}

function renderPlan(snapshot: HudSnapshot): string | null {
  if (snapshot.plan.length === 0) return null;
  const completed = snapshot.plan.filter((p) => p.status === 'completed').length;
  const running = snapshot.plan.find((p) => p.status === 'in_progress');
  const title = running?.step ?? snapshot.plan[0]?.step;
  return `${cyan('Plan')} ${completed}/${snapshot.plan.length}${title ? ` • ${title}` : ''}`;
}

export function render(snapshot: HudSnapshot, config: HudConfig): string[] {
  const lines: string[] = [];

  const model = snapshot.model ?? 'unknown-model';
  const project = snapshot.cwd ? snapshot.cwd.split(/[\\/]/).filter(Boolean).slice(-2).join('/') : '(no-cwd)';
  const git = snapshot.gitBranch ? ` git:(${snapshot.gitBranch}${snapshot.gitDirty ? '*' : ''})` : '';
  const turn = snapshot.turnState === 'running' ? yellow('running') : dim('idle');

  lines.push(`${cyan('[Codex HUD]')} ${model} │ ${project}${git} │ turn ${turn}`);

  const parts: string[] = [];
  if (snapshot.contextUsedPercent !== undefined) {
    const c = percentColor(snapshot.contextUsedPercent);
    const usage = `${bar(snapshot.contextUsedPercent)} ${c(`${snapshot.contextUsedPercent}%`)}`;
    const tokens = snapshot.contextTokens !== undefined
      ? `${formatTokens(snapshot.contextTokens)}/${formatTokens(snapshot.contextWindow ?? 0)}`
      : '';
    parts.push(`Context ${usage}${tokens ? ` (${tokens})` : ''}`);
  }

  if (config.showRates && snapshot.ratePrimary) {
    const p = Math.round(snapshot.ratePrimary.usedPercent);
    const primary = `${percentColor(p)(`${p}%`)}${formatRemaining(snapshot.ratePrimary.resetsAt) ? `/${formatRemaining(snapshot.ratePrimary.resetsAt)}` : ''}`;
    const secondary = snapshot.rateSecondary
      ? `${percentColor(Math.round(snapshot.rateSecondary.usedPercent))(`${Math.round(snapshot.rateSecondary.usedPercent)}%`)}`
      : '';
    parts.push(`Usage ${primary}${secondary ? ` | ${secondary}` : ''}`);
  }

  if (parts.length > 0) {
    lines.push(parts.join(' │ '));
  }

  const toolLines = [...snapshot.activeTools, ...snapshot.recentTools]
    .slice(-(config.maxTools))
    .map((tool) => `${toolPrefix(tool)} ${tool.label}`);

  if (toolLines.length > 0) {
    lines.push(`Tools ${toolLines.join(' | ')}`);
  }

  if (config.showPlan) {
    const plan = renderPlan(snapshot);
    if (plan) lines.push(plan);
  }

  lines.push(dim(snapshot.sessionPath));

  return lines;
}

export function renderTmuxLine(snapshot: HudSnapshot): string {
  const model = snapshot.model ?? 'unknown';
  const project = snapshot.cwd ? snapshot.cwd.split(/[\\/]/).filter(Boolean).slice(-2).join('/') : 'no-cwd';
  const git = snapshot.gitBranch ? `${snapshot.gitBranch}${snapshot.gitDirty ? '*' : ''}` : '-';
  const turn = snapshot.turnState === 'running' ? yellow('RUN') : dim('IDLE');

  const parts: string[] = [
    `${bold(cyan('HUD'))}`,
    `${bold(blue(model))}`,
    `${magenta(project)}`,
    `${yellow(` ${git}`)}`,
    `${turn}`,
  ];

  if (snapshot.ratePrimary) {
    const used = Math.round(snapshot.ratePrimary.usedPercent);
    parts.push(`${bold(cyan('5H'))}:${percentColor(used)(`${used}%`)}`);
  }

  const activeCount = snapshot.activeTools.length;
  if (activeCount > 0) {
    const head = snapshot.activeTools[snapshot.activeTools.length - 1];
    parts.push(`${bold(green('TOOL'))}:${head.label}`);
  } else {
    parts.push(`${bold(green('TOOL'))}:${dim('idle')}`);
  }

  return parts.join(` ${dim('•')} `);
}
