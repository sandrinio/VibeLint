import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path to the `templates/` directory at the project root.
 *
 * Works identically whether the code is executed from source
 * (`src/server/templates/loader.ts` via tsx) or from the compiled output
 * (`dist/server/templates/loader.js`), because both are three directory
 * levels below the project root.
 */
const TEMPLATES_ROOT = path.resolve(__dirname, '../../../templates');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result object returned when a template is loaded or listed. */
export interface TemplateResult {
  name: string;
  category: string;
  content: string;
  isDefault: true;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Thrown when a requested template file cannot be found on disk. */
export class TemplateNotFoundError extends Error {
  constructor(category: string, name: string) {
    super(`Template not found: ${category}/${name}`);
    this.name = 'TemplateNotFoundError';
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * All recognized template category paths.  Each entry corresponds to a
 * sub-directory under `templates/` in the project root.
 */
export const TEMPLATE_CATEGORIES = [
  'skills',
  'rules/claude-code',
  'rules/cursor',
  'rules/windsurf',
  'rules/generic',
  'commands/claude-code',
  'commands/generic',
  'config',
] as const;

/** Set of file extensions considered valid template files. */
const TEMPLATE_EXTENSIONS = new Set(['.md', '.template']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `filename` has an extension that qualifies it as a
 * template file (`.md` or `.template`), excluding housekeeping files such
 * as `.gitkeep`.
 */
function isTemplateFile(filename: string): boolean {
  const ext = path.extname(filename);
  return TEMPLATE_EXTENSIONS.has(ext);
}

/** Verify the resolved path stays within TEMPLATES_ROOT to prevent path traversal. */
function assertSafePath(resolvedPath: string): void {
  const normalized = path.resolve(resolvedPath);
  if (!normalized.startsWith(TEMPLATES_ROOT)) {
    throw new TemplateNotFoundError('..', path.basename(resolvedPath));
  }
}

/** Strip common template extensions (.md, .template) from a filename. */
export function stripExtension(filename: string): string {
  return filename.replace(/\.(md|template)$/, '');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load a single template by category and file name.
 *
 * @param category - Template category path (e.g. `"skills"`, `"rules/claude-code"`).
 * @param name     - File name within the category directory (e.g. `"react.md"`).
 * @returns A {@link TemplateResult} containing the file content.
 * @throws {TemplateNotFoundError} If the resolved file does not exist.
 */
export function loadTemplate(category: string, name: string): TemplateResult {
  const filePath = path.join(TEMPLATES_ROOT, category, name);
  assertSafePath(filePath);

  if (!fs.existsSync(filePath)) {
    throw new TemplateNotFoundError(category, name);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  return {
    name,
    category,
    content,
    isDefault: true,
  };
}

/**
 * List every template file in a given category directory.
 *
 * Only files with `.md` or `.template` extensions are included; files such
 * as `.gitkeep` are silently filtered out.
 *
 * @param category - Template category path (e.g. `"skills"`, `"rules/cursor"`).
 * @returns An array of {@link TemplateResult} objects, or an empty array if
 *          the directory does not exist.
 */
export function listTemplates(category: string): TemplateResult[] {
  const dirPath = path.join(TEMPLATES_ROOT, category);
  assertSafePath(dirPath);

  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && isTemplateFile(entry.name))
    .map((entry) => {
      const content = fs.readFileSync(path.join(dirPath, entry.name), 'utf-8');
      return {
        name: entry.name,
        category,
        content,
        isDefault: true as const,
      };
    });
}

/**
 * List all templates across every known category, grouped by category name.
 *
 * @returns A record keyed by category path, where each value is the array of
 *          {@link TemplateResult} objects found in that category.
 */
export function listAllTemplates(): Record<string, TemplateResult[]> {
  const result: Record<string, TemplateResult[]> = {};

  for (const category of TEMPLATE_CATEGORIES) {
    result[category] = listTemplates(category);
  }

  return result;
}
