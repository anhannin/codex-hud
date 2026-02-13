import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../dist/render.js';

test('render emits compact HUD lines', () => {
  const lines = render(
    {
      sessionPath: '/tmp/rollout.jsonl',
      cwd: '/repo/project',
      model: 'gpt-5-codex',
      gitBranch: 'main',
      gitDirty: true,
      turnState: 'running',
      contextUsedPercent: 82,
      contextTokens: 210000,
      contextWindow: 258000,
      ratePrimary: { usedPercent: 40 },
      rateSecondary: { usedPercent: 71 },
      activeTools: [{
        id: '1',
        label: 'npm test',
        status: 'running',
        startTime: new Date('2026-01-01T00:00:00Z'),
      }],
      recentTools: [],
      plan: [
        { status: 'completed', step: 'A' },
        { status: 'in_progress', step: 'B' },
      ],
    },
    {
      refreshMs: 700,
      maxTools: 3,
      showPlan: true,
      showRates: true,
    },
  );

  assert.ok(lines.length >= 4);
  assert.ok(lines[0].includes('gpt-5-codex'));
  assert.ok(lines.some((line) => line.includes('Context')));
  assert.ok(lines.some((line) => line.includes('Tools')));
  assert.ok(lines.some((line) => line.includes('Plan')));
});
