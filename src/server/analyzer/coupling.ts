import { exec } from '../utils/exec.js';
import type { CheckStatus } from './file-size.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CouplingResult {
  status: CheckStatus;
  summary: string;
  filesChanged: number;
  dirsChanged: number;
  additions: number;
  deletions: number;
}

export interface CouplingThresholds {
  warnFiles: number;
  failFiles: number;
  warnDirs: number;
  failDirs: number;
}

const DEFAULT_THRESHOLDS: CouplingThresholds = {
  warnFiles: 20,
  failFiles: 40,
  warnDirs: 8,
  failDirs: 15,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze coupling by looking at git diff statistics.
 *
 * Measures how many files and directories are touched compared to the
 * base branch (default: main). High file/directory counts suggest
 * tightly coupled changes.
 */
export function checkCoupling(
  repoPath: string,
  baseBranch = 'main',
  thresholds: Partial<CouplingThresholds> = {},
): CouplingResult {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Try diffing against the base branch
  let diffResult = exec('git', ['diff', '--stat', `${baseBranch}...HEAD`], repoPath);

  // If base branch doesn't exist, try 'master'
  if (!diffResult.success) {
    diffResult = exec('git', ['diff', '--stat', 'master...HEAD'], repoPath);
  }

  // If still no luck, diff against the previous commit
  if (!diffResult.success) {
    diffResult = exec('git', ['diff', '--stat', 'HEAD~1'], repoPath);
  }

  if (!diffResult.success || !diffResult.stdout) {
    return {
      status: 'pass',
      summary: 'No diff available',
      filesChanged: 0,
      dirsChanged: 0,
      additions: 0,
      deletions: 0,
    };
  }

  // Parse the --stat output
  const lines = diffResult.stdout.split('\n').filter((l) => l.trim());
  // Last line is the summary: "X files changed, Y insertions(+), Z deletions(-)"
  const summaryLine = lines[lines.length - 1];
  const fileLines = lines.slice(0, -1);

  // Count unique directories
  const dirs = new Set<string>();
  for (const line of fileLines) {
    const filePath = line.split('|')[0]?.trim();
    if (filePath) {
      const dirParts = filePath.split('/');
      if (dirParts.length > 1) {
        dirs.add(dirParts.slice(0, -1).join('/'));
      } else {
        dirs.add('.');
      }
    }
  }

  const filesChanged = fileLines.length;
  const dirsChanged = dirs.size;

  // Parse additions/deletions from summary line
  let additions = 0;
  let deletions = 0;
  const addMatch = summaryLine?.match(/(\d+)\s+insertion/);
  const delMatch = summaryLine?.match(/(\d+)\s+deletion/);
  if (addMatch) additions = parseInt(addMatch[1], 10);
  if (delMatch) deletions = parseInt(delMatch[1], 10);

  let status: CheckStatus = 'pass';
  if (filesChanged >= t.failFiles || dirsChanged >= t.failDirs) {
    status = 'fail';
  } else if (filesChanged >= t.warnFiles || dirsChanged >= t.warnDirs) {
    status = 'warn';
  }

  const summary = `${filesChanged} files, ${dirsChanged} dirs (+${additions} -${deletions})`;

  return { status, summary, filesChanged, dirsChanged, additions, deletions };
}
