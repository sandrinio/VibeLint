import { execFileSync } from 'node:child_process';

export interface ExecResult {
  stdout: string;
  success: boolean;
}

/**
 * Execute a command with arguments using execFileSync (prevents command injection).
 */
export function exec(command: string, args: string[], cwd?: string): ExecResult {
  try {
    const stdout = execFileSync(command, args, {
      cwd,
      encoding: 'utf-8',
      timeout: 30_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).toString().trim();
    return { stdout, success: true };
  } catch {
    return { stdout: '', success: false };
  }
}
