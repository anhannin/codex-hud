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
  if (mins >= 24 * 60) {
    const d = Math.floor(mins / (24 * 60));
    const h = Math.floor((mins % (24 * 60)) / 60);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  }
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatWindow(windowMinutes?: number): string {
  if (windowMinutes === undefined || windowMinutes <= 0) return '?';
  if (windowMinutes % (24 * 60) === 0) {
    return `${windowMinutes / (24 * 60)}d`;
  }
  if (windowMinutes % 60 === 0) {
    return `${windowMinutes / 60}h`;
  }
  return `${windowMinutes}m`;
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
  const model = snapshot.model ?? 'unknown-model';
  const modelShort = model
    .replace(/^gpt-/i, 'g')
    .replace(/-codex-spark$/i, 's')
    .replace(/-codex$/i, 'c')
    .replace(/\s+/g, '');
  const parts: string[] = [`HUD`, modelShort];

  if (snapshot.ratePrimary) {
    const p = Math.round(snapshot.ratePrimary.usedPercent);
    const pRemain = formatRemaining(snapshot.ratePrimary.resetsAt) || '--';
    const pWin = formatWindow(snapshot.ratePrimary.windowMinutes);
    let usage = `Usage ${bar(p)} ${p}% (${pRemain} / ${pWin})`;
    if (snapshot.rateSecondary) {
      const s = Math.round(snapshot.rateSecondary.usedPercent);
      const sRemain = formatRemaining(snapshot.rateSecondary.resetsAt) || '--';
      const sWin = formatWindow(snapshot.rateSecondary.windowMinutes);
      usage += ` | ${bar(s)} ${s}% (${sRemain} / ${sWin})`;
    }
    parts.push(usage);
  }

  const plain = parts.join(' • ');
  const maxLen = 120;
  if (plain.length <= maxLen) return `${plain}  `;
  return `${plain.slice(0, maxLen - 1)}… `;
}
