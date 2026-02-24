import fs from 'node:fs';
import path from 'node:path';
import { exec } from '../utils/exec.js';
import type { CheckStatus } from './file-size.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DependencyResult {
  status: CheckStatus;
  summary: string;
  newDeps: DependencyChange[];
  removedDeps: DependencyChange[];
}

export interface DependencyChange {
  name: string;
  version?: string;
  manifest: string;
}

// ---------------------------------------------------------------------------
// Manifest parsers
// ---------------------------------------------------------------------------

interface ManifestParser {
  file: string;
  parse: (content: string) => Map<string, string>;
}

const MANIFESTS: ManifestParser[] = [
  {
    file: 'package.json',
    parse(content: string): Map<string, string> {
      const deps = new Map<string, string>();
      try {
        const pkg = JSON.parse(content);
        for (const [name, ver] of Object.entries(pkg.dependencies ?? {})) {
          deps.set(name, String(ver));
        }
        for (const [name, ver] of Object.entries(pkg.devDependencies ?? {})) {
          deps.set(name, String(ver));
        }
      } catch {
        // Invalid JSON
      }
      return deps;
    },
  },
  {
    file: 'requirements.txt',
    parse(content: string): Map<string, string> {
      const deps = new Map<string, string>();
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([a-zA-Z0-9._-]+)(?:[=<>!~]+(.+))?/);
        if (match) {
          deps.set(match[1], match[2] ?? '*');
        }
      }
      return deps;
    },
  },
  {
    file: 'go.mod',
    parse(content: string): Map<string, string> {
      const deps = new Map<string, string>();
      const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
      if (requireBlock) {
        for (const line of requireBlock[1].split('\n')) {
          const match = line.trim().match(/^(\S+)\s+(\S+)/);
          if (match) deps.set(match[1], match[2]);
        }
      }
      return deps;
    },
  },
  {
    file: 'Cargo.toml',
    parse(content: string): Map<string, string> {
      const deps = new Map<string, string>();
      const section = content.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/);
      if (section) {
        for (const line of section[1].split('\n')) {
          const match = line.trim().match(/^(\w[\w-]*)\s*=\s*"([^"]+)"/);
          if (match) deps.set(match[1], match[2]);
        }
      }
      return deps;
    },
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect new or removed dependencies by comparing the current manifest
 * against the git HEAD~1 version (last commit).
 *
 * If the repo has no previous commit, reports all current deps as baseline.
 */
export function checkDependencies(repoPath: string): DependencyResult {
  const newDeps: DependencyChange[] = [];
  const removedDeps: DependencyChange[] = [];

  for (const manifest of MANIFESTS) {
    const filePath = path.join(repoPath, manifest.file);
    if (!fs.existsSync(filePath)) continue;

    // Current content
    const currentContent = fs.readFileSync(filePath, 'utf-8');
    const currentDeps = manifest.parse(currentContent);

    // Previous content (from last commit)
    const prevResult = exec('git', ['show', `HEAD~1:${manifest.file}`], repoPath);
    if (!prevResult.success) {
      // No previous version — this is the first commit or file is new
      continue;
    }

    const prevDeps = manifest.parse(prevResult.stdout);

    // Find new deps
    for (const [name, version] of currentDeps) {
      if (!prevDeps.has(name)) {
        newDeps.push({ name, version, manifest: manifest.file });
      }
    }

    // Find removed deps
    for (const [name, version] of prevDeps) {
      if (!currentDeps.has(name)) {
        removedDeps.push({ name, version, manifest: manifest.file });
      }
    }
  }

  const totalChanges = newDeps.length + removedDeps.length;

  let status: CheckStatus = 'pass';
  let summary = 'No dependency changes';
  if (totalChanges > 0) {
    const parts: string[] = [];
    if (newDeps.length > 0) parts.push(`+${newDeps.length} new`);
    if (removedDeps.length > 0) parts.push(`-${removedDeps.length} removed`);
    summary = parts.join(', ');
    status = newDeps.length > 3 ? 'warn' : 'pass';
  }

  return { status, summary, newDeps, removedDeps };
}
