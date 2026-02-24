import fs from 'node:fs';
import type { SourceFile } from './languages/detector.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface FileSizeResult {
  /** Overall status for the file-size check. */
  status: CheckStatus;
  /** Summary text (e.g. "3 files over 300 lines"). */
  summary: string;
  /** Per-file details for files that exceed thresholds. */
  issues: FileSizeIssue[];
}

export interface FileSizeIssue {
  relativePath: string;
  lines: number;
  status: CheckStatus;
}

export interface FunctionSizeResult {
  status: CheckStatus;
  summary: string;
  issues: FunctionSizeIssue[];
}

export interface FunctionSizeIssue {
  relativePath: string;
  functionName: string;
  lines: number;
  lineNumber: number;
  status: CheckStatus;
}

// ---------------------------------------------------------------------------
// Thresholds (can be overridden from config)
// ---------------------------------------------------------------------------

export interface SizeThresholds {
  fileWarnLines: number;
  fileFailLines: number;
  funcWarnLines: number;
  funcFailLines: number;
}

const DEFAULT_THRESHOLDS: SizeThresholds = {
  fileWarnLines: 300,
  fileFailLines: 500,
  funcWarnLines: 50,
  funcFailLines: 100,
};

// ---------------------------------------------------------------------------
// Function detection regexes per language
// ---------------------------------------------------------------------------

const FUNCTION_PATTERNS: Record<string, RegExp[]> = {
  typescript: [
    /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>/,
    /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\(/,
  ],
  javascript: [
    /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>/,
    /^\s*(\w+)\s*\([^)]*\)\s*\{/,
  ],
  python: [
    /^\s*(?:async\s+)?def\s+(\w+)/,
  ],
  go: [
    /^\s*func\s+(?:\([^)]+\)\s+)?(\w+)/,
  ],
  java: [
    /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)+(\w+)\s*\(/,
  ],
  rust: [
    /^\s*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/,
  ],
  csharp: [
    /^\s*(?:public|private|protected|internal)?\s*(?:static\s+)?(?:async\s+)?(?:\w+\s+)+(\w+)\s*\(/,
  ],
  ruby: [
    /^\s*def\s+(\w+)/,
  ],
};

// ---------------------------------------------------------------------------
// File size check
// ---------------------------------------------------------------------------

export function checkFileSizes(
  files: SourceFile[],
  thresholds: Partial<SizeThresholds> = {},
): FileSizeResult {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const issues: FileSizeIssue[] = [];

  for (const file of files) {
    let content: string;
    try {
      content = fs.readFileSync(file.absolutePath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n').length;

    if (lines >= t.fileFailLines) {
      issues.push({ relativePath: file.relativePath, lines, status: 'fail' });
    } else if (lines >= t.fileWarnLines) {
      issues.push({ relativePath: file.relativePath, lines, status: 'warn' });
    }
  }

  issues.sort((a, b) => b.lines - a.lines);

  const failCount = issues.filter((i) => i.status === 'fail').length;
  const warnCount = issues.filter((i) => i.status === 'warn').length;

  let status: CheckStatus = 'pass';
  let summary = 'All files within size limits';
  if (failCount > 0) {
    status = 'fail';
    summary = `${failCount} file(s) over ${t.fileFailLines} lines`;
  } else if (warnCount > 0) {
    status = 'warn';
    summary = `${warnCount} file(s) over ${t.fileWarnLines} lines`;
  }

  return { status, summary, issues };
}

// ---------------------------------------------------------------------------
// Function size check
// ---------------------------------------------------------------------------

export function checkFunctionSizes(
  files: SourceFile[],
  thresholds: Partial<SizeThresholds> = {},
): FunctionSizeResult {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const issues: FunctionSizeIssue[] = [];

  for (const file of files) {
    const patterns = FUNCTION_PATTERNS[file.language];
    if (!patterns) continue;

    let content: string;
    try {
      content = fs.readFileSync(file.absolutePath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    const functions: Array<{ name: string; startLine: number }> = [];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of patterns) {
        const match = lines[i].match(pattern);
        if (match?.[1]) {
          functions.push({ name: match[1], startLine: i + 1 });
          break;
        }
      }
    }

    // Estimate function length: distance to next function or end of file
    for (let i = 0; i < functions.length; i++) {
      const start = functions[i].startLine;
      const end = i + 1 < functions.length ? functions[i + 1].startLine - 1 : lines.length;
      const funcLines = end - start + 1;

      if (funcLines >= t.funcFailLines) {
        issues.push({
          relativePath: file.relativePath,
          functionName: functions[i].name,
          lines: funcLines,
          lineNumber: start,
          status: 'fail',
        });
      } else if (funcLines >= t.funcWarnLines) {
        issues.push({
          relativePath: file.relativePath,
          functionName: functions[i].name,
          lines: funcLines,
          lineNumber: start,
          status: 'warn',
        });
      }
    }
  }

  issues.sort((a, b) => b.lines - a.lines);

  const failCount = issues.filter((i) => i.status === 'fail').length;
  const warnCount = issues.filter((i) => i.status === 'warn').length;

  let status: CheckStatus = 'pass';
  let summary = 'All functions within size limits';
  if (failCount > 0) {
    status = 'fail';
    summary = `${failCount} function(s) over ${t.funcFailLines} lines`;
  } else if (warnCount > 0) {
    status = 'warn';
    summary = `${warnCount} function(s) over ${t.funcWarnLines} lines`;
  }

  return { status, summary, issues };
}
