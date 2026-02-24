import path from 'node:path';
import type { PlatformInjector, FileEntry, InjectorContext } from '../index.js';

/**
 * Claude Code platform injector.
 *
 * Writes:
 *   CLAUDE.md            — platform rules (repo root)
 *   LESSONS.md           — lessons learned (repo root)
 *   .claude/commands/    — slash command files
 *   .vibelint/skills/    — skill files
 *   .vibelint/config.yml — analysis config
 *   .vibelint/reports/   — empty dir placeholder for analyzer
 */
export const claudeCodeInjector: PlatformInjector = {
  platform: 'claude-code',

  buildFileList(ctx: InjectorContext): FileEntry[] {
    const files: FileEntry[] = [];

    // Platform rule → CLAUDE.md at repo root
    const platformRule = ctx.rules.find((r) => r.type === 'claude-md');
    if (platformRule) {
      files.push({
        relativePath: 'CLAUDE.md',
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

    // Slash commands → .claude/commands/<name>.md
    for (const cmd of ctx.commands) {
      files.push({
        relativePath: path.join('.claude', 'commands', `${cmd.name}.md`),
        content: cmd.content,
        category: 'commands',
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
      '.claude/commands',
      '.vibelint/skills',
      '.vibelint/reports',
    ];
  },
};
