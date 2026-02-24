import { exec } from '../utils/exec.js';
import type { CheckStatus } from './file-size.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComplexityResult {
  status: CheckStatus;
  summary: string;
  available: boolean;
  issues: ComplexityIssue[];
}

export interface ComplexityIssue {
  relativePath: string;
  functionName: string;
  lineNumber: number;
  complexity: number;
  status: CheckStatus;
}

export interface ComplexityThresholds {
  warn: number;
  fail: number;
}

const DEFAULT_THRESHOLDS: ComplexityThresholds = {
  warn: 10,
  fail: 20,
};

// ---------------------------------------------------------------------------
// Lizard JSON output shape
// ---------------------------------------------------------------------------

interface LizardFunction {
  name: string;
  long_name: string;
  filename: string;
  nloc: number;
  complexity: number;
  token_count: number;
  start_line: number;
  end_line: number;
}

interface LizardOutput {
  function_list: LizardFunction[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if Lizard CLI is available on the system.
 */
export function isLizardAvailable(): boolean {
  const result = exec('lizard', ['--version']);
  return result.success;
}

/**
 * Run Lizard complexity analysis on a repo.
 *
 * If Lizard is not installed, returns a result with `available: false`
 * and a warning summary. The engine should handle this gracefully.
 */
export function checkComplexity(
  repoPath: string,
  thresholds: Partial<ComplexityThresholds> = {},
): ComplexityResult {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };

  if (!isLizardAvailable()) {
    return {
      status: 'pass',
      summary: 'Skipped — Lizard not installed (pip install lizard)',
      available: false,
      issues: [],
    };
  }

  // Run lizard with JSON output, exclude common non-source dirs
  const result = exec('lizard', [
    '--json',
    '--exclude', 'node_modules/*',
    '--exclude', 'dist/*',
    '--exclude', 'build/*',
    '--exclude', 'target/*',
    '--exclude', '.vibelint/*',
    '--exclude', 'vendor/*',
    '--exclude', '.git/*',
    '.', // current directory
  ], repoPath);

  if (!result.success || !result.stdout) {
    return {
      status: 'pass',
      summary: 'Lizard returned no results',
      available: true,
      issues: [],
    };
  }

  let parsed: LizardOutput;
  try {
    parsed = JSON.parse(result.stdout) as LizardOutput;
  } catch {
    return {
      status: 'pass',
      summary: 'Failed to parse Lizard output',
      available: true,
      issues: [],
    };
  }

  const issues: ComplexityIssue[] = [];

  for (const fn of parsed.function_list ?? []) {
    if (fn.complexity >= t.fail) {
      issues.push({
        relativePath: fn.filename,
        functionName: fn.name,
        lineNumber: fn.start_line,
        complexity: fn.complexity,
        status: 'fail',
      });
    } else if (fn.complexity >= t.warn) {
      issues.push({
        relativePath: fn.filename,
        functionName: fn.name,
        lineNumber: fn.start_line,
        complexity: fn.complexity,
        status: 'warn',
      });
    }
  }

  issues.sort((a, b) => b.complexity - a.complexity);

  const failCount = issues.filter((i) => i.status === 'fail').length;
  const warnCount = issues.filter((i) => i.status === 'warn').length;

  let status: CheckStatus = 'pass';
  let summary = 'All functions within complexity limits';
  if (failCount > 0) {
    status = 'fail';
    summary = `${failCount} function(s) with complexity >= ${t.fail}`;
  } else if (warnCount > 0) {
    status = 'warn';
    summary = `${warnCount} function(s) with complexity >= ${t.warn}`;
  }

  return { status, summary, available: true, issues };
}
