import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Extension → language mapping (for analysis purposes)
// ---------------------------------------------------------------------------

const EXTENSION_LANG: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript',
  '.js': 'javascript', '.jsx': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.java': 'java',
  '.rs': 'rust',
  '.cs': 'csharp',
  '.rb': 'ruby',
};

/** Extensions that the analyzer should consider as source code. */
const SOURCE_EXTENSIONS = new Set(Object.keys(EXTENSION_LANG));

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'target', '.next',
  '__pycache__', 'vendor', '.venv', 'venv', '.vibelint', '.claude',
  '.cursor', '.windsurf', 'coverage', '.nyc_output',
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SourceFile {
  /** Absolute path to the file. */
  absolutePath: string;
  /** Path relative to the repo root. */
  relativePath: string;
  /** Normalized language key (e.g. "typescript", "python"). */
  language: string;
  /** File extension including the dot. */
  extension: string;
}

export interface LanguageSummary {
  language: string;
  fileCount: number;
  files: SourceFile[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Walk a repository and collect all analyzable source files.
 * Skips common non-source directories.
 *
 * @param repoPath Absolute path to the repo root.
 * @param maxFiles Maximum files to index (safety limit).
 */
export function collectSourceFiles(repoPath: string, maxFiles = 10_000): SourceFile[] {
  const results: SourceFile[] = [];

  function walk(dir: string): void {
    if (results.length >= maxFiles) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) return;

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          walk(path.join(dir, entry.name));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SOURCE_EXTENSIONS.has(ext)) {
          const absolutePath = path.join(dir, entry.name);
          results.push({
            absolutePath,
            relativePath: path.relative(repoPath, absolutePath),
            language: EXTENSION_LANG[ext],
            extension: ext,
          });
        }
      }
    }
  }

  walk(repoPath);
  return results;
}

/**
 * Group source files by language and produce a summary.
 */
export function summarizeLanguages(files: SourceFile[]): LanguageSummary[] {
  const map = new Map<string, SourceFile[]>();
  for (const f of files) {
    const list = map.get(f.language) ?? [];
    list.push(f);
    map.set(f.language, list);
  }
  return [...map.entries()]
    .map(([language, langFiles]) => ({ language, fileCount: langFiles.length, files: langFiles }))
    .sort((a, b) => b.fileCount - a.fileCount);
}
