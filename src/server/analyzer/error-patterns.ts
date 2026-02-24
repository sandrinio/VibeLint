import fs from 'node:fs';
import type { SourceFile } from './languages/detector.js';
import type { CheckStatus } from './file-size.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErrorPatternResult {
  status: CheckStatus;
  summary: string;
  issues: ErrorPatternIssue[];
}

export interface ErrorPatternIssue {
  relativePath: string;
  lineNumber: number;
  pattern: string;
  snippet: string;
}

// ---------------------------------------------------------------------------
// Pattern definitions per language
// ---------------------------------------------------------------------------

interface PatternDef {
  name: string;
  regex: RegExp;
}

const PATTERNS: Record<string, PatternDef[]> = {
  typescript: [
    { name: 'empty catch', regex: /catch\s*\([^)]*\)\s*\{\s*\}/ },
    { name: 'catch with only comment', regex: /catch\s*\([^)]*\)\s*\{\s*\/\/[^\n]*\s*\}/ },
    { name: 'todo/fixme in error handling', regex: /catch\s*\([^)]*\)\s*\{[^}]*(?:TODO|FIXME|HACK)/i },
  ],
  javascript: [
    { name: 'empty catch', regex: /catch\s*\([^)]*\)\s*\{\s*\}/ },
    { name: 'catch with only comment', regex: /catch\s*\([^)]*\)\s*\{\s*\/\/[^\n]*\s*\}/ },
    { name: 'todo/fixme in error handling', regex: /catch\s*\([^)]*\)\s*\{[^}]*(?:TODO|FIXME|HACK)/i },
  ],
  python: [
    { name: 'bare except', regex: /except\s*:/ },
    { name: 'except pass', regex: /except[^:]*:\s*\n\s+pass\s*$/ },
  ],
  go: [
    { name: 'ignored error', regex: /[^_]\s*,\s*_\s*:?=\s*\w+\(/ },
  ],
  java: [
    { name: 'empty catch', regex: /catch\s*\([^)]+\)\s*\{\s*\}/ },
  ],
  rust: [
    { name: 'unwrap()', regex: /\.unwrap\(\)/ },
    { name: 'expect() without message', regex: /\.expect\(\s*\)/ },
  ],
  csharp: [
    { name: 'empty catch', regex: /catch\s*(?:\([^)]*\))?\s*\{\s*\}/ },
  ],
  ruby: [
    { name: 'bare rescue', regex: /rescue\s*$/ },
    { name: 'rescue => nil', regex: /rescue\s.*=>\s*nil/ },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scan source files for problematic error handling patterns.
 * Uses per-line regex matching (not multiline) for speed.
 */
export function checkErrorPatterns(files: SourceFile[]): ErrorPatternResult {
  const issues: ErrorPatternIssue[] = [];

  for (const file of files) {
    const langPatterns = PATTERNS[file.language];
    if (!langPatterns) continue;

    let content: string;
    try {
      content = fs.readFileSync(file.absolutePath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const p of langPatterns) {
        if (p.regex.test(line)) {
          issues.push({
            relativePath: file.relativePath,
            lineNumber: i + 1,
            pattern: p.name,
            snippet: line.trim().slice(0, 100),
          });
          break; // one match per line
        }
      }
    }
  }

  const count = issues.length;
  let status: CheckStatus = 'pass';
  let summary = 'No error handling issues found';

  if (count >= 5) {
    status = 'fail';
    summary = `${count} error handling issue(s) found`;
  } else if (count > 0) {
    status = 'warn';
    summary = `${count} error handling issue(s) found`;
  }

  return { status, summary, issues };
}
