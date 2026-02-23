import type Database from 'better-sqlite3';
import { createDatabase, type RepoRow, type ConfigRow } from './schema.js';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = createDatabase();
  }
  return _db;
}

export function initDb(): Database.Database {
  return getDb();
}

// --- Config helpers ---

export function getConfig(key: string): string | undefined {
  const db = getDb();
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as ConfigRow | undefined;
  return row?.value;
}

export function setConfig(key: string, value: string): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
}

export function deleteConfig(key: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM config WHERE key = ?').run(key);
  return result.changes > 0;
}

export function getAllConfig(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM config').all() as ConfigRow[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// --- Repo helpers ---

export interface CreateRepoInput {
  id: string;
  path: string;
  name: string;
  languages: string[];
  platform?: string | null;
}

export function createRepo(input: CreateRepoInput): RepoRow {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO repos (id, path, name, languages, platform, created_at, last_scan_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.path,
    input.name,
    JSON.stringify(input.languages),
    input.platform ?? null,
    now,
    now,
  );
  return getRepo(input.id)!;
}

export function getRepo(id: string): RepoRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM repos WHERE id = ?').get(id) as RepoRow | undefined;
}

export function listRepos(): RepoRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM repos ORDER BY created_at DESC').all() as RepoRow[];
}

export function deleteRepo(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM repos WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateRepo(
  id: string,
  fields: Partial<Pick<RepoRow, 'languages' | 'platform' | 'last_scan_at' | 'injected_at'>>
): RepoRow | undefined {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (fields.languages !== undefined) {
    sets.push('languages = ?');
    values.push(fields.languages);
  }
  if (fields.platform !== undefined) {
    sets.push('platform = ?');
    values.push(fields.platform);
  }
  if (fields.last_scan_at !== undefined) {
    sets.push('last_scan_at = ?');
    values.push(fields.last_scan_at);
  }
  if (fields.injected_at !== undefined) {
    sets.push('injected_at = ?');
    values.push(fields.injected_at);
  }

  if (sets.length === 0) return getRepo(id);

  values.push(id);
  db.prepare(`UPDATE repos SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getRepo(id);
}
