import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { DEFAULT_CONFIG, type HudConfig } from './types.js';

interface RawConfig {
  refreshMs?: unknown;
  maxTools?: unknown;
  showPlan?: unknown;
  showRates?: unknown;
}

function asPositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return fallback;
  return Math.round(value);
}

export function configPath(): string {
  return path.join(os.homedir(), '.codex-hud', 'config.json');
}

export function loadConfig(): HudConfig {
  const file = configPath();

  if (!fs.existsSync(file)) {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as RawConfig;
    return {
      refreshMs: asPositiveInt(raw.refreshMs, DEFAULT_CONFIG.refreshMs),
      maxTools: asPositiveInt(raw.maxTools, DEFAULT_CONFIG.maxTools),
      showPlan: typeof raw.showPlan === 'boolean' ? raw.showPlan : DEFAULT_CONFIG.showPlan,
      showRates: typeof raw.showRates === 'boolean' ? raw.showRates : DEFAULT_CONFIG.showRates,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}
