import Database from 'better-sqlite3';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

// --- Types ---

export interface RepoRow {
  id: string;
  path: string;
  name: string;
  languages: string; // JSON stringified string[]
  platform: string | null;
  injected_at: string | null;
  created_at: string;
  last_scan_at: string | null;
}

export interface MetricsHistoryRow {
  id: number;
  repo_id: string;
  timestamp: string;
  metrics: string; // JSON blob
}

export interface AnalysisRow {
  id: number;
  repo_id: string;
  branch: string | null;
  base_branch: string | null;
  diff_stats: string | null; // JSON blob
  analysis_data: string | null; // JSON blob
  created_at: string;
}

export interface ConfigRow {
  key: string;
  value: string;
}

// --- Paths ---

const DB_DIR = path.join(os.homedir(), '.vibelint');
const DB_PATH = path.join(DB_DIR, 'vibelint.db');

export function getDbPath(): string {
  return DB_PATH;
}

// --- Backup ---

function backupDatabase(): void {
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, `${DB_PATH}.bak`);
  }
}

// --- Integrity Check ---

function checkIntegrity(db: Database.Database): void {
  const result = db.pragma('integrity_check') as { integrity_check: string }[];
  const status = result[0]?.integrity_check;
  if (status !== 'ok') {
    console.error(`Database integrity check failed: ${status}`);
    console.error('Renaming corrupted database and creating a fresh one.');
    db.close();
    const corruptPath = `${DB_PATH}.corrupt.${Date.now()}`;
    fs.renameSync(DB_PATH, corruptPath);
    console.error(`Corrupted database saved as: ${corruptPath}`);
    throw new Error('DATABASE_CORRUPTED');
  }
}

// --- Migration System ---

interface Migration {
  version: number;
  description: string;
  up: (db: Database.Database) => void;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial schema',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS repos (
          id TEXT PRIMARY KEY,
          path TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          languages TEXT DEFAULT '[]',
          platform TEXT,
          injected_at TEXT,
          created_at TEXT NOT NULL,
          last_scan_at TEXT
        );

        CREATE TABLE IF NOT EXISTS metrics_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          repo_id TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          metrics TEXT,
          FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS analyses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          repo_id TEXT NOT NULL,
          branch TEXT,
          base_branch TEXT,
          diff_stats TEXT,
          analysis_data TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    },
  },
];

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL,
      description TEXT
    );
  `);

  const currentVersion = (
    db.prepare('SELECT MAX(version) as v FROM schema_version').get() as { v: number | null }
  ).v ?? 0;

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion);

  for (const migration of pending) {
    migration.up(db);
    db.prepare(
      'INSERT INTO schema_version (version, applied_at, description) VALUES (?, ?, ?)'
    ).run(migration.version, new Date().toISOString(), migration.description);
  }
}

// --- Public API ---

export function createDatabase(): Database.Database {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  backupDatabase();

  const db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  try {
    checkIntegrity(db);
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_CORRUPTED') {
      const freshDb = new Database(DB_PATH);
      freshDb.pragma('journal_mode = WAL');
      freshDb.pragma('foreign_keys = ON');
      runMigrations(freshDb);
      return freshDb;
    }
    throw err;
  }

  runMigrations(db);

  return db;
}
