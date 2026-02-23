import fs from 'node:fs';
import path from 'node:path';
import { exec } from '../utils/exec.js';

export interface RepoScanResult {
  path: string;
  name: string;
  languages: string[];
  branches: string[];
  currentBranch: string;
  existingFiles: Record<string, boolean>;
}

const EXTENSION_MAP: Record<string, string> = {
  '.ts': 'TypeScript', '.tsx': 'TypeScript',
  '.js': 'JavaScript', '.jsx': 'JavaScript',
  '.py': 'Python', '.rs': 'Rust', '.go': 'Go',
  '.java': 'Java', '.kt': 'Kotlin', '.swift': 'Swift',
  '.rb': 'Ruby', '.php': 'PHP', '.cs': 'C#',
  '.cpp': 'C++', '.c': 'C', '.h': 'C', '.hpp': 'C++',
  '.css': 'CSS', '.scss': 'SCSS', '.html': 'HTML',
  '.vue': 'Vue', '.svelte': 'Svelte', '.dart': 'Dart',
  '.ex': 'Elixir', '.exs': 'Elixir', '.zig': 'Zig',
  '.lua': 'Lua', '.sh': 'Shell', '.bash': 'Shell',
  '.sql': 'SQL', '.md': 'Markdown', '.json': 'JSON',
  '.yaml': 'YAML', '.yml': 'YAML', '.toml': 'TOML',
};

const CONTEXT_FILES = [
  'CLAUDE.md', '.cursorrules', '.windsurfrules',
  'AGENTS.md', 'LESSONS.md', '.vibelint', 'vdocs',
];

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'target',
  '.next', '__pycache__', 'vendor', '.venv', 'venv',
]);

export function scanRepo(repoPath: string): RepoScanResult {
  const absolutePath = path.resolve(repoPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }

  const gitDir = path.join(absolutePath, '.git');
  if (!fs.existsSync(gitDir)) {
    throw new Error(`Not a git repository (no .git directory): ${absolutePath}`);
  }

  const name = path.basename(absolutePath);
  const languages = detectLanguages(absolutePath);
  const branches = listBranches(absolutePath);
  const currentBranch = getCurrentBranch(absolutePath);
  const existingFiles = checkExistingFiles(absolutePath);

  return { path: absolutePath, name, languages, branches, currentBranch, existingFiles };
}

function detectLanguages(repoPath: string): string[] {
  const languageSet = new Set<string>();
  let fileCount = 0;
  const MAX_FILES = 2000;

  function walk(dir: string): void {
    if (fileCount >= MAX_FILES) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (fileCount >= MAX_FILES) return;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          walk(path.join(dir, entry.name));
        }
      } else if (entry.isFile()) {
        fileCount++;
        const ext = path.extname(entry.name).toLowerCase();
        const lang = EXTENSION_MAP[ext];
        if (lang) languageSet.add(lang);
      }
    }
  }

  walk(repoPath);

  const dataLangs = new Set(['Markdown', 'JSON', 'YAML', 'TOML']);
  const primary = [...languageSet].filter((l) => !dataLangs.has(l)).sort();
  const secondary = [...languageSet].filter((l) => dataLangs.has(l)).sort();
  return [...primary, ...secondary];
}

function listBranches(repoPath: string): string[] {
  const result = exec('git', ['branch', '-a', '--no-color'], repoPath);
  if (!result.success) return [];
  return result.stdout
    .split('\n')
    .map((b) => b.replace(/^\*?\s+/, '').trim())
    .filter((b) => b && !b.includes('->'));
}

function getCurrentBranch(repoPath: string): string {
  const result = exec('git', ['rev-parse', '--abbrev-ref', 'HEAD'], repoPath);
  return result.success ? result.stdout : 'unknown';
}

function checkExistingFiles(repoPath: string): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const file of CONTEXT_FILES) {
    result[file] = fs.existsSync(path.join(repoPath, file));
  }
  return result;
}
