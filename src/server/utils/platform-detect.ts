import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from './exec.js';

export interface PlatformDetection {
  name: string;
  id: string;
  detected: boolean;
  configFile: string;
  description: string;
}

interface PlatformDef {
  name: string;
  id: string;
  configFile: string;
  description: string;
  cliNames: string[];
  directoryPaths: string[];
}

const PLATFORMS: PlatformDef[] = [
  {
    name: 'Claude Code',
    id: 'claude-code',
    configFile: 'CLAUDE.md',
    description: 'Anthropic Claude Code CLI agent',
    cliNames: ['claude'],
    directoryPaths: [],
  },
  {
    name: 'Cursor',
    id: 'cursor',
    configFile: '.cursorrules',
    description: 'Cursor AI-powered code editor',
    cliNames: ['cursor'],
    directoryPaths: [path.join(os.homedir(), '.cursor')],
  },
  {
    name: 'Windsurf',
    id: 'windsurf',
    configFile: '.windsurfrules',
    description: 'Windsurf AI code editor',
    cliNames: ['windsurf'],
    directoryPaths: [],
  },
  {
    name: 'Gemini CLI',
    id: 'gemini-cli',
    configFile: 'GEMINI.md',
    description: 'Google Gemini CLI agent',
    cliNames: ['gemini'],
    directoryPaths: [],
  },
  {
    name: 'Antigravity',
    id: 'antigravity',
    configFile: 'AGENTS.md',
    description: 'Antigravity AI coding assistant',
    cliNames: ['antigravity', 'ag'],
    directoryPaths: [],
  },
];

function isCliAvailable(cliName: string): boolean {
  const command = process.platform === 'win32' ? 'where' : 'which';
  const result = exec(command, [cliName]);
  return result.success && result.stdout.length > 0;
}

function anyDirectoryExists(paths: string[]): boolean {
  return paths.some((p) => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  });
}

export function detectPlatforms(): PlatformDetection[] {
  return PLATFORMS.map((platform) => {
    const cliDetected = platform.cliNames.some(isCliAvailable);
    const dirDetected = anyDirectoryExists(platform.directoryPaths);
    return {
      name: platform.name,
      id: platform.id,
      detected: cliDetected || dirDetected,
      configFile: platform.configFile,
      description: platform.description,
    };
  });
}

export function getPlatformById(id: string): PlatformDef | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

export function getSupportedPlatformIds(): string[] {
  return PLATFORMS.map((p) => p.id);
}
