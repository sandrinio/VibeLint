import fs from 'node:fs';
import path from 'node:path';
import { getRepo, getDb } from '../db/queries.js';
import { collectSourceFiles, summarizeLanguages } from './languages/detector.js';
import { checkFileSizes, checkFunctionSizes, type CheckStatus } from './file-size.js';
import { checkErrorPatterns } from './error-patterns.js';
import { checkComplexity } from './complexity.js';
import { checkDuplication } from './duplication.js';
import { checkDependencies } from './dependencies.js';
import { checkCoupling } from './coupling.js';
import type { FileSizeResult, FunctionSizeResult } from './file-size.js';
import type { ErrorPatternResult } from './error-patterns.js';
import type { ComplexityResult } from './complexity.js';
import type { DuplicationResult } from './duplication.js';
import type { DependencyResult } from './dependencies.js';
import type { CouplingResult } from './coupling.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckResult {
  name: string;
  status: CheckStatus;
  summary: string;
}

export interface AnalysisReport {
  repoId: string;
  repoName: string;
  repoPath: string;
  timestamp: string;
  languageSummary: Array<{ language: string; fileCount: number }>;
  totalFiles: number;
  checks: CheckResult[];
  fileSize: FileSizeResult;
  functionSize: FunctionSizeResult;
  errorPatterns: ErrorPatternResult;
  complexity: ComplexityResult;
  duplication: DuplicationResult;
  dependencies: DependencyResult;
  coupling: CouplingResult;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/**
 * Run the full analysis pipeline on a repo.
 * Returns a structured report and persists it to SQLite + markdown file.
 */
export function runAnalysis(repoId: string): AnalysisReport {
  const repo = getRepo(repoId);
  if (!repo) throw new Error(`Repo not found: ${repoId}`);
  if (!fs.existsSync(repo.path)) throw new Error(`Repo directory does not exist: ${repo.path}`);

  const timestamp = new Date().toISOString();

  // 1. Collect source files
  const sourceFiles = collectSourceFiles(repo.path);
  const langSummary = summarizeLanguages(sourceFiles);

  // 2. Run all checks
  const fileSize = checkFileSizes(sourceFiles);
  const functionSize = checkFunctionSizes(sourceFiles);
  const errorPatterns = checkErrorPatterns(sourceFiles);
  const complexity = checkComplexity(repo.path);
  const duplication = checkDuplication(repo.path);
  const dependencies = checkDependencies(repo.path);
  const coupling = checkCoupling(repo.path);

  // 3. Build checks summary
  const checks: CheckResult[] = [
    { name: 'Complexity', status: complexity.status, summary: complexity.summary },
    { name: 'Duplication', status: duplication.status, summary: duplication.summary },
    { name: 'Error Handling', status: errorPatterns.status, summary: errorPatterns.summary },
    { name: 'File Size', status: fileSize.status, summary: fileSize.summary },
    { name: 'Function Size', status: functionSize.status, summary: functionSize.summary },
    { name: 'Dependencies', status: dependencies.status, summary: dependencies.summary },
    { name: 'Coupling', status: coupling.status, summary: coupling.summary },
  ];

  const report: AnalysisReport = {
    repoId,
    repoName: repo.name,
    repoPath: repo.path,
    timestamp,
    languageSummary: langSummary.map((l) => ({ language: l.language, fileCount: l.fileCount })),
    totalFiles: sourceFiles.length,
    checks,
    fileSize,
    functionSize,
    errorPatterns,
    complexity,
    duplication,
    dependencies,
    coupling,
  };

  // 4. Write markdown report to repo
  writeMarkdownReport(repo.path, report);

  // 5. Persist to SQLite
  persistAnalysis(report);

  return report;
}

// ---------------------------------------------------------------------------
// Markdown report writer
// ---------------------------------------------------------------------------

const STATUS_ICONS: Record<CheckStatus, string> = {
  pass: '\u2705',
  warn: '\u26A0\uFE0F',
  fail: '\u274C',
};

const STATUS_LABELS: Record<CheckStatus, string> = {
  pass: 'PASS',
  warn: 'WARN',
  fail: 'FAIL',
};

function writeMarkdownReport(repoPath: string, report: AnalysisReport): void {
  const reportsDir = path.join(repoPath, '.vibelint', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const lines: string[] = [];
  const date = new Date(report.timestamp).toISOString().replace('T', ' ').slice(0, 16);

  lines.push(`# Analysis Report — ${report.repoName}`);
  lines.push(`Generated: ${date}`);
  lines.push('');

  // Language summary
  lines.push(`## Languages (${report.totalFiles} source files)`);
  for (const lang of report.languageSummary) {
    lines.push(`- ${lang.language}: ${lang.fileCount} files`);
  }
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('| Check | Status | Details |');
  lines.push('|-------|--------|---------|');
  for (const check of report.checks) {
    lines.push(`| ${check.name} | ${STATUS_ICONS[check.status]} ${STATUS_LABELS[check.status]} | ${check.summary} |`);
  }
  lines.push('');

  // File size details
  if (report.fileSize.issues.length > 0) {
    lines.push('## File Size Issues');
    for (const issue of report.fileSize.issues.slice(0, 20)) {
      lines.push(`- ${issue.relativePath}: ${issue.lines} lines (${STATUS_LABELS[issue.status]})`);
    }
    lines.push('');
  }

  // Function size details
  if (report.functionSize.issues.length > 0) {
    lines.push('## Long Functions');
    for (const issue of report.functionSize.issues.slice(0, 20)) {
      lines.push(`- \`${issue.functionName}\` in ${issue.relativePath}:${issue.lineNumber} — ${issue.lines} lines`);
    }
    lines.push('');
  }

  // Error patterns
  if (report.errorPatterns.issues.length > 0) {
    lines.push('## Error Handling Issues');
    for (const issue of report.errorPatterns.issues.slice(0, 20)) {
      lines.push(`- ${issue.relativePath}:${issue.lineNumber} — ${issue.pattern}`);
    }
    lines.push('');
  }

  // Complexity
  if (report.complexity.issues.length > 0) {
    lines.push('## Complexity Hotspots');
    for (const issue of report.complexity.issues.slice(0, 20)) {
      lines.push(`- \`${issue.functionName}\` in ${issue.relativePath}:${issue.lineNumber} — complexity ${issue.complexity}`);
    }
    lines.push('');
  }

  // Duplication
  if (report.duplication.duplicates.length > 0) {
    lines.push('## Code Duplication');
    if (report.duplication.statistics) {
      const s = report.duplication.statistics;
      lines.push(`${s.clones} clones, ${s.duplicatedLines} duplicated lines (${s.percentage.toFixed(1)}%)`);
      lines.push('');
    }
    for (const dup of report.duplication.duplicates.slice(0, 10)) {
      lines.push(`- ${dup.firstFile.relativePath}:${dup.firstFile.startLine}-${dup.firstFile.endLine} <> ${dup.secondFile.relativePath}:${dup.secondFile.startLine}-${dup.secondFile.endLine} (${dup.lines} lines)`);
    }
    lines.push('');
  }

  // Dependencies
  if (report.dependencies.newDeps.length > 0 || report.dependencies.removedDeps.length > 0) {
    lines.push('## Dependency Changes');
    for (const dep of report.dependencies.newDeps) {
      lines.push(`- **+** ${dep.name}${dep.version ? ` (${dep.version})` : ''} in ${dep.manifest}`);
    }
    for (const dep of report.dependencies.removedDeps) {
      lines.push(`- **-** ${dep.name} in ${dep.manifest}`);
    }
    lines.push('');
  }

  // Coupling
  lines.push('## Coupling');
  lines.push(`- ${report.coupling.summary}`);
  lines.push('');

  lines.push('---');
  lines.push('*Generated by VibeLint*');

  fs.writeFileSync(path.join(reportsDir, 'latest.md'), lines.join('\n'), 'utf-8');
}

// ---------------------------------------------------------------------------
// SQLite persistence
// ---------------------------------------------------------------------------

function persistAnalysis(report: AnalysisReport): void {
  const db = getDb();

  // Insert into analyses table
  db.prepare(`
    INSERT INTO analyses (repo_id, branch, base_branch, diff_stats, analysis_data, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    report.repoId,
    null, // branch — full repo analysis, not branch-specific
    null, // base_branch
    JSON.stringify({ coupling: report.coupling }),
    JSON.stringify({
      checks: report.checks,
      totalFiles: report.totalFiles,
      languageSummary: report.languageSummary,
    }),
    report.timestamp,
  );

  // Insert into metrics_history for trending
  db.prepare(`
    INSERT INTO metrics_history (repo_id, timestamp, metrics)
    VALUES (?, ?, ?)
  `).run(
    report.repoId,
    report.timestamp,
    JSON.stringify({
      totalFiles: report.totalFiles,
      fileSizeIssues: report.fileSize.issues.length,
      functionSizeIssues: report.functionSize.issues.length,
      errorPatternIssues: report.errorPatterns.issues.length,
      complexityIssues: report.complexity.issues.length,
      duplicationClones: report.duplication.statistics?.clones ?? 0,
      dependencyChanges: report.dependencies.newDeps.length + report.dependencies.removedDeps.length,
      couplingFiles: report.coupling.filesChanged,
      couplingDirs: report.coupling.dirsChanged,
    }),
  );
}
