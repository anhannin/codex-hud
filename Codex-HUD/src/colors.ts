export const RESET = '\x1b[0m';

function wrap(code: number, s: string): string {
  return `\x1b[${code}m${s}${RESET}`;
}

export const dim = (s: string): string => wrap(2, s);
export const bold = (s: string): string => wrap(1, s);
export const cyan = (s: string): string => wrap(36, s);
export const blue = (s: string): string => wrap(34, s);
export const magenta = (s: string): string => wrap(35, s);
export const green = (s: string): string => wrap(32, s);
export const yellow = (s: string): string => wrap(33, s);
export const red = (s: string): string => wrap(31, s);

export function percentColor(percent: number): (s: string) => string {
  if (percent >= 85) return red;
  if (percent >= 70) return yellow;
  return green;
}

export function bar(percent: number, size = 10): string {
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * size);
  return `${'█'.repeat(filled)}${'░'.repeat(Math.max(0, size - filled))}`;
}
