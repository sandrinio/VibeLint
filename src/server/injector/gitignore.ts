import fs from 'node:fs';
import path from 'node:path';

/**
 * Entries that VibeLint adds to `.gitignore`.
 * Platform-specific entries are appended based on the repo's platform.
 */
const COMMON_ENTRIES = ['.vibelint/'];

const PLATFORM_ENTRIES: Record<string, string[]> = {
  'claude-code': ['.claude/'],
  cursor: ['.cursor/'],
  windsurf: ['.windsurf/'],
};

/**
 * Update (or create) the `.gitignore` in the given repo directory.
 * Only appends entries that are not already present. Avoids duplicates.
 *
 * @returns The list of entries that were added (empty if all already present).
 */
export function updateGitignore(repoPath: string, platform: string | null): string[] {
  const gitignorePath = path.join(repoPath, '.gitignore');

  let existing = '';
  if (fs.existsSync(gitignorePath)) {
    existing = fs.readFileSync(gitignorePath, 'utf-8');
  }

  // Parse existing lines into a set (trimmed, no empty, no comments)
  const existingLines = new Set(
    existing
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  );

  const needed = [...COMMON_ENTRIES];
  if (platform && PLATFORM_ENTRIES[platform]) {
    needed.push(...PLATFORM_ENTRIES[platform]);
  }

  const toAdd = needed.filter((entry) => !existingLines.has(entry));

  if (toAdd.length === 0) {
    return [];
  }

  // Build the block to append
  const block = [
    '',
    '# VibeLint (auto-generated)',
    ...toAdd,
  ].join('\n');

  // Ensure existing content ends with a newline before appending
  const separator = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';

  fs.writeFileSync(gitignorePath, existing + separator + block + '\n', 'utf-8');

  return toAdd;
}
