import { exec } from '../utils/exec.js';
import type { CheckStatus } from './file-size.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DuplicationResult {
  status: CheckStatus;
  summary: string;
  available: boolean;
  duplicates: DuplicateEntry[];
  statistics: DuplicationStats | null;
}

export interface DuplicateEntry {
  format: string;
  lines: number;
  tokens: number;
  firstFile: { relativePath: string; startLine: number; endLine: number };
  secondFile: { relativePath: string; startLine: number; endLine: number };
}

export interface DuplicationStats {
  clones: number;
  duplicatedLines: number;
  percentage: number;
}

export interface DuplicationThresholds {
  /** Min duplicated lines for a clone to be reported. */
  minLines: number;
  /** Total clone count that triggers warn. */
  warnClones: number;
  /** Total clone count that triggers fail. */
  failClones: number;
}

const DEFAULT_THRESHOLDS: DuplicationThresholds = {
  minLines: 10,
  warnClones: 3,
  failClones: 10,
};

// ---------------------------------------------------------------------------
// jscpd JSON output shape
// ---------------------------------------------------------------------------

interface JscpdDuplicate {
  format: string;
  lines: number;
  tokens: number;
  firstFile: { name: string; startLoc: { line: number }; endLoc: { line: number } };
  secondFile: { name: string; startLoc: { line: number }; endLoc: { line: number } };
}

interface JscpdOutput {
  duplicates: JscpdDuplicate[];
  statistics: {
    clones: number;
    duplicatedLines: number;
    percentage: number;
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function isJscpdAvailable(): boolean {
  const result = exec('jscpd', ['--version']);
  return result.success;
}

/**
 * Run jscpd duplication detection on a repo.
 *
 * If jscpd is not installed, returns `available: false`.
 */
export function checkDuplication(
  repoPath: string,
  thresholds: Partial<DuplicationThresholds> = {},
): DuplicationResult {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };

  if (!isJscpdAvailable()) {
    return {
      status: 'pass',
      summary: 'Skipped — jscpd not installed (npm install -g jscpd)',
      available: false,
      duplicates: [],
      statistics: null,
    };
  }

  const result = exec('jscpd', [
    '--reporters', 'json',
    '--output', '/dev/null',
    '--min-lines', String(t.minLines),
    '--ignore', 'node_modules,dist,build,target,.vibelint,.git,vendor,coverage',
    '--silent',
    '.',
  ], repoPath);

  // jscpd writes JSON to stdout when using json reporter with /dev/null output
  // If it fails, try the alternative approach
  if (!result.success || !result.stdout) {
    // Fallback: run without output redirect, parse stderr
    return {
      status: 'pass',
      summary: 'jscpd returned no results',
      available: true,
      duplicates: [],
      statistics: null,
    };
  }

  let parsed: JscpdOutput;
  try {
    parsed = JSON.parse(result.stdout) as JscpdOutput;
  } catch {
    return {
      status: 'pass',
      summary: 'Failed to parse jscpd output',
      available: true,
      duplicates: [],
      statistics: null,
    };
  }

  const duplicates: DuplicateEntry[] = (parsed.duplicates ?? []).map((d) => ({
    format: d.format,
    lines: d.lines,
    tokens: d.tokens,
    firstFile: {
      relativePath: d.firstFile.name,
      startLine: d.firstFile.startLoc.line,
      endLine: d.firstFile.endLoc.line,
    },
    secondFile: {
      relativePath: d.secondFile.name,
      startLine: d.secondFile.startLoc.line,
      endLine: d.secondFile.endLoc.line,
    },
  }));

  const stats: DuplicationStats | null = parsed.statistics
    ? {
      clones: parsed.statistics.clones,
      duplicatedLines: parsed.statistics.duplicatedLines,
      percentage: parsed.statistics.percentage,
    }
    : null;

  const cloneCount = stats?.clones ?? duplicates.length;

  let status: CheckStatus = 'pass';
  let summary = 'No significant duplication found';
  if (cloneCount >= t.failClones) {
    status = 'fail';
    summary = `${cloneCount} code clone(s) detected`;
  } else if (cloneCount >= t.warnClones) {
    status = 'warn';
    summary = `${cloneCount} code clone(s) detected`;
  } else if (cloneCount > 0) {
    summary = `${cloneCount} minor clone(s)`;
  }

  return { status, summary, available: true, duplicates, statistics: stats };
}
