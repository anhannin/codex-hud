export type ToolStatus = 'running' | 'completed' | 'failed';

export interface ToolActivity {
  id: string;
  label: string;
  status: ToolStatus;
  startTime: Date;
  endTime?: Date;
}

export interface RateWindow {
  usedPercent: number;
  resetsAt?: Date;
  windowMinutes?: number;
}

export interface PlanItem {
  status: string;
  step: string;
}

export interface HudSnapshot {
  sessionPath: string;
  cwd?: string;
  model?: string;
  gitBranch?: string;
  gitDirty?: boolean;
  turnState: 'idle' | 'running';
  contextUsedPercent?: number;
  contextTokens?: number;
  contextWindow?: number;
  ratePrimary?: RateWindow;
  rateSecondary?: RateWindow;
  activeTools: ToolActivity[];
  recentTools: ToolActivity[];
  plan: PlanItem[];
  sessionStart?: Date;
}

export interface HudConfig {
  refreshMs: number;
  maxTools: number;
  showPlan: boolean;
  showRates: boolean;
}

export const DEFAULT_CONFIG: HudConfig = {
  refreshMs: 700,
  maxTools: 3,
  showPlan: true,
  showRates: true,
};
