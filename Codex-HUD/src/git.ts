import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function getGitInfo(cwd?: string): Promise<{ branch?: string; dirty?: boolean }> {
  if (!cwd) {
    return {};
  }

  try {
    const { stdout: branchOut } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      timeout: 800,
    });

    const branch = branchOut.trim();
    if (!branch) {
      return {};
    }

    let dirty = false;
    try {
      const { stdout: statusOut } = await execFileAsync('git', ['--no-optional-locks', 'status', '--porcelain'], {
        cwd,
        encoding: 'utf8',
        timeout: 800,
      });
      dirty = statusOut.trim().length > 0;
    } catch {
      // noop
    }

    return { branch, dirty };
  } catch {
    return {};
  }
}
