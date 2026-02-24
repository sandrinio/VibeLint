import path from 'node:path';
import type { PlatformInjector, FileEntry, InjectorContext } from '../index.js';

/**
 * Cursor platform injector.
 *
 * Writes:
 *   .cursorrules               — platform rules (repo root)
 *   LESSONS.md                 — lessons learned (repo root)
 *   .cursor/rules/vibelint.mdc — detailed rules
 *   .vibelint/skills/          — skill files
 *   .vibelint/config.yml       — analysis config
 *   .vibelint/reports/         — empty dir placeholder
 */
export const cursorInjector: PlatformInjector = {
  platform: 'cursor',

  buildFileList(ctx: InjectorContext): FileEntry[] {
    const files: FileEntry[] = [];

    // Platform rule → .cursorrules at repo root
    const platformRule = ctx.rules.find((r) => r.type === 'cursorrules');
    if (platformRule) {
      files.push({
        relativePath: '.cursorrules',
        content: platformRule.content,
        category: 'rules',
      });
    }

    // Also write a detailed .mdc file inside .cursor/rules/
    // Combine all skills into a single .mdc for Cursor's rules system
    if (ctx.skills.length > 0) {
      const combinedSkills = ctx.skills
        .map((s) => `## ${s.name}\n\n${s.content}`)
        .join('\n\n---\n\n');

      files.push({
        relativePath: path.join('.cursor', 'rules', 'vibelint.mdc'),
        content: combinedSkills,
        category: 'skills',
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

    // Skills → .vibelint/skills/<name>.md (for VibeLint's own tracking)
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
      '.cursor/rules',
      '.vibelint/skills',
      '.vibelint/reports',
    ];
  },
};
