import path from 'node:path';
import type { PlatformInjector, FileEntry, InjectorContext } from '../index.js';

/**
 * Generic platform injector (Gemini CLI, Antigravity, etc.).
 *
 * Writes:
 *   AGENTS.md             — generic agent rules (repo root)
 *   LESSONS.md            — lessons learned (repo root)
 *   .vibelint/skills/     — skill files
 *   .vibelint/config.yml  — analysis config
 *   .vibelint/prompts/    — prompt templates for manual use
 *   .vibelint/reports/    — empty dir placeholder
 */
export const genericInjector: PlatformInjector = {
  platform: 'generic',

  buildFileList(ctx: InjectorContext): FileEntry[] {
    const files: FileEntry[] = [];

    // Platform rule → AGENTS.md at repo root
    const platformRule = ctx.rules.find((r) => r.type === 'agents-md');
    if (platformRule) {
      files.push({
        relativePath: 'AGENTS.md',
        content: platformRule.content,
        category: 'rules',
      });
    }

    // LESSONS.md at repo root
    const lessonsRule = ctx.rules.find((r) => r.type === 'lessons-md');
    if (lessonsRule) {
      files.push({
        relativePath: 'LESSONS.md',
        content: lessonsRule.content,
        category: 'rules',
      });
    }

    // Skills → .vibelint/skills/<name>.md
    for (const skill of ctx.skills) {
      files.push({
        relativePath: path.join('.vibelint', 'skills', `${skill.name}.md`),
        content: skill.content,
        category: 'skills',
      });
    }

    // Config → .vibelint/config.yml
    if (ctx.configYml) {
      files.push({
        relativePath: path.join('.vibelint', 'config.yml'),
        content: ctx.configYml,
        category: 'config',
      });
    }

    return files;
  },

  getDirectories(): string[] {
    return [
      '.vibelint/skills',
      '.vibelint/reports',
      '.vibelint/prompts',
    ];
  },
};
