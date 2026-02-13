import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { getGitInfo } from './git.js';
import type { HudSnapshot, PlanItem, ToolActivity } from './types.js';

interface RolloutLine {
  timestamp?: string;
  type?: string;
  payload?: unknown;
}

interface ParsedRateWindows {
  limitId?: string;
  limitName?: string;
  primary?: { usedPercent: number; resetsAt?: Date; windowMinutes?: number };
  secondary?: { usedPercent: number; resetsAt?: Date; windowMinutes?: number };
}

function toDate(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  return value;
}

function simplifyCommand(command: unknown): string {
  if (!Array.isArray(command)) return 'command';
  const words = command.filter((v) => typeof v === 'string') as string[];
  if (words.length === 0) return 'command';
  const joined = words.join(' ');
  return joined.length > 42 ? `${joined.slice(0, 39)}...` : joined;
}

function parsePlan(payload: unknown): PlanItem[] {
  if (!payload || typeof payload !== 'object') return [];
  const p = payload as { plan?: unknown; steps?: unknown };
  const raw = Array.isArray(p.plan) ? p.plan : Array.isArray(p.steps) ? p.steps : [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const i = item as { status?: unknown; step?: unknown };
      if (typeof i.status !== 'string' || typeof i.step !== 'string') return null;
      return { status: i.status, step: i.step };
    })
    .filter((x): x is PlanItem => x !== null);
}

function parseRateWindow(value: unknown): { usedPercent: number; resetsAt?: Date; windowMinutes?: number } | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as { used_percent?: unknown; resets_at?: unknown; window_minutes?: unknown };
  const usedPercent = toNumber(v.used_percent);
  if (usedPercent === undefined) return undefined;

  const resetsRaw = toNumber(v.resets_at);
  return {
    usedPercent,
    resetsAt: resetsRaw !== undefined ? new Date(resetsRaw * 1000) : undefined,
    windowMinutes: toNumber(v.window_minutes),
  };
}

function parseRatePayload(value: unknown): ParsedRateWindows | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;

  return {
    limitId: typeof raw.limit_id === 'string' ? raw.limit_id : undefined,
    limitName: typeof raw.limit_name === 'string' ? raw.limit_name : undefined,
    primary: parseRateWindow(raw.primary),
    secondary: parseRateWindow(raw.secondary),
  };
}

function isSparkModel(model?: string): boolean {
  return typeof model === 'string' && model.toLowerCase().includes('spark');
}

function isSparkLimit(raw: ParsedRateWindows): boolean {
  if (raw.limitId && /spark/i.test(raw.limitId)) return true;
  if (raw.limitName && /spark/i.test(raw.limitName)) return true;
  return false;
}

export async function findLatestRollout(codexHome?: string): Promise<string | null> {
  const home = codexHome ?? path.join(os.homedir(), '.codex');
  const sessionsDir = path.join(home, 'sessions');

  if (!fs.existsSync(sessionsDir)) {
    return null;
  }

  let latestPath: string | null = null;
  let latestMtime = 0;

  const stack = [sessionsDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) continue;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }

      if (!entry.isFile() || !entry.name.startsWith('rollout-') || !entry.name.endsWith('.jsonl')) {
        continue;
      }

      try {
        const stat = fs.statSync(full);
        const mtime = stat.mtimeMs;
        if (mtime > latestMtime) {
          latestMtime = mtime;
          latestPath = full;
        }
      } catch {
        // noop
      }
    }
  }

  return latestPath;
}

export async function buildSnapshot(rolloutPath: string): Promise<HudSnapshot> {
  const snapshot: HudSnapshot = {
    sessionPath: rolloutPath,
    turnState: 'idle',
    activeTools: [],
    recentTools: [],
    plan: [],
  };

  if (!rolloutPath || !fs.existsSync(rolloutPath)) {
    return snapshot;
  }

  const running = new Map<string, ToolActivity>();
  const allTools: ToolActivity[] = [];
  let defaultRatePrimary: ReturnType<typeof parseRateWindow> | undefined;
  let defaultRateSecondary: ReturnType<typeof parseRateWindow> | undefined;
  let sparkRatePrimary: ReturnType<typeof parseRateWindow> | undefined;
  let sparkRateSecondary: ReturnType<typeof parseRateWindow> | undefined;

  const raw = fs.readFileSync(rolloutPath, 'utf8');
  const lines = raw.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    let item: RolloutLine;
    try {
      item = JSON.parse(line) as RolloutLine;
    } catch {
      continue;
    }

    const at = toDate(item.timestamp) ?? new Date();
    const type = item.type;
    const payload = item.payload;

    if (type === 'turn_context' && payload && typeof payload === 'object') {
      const p = payload as { cwd?: unknown; model?: unknown };
      if (typeof p.cwd === 'string') snapshot.cwd = p.cwd;
      if (typeof p.model === 'string') snapshot.model = p.model;
      continue;
    }

    if (type === 'session_meta' && !snapshot.sessionStart) {
      snapshot.sessionStart = at;
      continue;
    }

    if (type !== 'event_msg' || !payload || typeof payload !== 'object') {
      continue;
    }

    const event = payload as Record<string, unknown>;
    const eventType = typeof event.type === 'string' ? event.type : '';

    if (eventType === 'turn_started') {
      snapshot.turnState = 'running';
      const window = toNumber(event.model_context_window);
      if (window !== undefined) snapshot.contextWindow = window;
      continue;
    }

    if (eventType === 'turn_complete' || eventType === 'turn_aborted') {
      snapshot.turnState = 'idle';
      continue;
    }

    if (eventType === 'token_count') {
      const info = event.info;
      if (info && typeof info === 'object') {
        const i = info as Record<string, unknown>;
        const total = i.total_token_usage;
        if (total && typeof total === 'object') {
          const t = total as Record<string, unknown>;
          const contextTokens = toNumber(t.total_tokens);
          if (contextTokens !== undefined) snapshot.contextTokens = contextTokens;
        }

        const cw = toNumber(i.model_context_window);
        if (cw !== undefined) snapshot.contextWindow = cw;
        if (snapshot.contextTokens !== undefined && snapshot.contextWindow && snapshot.contextWindow > 0) {
          snapshot.contextUsedPercent = Math.max(
            0,
            Math.min(100, Math.round((snapshot.contextTokens / snapshot.contextWindow) * 100)),
          );
        }
      }

      const rates = event.rate_limits;
      if (rates && typeof rates === 'object') {
        const parsed = parseRatePayload(rates);
        if (parsed) {
          if (isSparkLimit(parsed)) {
            sparkRatePrimary = parsed.primary;
            sparkRateSecondary = parsed.secondary;
          } else {
            defaultRatePrimary = parsed.primary;
            defaultRateSecondary = parsed.secondary;
          }
        }
      }
      continue;
    }

    if (eventType === 'plan_update' || eventType === 'plan_delta') {
      const plan = parsePlan(payload);
      if (plan.length > 0) {
        snapshot.plan = plan;
      }
      continue;
    }

    if (eventType === 'exec_command_begin') {
      const id = typeof event.call_id === 'string' ? event.call_id : `exec-${at.getTime()}`;
      const tool: ToolActivity = {
        id,
        label: simplifyCommand(event.command),
        status: 'running',
        startTime: at,
      };
      running.set(id, tool);
      allTools.push(tool);
      continue;
    }

    if (eventType === 'exec_command_end') {
      const id = typeof event.call_id === 'string' ? event.call_id : '';
      if (!id) continue;
      const status = (typeof event.exit_code === 'number' && event.exit_code === 0) ? 'completed' : 'failed';
      const existing = running.get(id);
      if (existing) {
        existing.status = status;
        existing.endTime = at;
        running.delete(id);
      } else {
        allTools.push({
          id,
          label: simplifyCommand(event.command),
          status,
          startTime: at,
          endTime: at,
        });
      }
      continue;
    }

    if (eventType === 'mcp_tool_call_begin') {
      const id = typeof event.call_id === 'string' ? event.call_id : `mcp-${at.getTime()}`;
      const invocation = event.invocation;
      let label = 'mcp tool';
      if (invocation && typeof invocation === 'object') {
        const iv = invocation as { server?: unknown; tool?: unknown };
        if (typeof iv.server === 'string' && typeof iv.tool === 'string') {
          label = `${iv.server}/${iv.tool}`;
        }
      }
      const tool: ToolActivity = { id, label, status: 'running', startTime: at };
      running.set(id, tool);
      allTools.push(tool);
      continue;
    }

    if (eventType === 'mcp_tool_call_end') {
      const id = typeof event.call_id === 'string' ? event.call_id : '';
      if (!id) continue;
      const existing = running.get(id);
      if (existing) {
        existing.status = 'completed';
        existing.endTime = at;
        running.delete(id);
      }
      continue;
    }
  }

  const git = await getGitInfo(snapshot.cwd);
  snapshot.gitBranch = git.branch;
  snapshot.gitDirty = git.dirty;

  const ordered = allTools.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  snapshot.activeTools = ordered.filter((t) => t.status === 'running').slice(-10);
  snapshot.recentTools = ordered.filter((t) => t.status !== 'running').slice(-20);

  if (isSparkModel(snapshot.model)) {
    snapshot.ratePrimary = sparkRatePrimary ?? defaultRatePrimary;
    snapshot.rateSecondary = sparkRateSecondary ?? defaultRateSecondary;
  } else {
    snapshot.ratePrimary = defaultRatePrimary ?? sparkRatePrimary;
    snapshot.rateSecondary = defaultRateSecondary ?? sparkRateSecondary;
  }

  return snapshot;
}
