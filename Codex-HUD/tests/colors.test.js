import test from 'node:test';
import assert from 'node:assert/strict';
import { cyan } from '../dist/colors.js';

const ANSI_RE = /\x1b\[[0-9;]*m/;

function withEnv(env, fn) {
  const prev = {
    FORCE_COLOR: process.env.FORCE_COLOR,
    NO_COLOR: process.env.NO_COLOR,
    CLICOLOR: process.env.CLICOLOR,
    CLICOLOR_FORCE: process.env.CLICOLOR_FORCE,
  };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('colors are enabled by default', () => {
  withEnv({ FORCE_COLOR: undefined, NO_COLOR: undefined, CLICOLOR: undefined, CLICOLOR_FORCE: undefined }, () => {
    assert.match(cyan('HUD'), ANSI_RE);
  });
});

test('NO_COLOR disables ANSI output', () => {
  withEnv({ FORCE_COLOR: undefined, NO_COLOR: '1', CLICOLOR: undefined, CLICOLOR_FORCE: undefined }, () => {
    assert.equal(cyan('HUD'), 'HUD');
  });
});

test('FORCE_COLOR overrides NO_COLOR', () => {
  withEnv({ FORCE_COLOR: '1', NO_COLOR: '1', CLICOLOR: '0', CLICOLOR_FORCE: undefined }, () => {
    assert.match(cyan('HUD'), ANSI_RE);
  });
});
