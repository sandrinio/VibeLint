import fs from 'node:fs';
import path from 'node:path';
import { getRepo, getConfig, getDb, updateRepo } from '../db/queries.js';
import { loadTemplate, listTemplates, stripExtension, TemplateNotFoundError } from '../templates/loader.js';
import { updateGitignore } from './gitignore.js';
import { claudeCodeInjector } from './platforms/claude-code.js';
import { cursorInjector } from './platforms/cursor.js';
import { windsurfInjector } from './platforms/windsurf.js';
import { genericInjector } from './platforms/generic.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single file to be written during injection. */
export interface FileEntry {
  relativePath: string;
  content: string;
  category: 'rules' | 'commands' | 'skills' | 'config';
}

/** Context data gathered for a platform injector to consume. */
export interface InjectorContext {
  repoPath: string;
  platform: string;
  rules: Array<{ type: string; content: string }>;
  commands: Array<{ name: string; content: string }>;
  skills: Array<{ name: string; content: string }>;
  configYml: string | null;
}

/** A platform-specific injector that knows how to map context → files. */
export interface PlatformInjector {
  platform: string;
  /** Build the list of files this platform needs written. */
  buildFileList(ctx: InjectorContext): FileEntry[];
  /** Return directories that should be ensured to exist (even if empty). */
  getDirectories(): string[];
}

/** Result returned by preview and inject operations. */
export interface InjectionResult {
  files: Array<{
    relativePath: string;
    category: string;
    action: 'create' | 'update';
  }>;
  directories: string[];
  gitignoreEntries: string[];
}

// ---------------------------------------------------------------------------
// Platform registry
// ---------------------------------------------------------------------------

const INJECTORS: Record<string, PlatformInjector> = {
  'claude-code': claudeCodeInjector,
  cursor: cursorInjector,
  windsurf: windsurfInjector,
};

function getInjector(platform: string | null): PlatformInjector {
  if (platform && INJECTORS[platform]) {
    return INJECTORS[platform];
  }
  return genericInjector;
}

// ---------------------------------------------------------------------------
// Skill ↔ language mapping
// ---------------------------------------------------------------------------

/** Map skill template name → repo language strings that make it relevant. */
const SKILL_LANGUAGE_MAP: Record<string, string[]> = {
  typescript: ['TypeScript', 'JavaScript'],
  python:     ['Python'],
  go:         ['Go'],
  rust:       ['Rust'],
  java:       ['Java', 'Kotlin'],
  csharp:     ['C#', 'CSharp'],
  ruby:       ['Ruby'],
};

/** Skills that are always injected regardless of repo languages. */
const UNIVERSAL_SKILLS = new Set(['general', 'error-handling', 'testing']);

// ---------------------------------------------------------------------------
// Context builder — gathers skills, rules, commands from the DB/templates
// ---------------------------------------------------------------------------

function buildContext(repoId: string, repoPath: string, platform: string): InjectorContext {
  const db = getDb();

  // Read repo languages for skill filtering
  const repo = getRepo(repoId);
  const repoLanguages: Set<string> = new Set(
    repo ? (JSON.parse(repo.languages) as string[]) : [],
  );

  // -- Rules --
  const RULE_TYPES = ['claude-md', 'cursorrules', 'windsurfrules', 'agents-md', 'lessons-md'] as const;
  const RULE_TEMPLATE_MAP: Record<string, { category: string; file: string }> = {
    'claude-md':     { category: 'rules/claude-code', file: 'CLAUDE.md.template' },
    'cursorrules':   { category: 'rules/cursor',      file: 'cursorrules.template' },
    'windsurfrules': { category: 'rules/windsurf',    file: 'windsurfrules.template' },
    'agents-md':     { category: 'rules/generic',     file: 'AGENTS.md.template' },
    'lessons-md':    { category: 'config',            file: 'LESSONS.md.template' },
  };

  const rules: InjectorContext['rules'] = [];
  for (const type of RULE_TYPES) {
    const custom = getConfig(`rules:${repoId}:${type}`);
    if (custom !== undefined) {
      rules.push({ type, content: custom });
    } else {
      const mapping = RULE_TEMPLATE_MAP[type];
      try {
        const tmpl = loadTemplate(mapping.category, mapping.file);
        rules.push({ type, content: tmpl.content });
      } catch (err) {
        if (!(err instanceof TemplateNotFoundError)) throw err;
      }
    }
  }

  // -- Skills --
  const defaults = listTemplates('skills');
  const defaultNames = new Set(defaults.map((t) => stripExtension(t.name)));

  const escapedRepoId = repoId.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const skillRows = db
    .prepare("SELECT key, value FROM config WHERE key LIKE ? ESCAPE '\\'")
    .all(`skills:${escapedRepoId}:%`) as Array<{ key: string; value: string }>;

  const customSkills = new Map<string, string>();
  const prefix = `skills:${repoId}:`;
  for (const row of skillRows) {
    customSkills.set(row.key.slice(prefix.length), row.value);
  }

  const skills: InjectorContext['skills'] = [];
  for (const tmpl of defaults) {
    const name = stripExtension(tmpl.name);
    // Filter language-specific skills to only those matching repo languages
    if (!UNIVERSAL_SKILLS.has(name)) {
      const langs = SKILL_LANGUAGE_MAP[name];
      if (langs && !langs.some((l) => repoLanguages.has(l))) {
        // Skip — not relevant to this repo (unless user has a custom override)
        if (!customSkills.has(name)) continue;
      }
    }
    const content = customSkills.get(name) ?? tmpl.content;
    skills.push({ name, content });
  }
  for (const [name, content] of customSkills) {
    if (!defaultNames.has(name)) {
      skills.push({ name, content });
    }
  }

  // -- Commands --
  const cmdCategory = platform === 'claude-code' ? 'commands/claude-code' : 'commands/generic';
  const cmdDefaults = listTemplates(cmdCategory);
  const cmdDefaultNames = new Set(cmdDefaults.map((t) => stripExtension(t.name)));

  const cmdRows = db
    .prepare("SELECT key, value FROM config WHERE key LIKE ? ESCAPE '\\'")
    .all(`commands:${escapedRepoId}:%`) as Array<{ key: string; value: string }>;

  const customCmds = new Map<string, string>();
  const cmdPrefix = `commands:${repoId}:`;
  for (const row of cmdRows) {
    customCmds.set(row.key.slice(cmdPrefix.length), row.value);
  }

  const commands: InjectorContext['commands'] = [];
  for (const tmpl of cmdDefaults) {
    const name = stripExtension(tmpl.name);
    const content = customCmds.get(name) ?? tmpl.content;
    commands.push({ name, content });
  }
  for (const [name, content] of customCmds) {
    if (!cmdDefaultNames.has(name)) {
      commands.push({ name, content });
    }
  }

  // -- Config YAML --
  let configYml: string | null = null;
  const customConfig = getConfig(`config:${repoId}:config-yml`);
  if (customConfig) {
    configYml = customConfig;
  } else {
    try {
      const tmpl = loadTemplate('config', 'config.yml.template');
      configYml = tmpl.content;
    } catch {
      // No config template — skip
    }
  }

  return { repoPath, platform, rules, commands, skills, configYml };
}

// ---------------------------------------------------------------------------
// Preview — returns what would be written without touching disk
// ---------------------------------------------------------------------------

export function previewInjection(repoId: string): InjectionResult {
  const repo = getRepo(repoId);
  if (!repo) {
    throw new Error(`Repo not found: ${repoId}`);
  }

  // Validate repo path exists
  if (!fs.existsSync(repo.path)) {
    throw new Error(`Repo directory does not exist: ${repo.path}`);
  }

  const platform = repo.platform ?? 'generic';
  const injector = getInjector(platform);
  const ctx = buildContext(repoId, repo.path, platform);
  const fileEntries = injector.buildFileList(ctx);
  const directories = injector.getDirectories();

  const files = fileEntries.map((f) => {
    const fullPath = path.join(repo.path, f.relativePath);
    const exists = fs.existsSync(fullPath);
    return {
      relativePath: f.relativePath,
      category: f.category,
      action: (exists ? 'update' : 'create') as 'create' | 'update',
    };
  });

  // Determine which gitignore entries would be added
  const gitignorePath = path.join(repo.path, '.gitignore');
  const existingGitignore = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf-8')
    : '';
  const existingLines = new Set(
    existingGitignore.split('\n').map((l) => l.trim()).filter(Boolean),
  );

  const COMMON = ['.vibelint/'];
  const PLATFORM_MAP: Record<string, string[]> = {
    'claude-code': ['.claude/'],
    cursor: ['.cursor/'],
    windsurf: ['.windsurf/'],
  };
  const needed = [...COMMON, ...(PLATFORM_MAP[platform] ?? [])];
  const gitignoreEntries = needed.filter((e) => !existingLines.has(e));

  return { files, directories, gitignoreEntries };
}

// ---------------------------------------------------------------------------
// Execute — actually writes files to disk
// ---------------------------------------------------------------------------

export function executeInjection(repoId: string): InjectionResult {
  const repo = getRepo(repoId);
  if (!repo) {
    throw new Error(`Repo not found: ${repoId}`);
  }

  if (!fs.existsSync(repo.path)) {
    throw new Error(`Repo directory does not exist: ${repo.path}`);
  }

  // Check write permission
  try {
    fs.accessSync(repo.path, fs.constants.W_OK);
  } catch {
    throw new Error(`No write permission to repo directory: ${repo.path}`);
  }

  const platform = repo.platform ?? 'generic';
  const injector = getInjector(platform);
  const ctx = buildContext(repoId, repo.path, platform);
  const fileEntries = injector.buildFileList(ctx);
  const directories = injector.getDirectories();

  // 1. Create directories
  for (const dir of directories) {
    const fullDir = path.join(repo.path, dir);
    fs.mkdirSync(fullDir, { recursive: true });
  }

  // 2. Write files
  const files: InjectionResult['files'] = [];
  for (const entry of fileEntries) {
    const fullPath = path.join(repo.path, entry.relativePath);
    const exists = fs.existsSync(fullPath);

    // Ensure parent directory exists
    const parentDir = path.dirname(fullPath);
    fs.mkdirSync(parentDir, { recursive: true });

    fs.writeFileSync(fullPath, entry.content, 'utf-8');

    files.push({
      relativePath: entry.relativePath,
      category: entry.category,
      action: exists ? 'update' : 'create',
    });
  }

  // 3. Update .gitignore
  const gitignoreEntries = updateGitignore(repo.path, platform);

  // 4. Update injected_at timestamp
  updateRepo(repoId, { injected_at: new Date().toISOString() });

  return { files, directories, gitignoreEntries };
}
