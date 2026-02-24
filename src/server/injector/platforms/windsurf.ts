import path from 'node:path';
import type { PlatformInjector, FileEntry, InjectorContext } from '../index.js';

/**
 * Windsurf platform injector.
 *
 * Writes:
 *   .windsurfrules               — platform rules (repo root)
 *   LESSONS.md                   — lessons learned (repo root)
 *   .windsurf/rules/vibelint.md  — detailed rules
 *   .vibelint/skills/            — skill files
 *   .vibelint/config.yml         — analysis config
 *   .vibelint/reports/           — empty dir placeholder
 */
export const windsurfInjector: PlatformInjector = {
  platform: 'windsurf',

  buildFileList(ctx: InjectorContext): FileEntry[] {
    const files: FileEntry[] = [];

    // Platform rule → .windsurfrules at repo root
    const platformRule = ctx.rules.find((r) => r.type === 'windsurfrules');
    if (platformRule) {
      files.push({
        relativePath: '.windsurfrules',
        content: platformRule.content,
        category: 'rules',
      });
    }

    // Detailed rules inside .windsurf/rules/
    if (ctx.skills.length > 0) {
      const combinedSkills = ctx.skills
        .map((s) => `## ${s.name}\n\n${s.content}`)
        .join('\n\n---\n\n');

      files.push({
        relativePath: path.join('.windsurf', 'rules', 'vibelint.md'),
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
      '.windsurf/rules',
      '.vibelint/skills',
      '.vibelint/reports',
    ];
  },
};
