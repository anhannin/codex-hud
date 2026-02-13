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

function detectStatusWidth(): number {
  const envWidth = Number.parseInt(process.env.CODEX_HUD_WIDTH ?? process.env.COLUMNS ?? '', 10);
  if (!Number.isNaN(envWidth) && envWidth > 0) return envWidth;
  if (process.stdout.isTTY && process.stdout.columns && process.stdout.columns > 0) return process.stdout.columns;
  return 120;
}

function shortenModel(model: string): string {
  return model
    .toLowerCase()
    .replace(/^gpt-/, 'g')
    .replace(/-codex-spark$/, 's')
    .replace(/-codex$/, 'c')
    .replace(/\s+/g, '');
}

function modelTier(model: string): string {
  if (model.toLowerCase().includes('spark')) return 'Spark';
  return 'Max';
}

function projectFromCwd(cwd?: string): string {
  if (!cwd) return 'project';
  const parts = cwd.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || 'project';
}

function trimToWidth(text: string, width: number): string {
  if (text.length <= width) return `${text}  `;
  if (width < 6) return text.slice(0, Math.max(1, width));
  return `${text.slice(0, width - 1)}… `;
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
  const modelRaw = snapshot.model ?? 'unknown-model';
  const modelShort = shortenModel(modelRaw);
  const badge = `[${modelShort} | ${modelTier(modelRaw)}]`;
  const width = detectStatusWidth();
  const project = projectFromCwd(snapshot.cwd);
  const git = snapshot.gitBranch ? `git:(${snapshot.gitBranch}${snapshot.gitDirty ? '*' : ''})` : '';
  const repoPart = git ? `${project} ${git}` : project;

  const p = snapshot.ratePrimary ? Math.round(snapshot.ratePrimary.usedPercent) : undefined;
  const pRemain = snapshot.ratePrimary ? (formatRemaining(snapshot.ratePrimary.resetsAt) || '--') : '--';
  const pWin = snapshot.ratePrimary ? formatWindow(snapshot.ratePrimary.windowMinutes) : '?';
  const s = snapshot.rateSecondary ? Math.round(snapshot.rateSecondary.usedPercent) : undefined;
  const sRemain = snapshot.rateSecondary ? (formatRemaining(snapshot.rateSecondary.resetsAt) || '--') : '--';
  const sWin = snapshot.rateSecondary ? formatWindow(snapshot.rateSecondary.windowMinutes) : '?';
  const c = snapshot.contextUsedPercent;

  let line: string;
  if (width >= 135) {
    const ctx = c !== undefined ? `Context ${bar(c, 8)} ${c}%` : '';
    const u5 = p !== undefined ? `Usage ${bar(p, 8)} ${p}% (${pRemain} / ${pWin})` : 'Usage --';
    const u7 = s !== undefined ? `${bar(s, 6)} ${s}% (${sRemain} / ${sWin})` : '';
    line = [badge, repoPart, ctx, u5, u7].filter(Boolean).join(' | ');
  } else if (width >= 105) {
    const ctx = c !== undefined ? `C ${bar(c, 6)} ${c}%` : '';
    const u5 = p !== undefined ? `U5 ${bar(p, 6)} ${p}% (${pRemain})` : 'U5 --';
    const u7 = s !== undefined ? `U7 ${bar(s, 5)} ${s}% (${sRemain})` : '';
    line = [badge, repoPart, ctx, u5, u7].filter(Boolean).join(' | ');
  } else {
    const cShort = c !== undefined ? `C${c}%` : '';
    const u5 = p !== undefined ? `U5 ${p}%` : 'U5 --';
    const u7 = s !== undefined ? `U7 ${s}%` : '';
    line = [badge, project, cShort, u5, u7].filter(Boolean).join(' | ');
  }

  return trimToWidth(line, width);
}
