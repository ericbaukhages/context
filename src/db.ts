import { Database } from "bun:sqlite";
import { resolveDatabasePath, loadConfig } from "./config.js";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const MIGRATIONS = [
  `
  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    path        TEXT,
    status      TEXT NOT NULL DEFAULT 'IDEA',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS worktrees (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    branch      TEXT NOT NULL,
    path        TEXT NOT NULL,
    created_at  INTEGER NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    worktree_id INTEGER REFERENCES worktrees(id) ON DELETE SET NULL,
    started_at  INTEGER NOT NULL,
    ended_at    INTEGER,
    context     TEXT
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS agent_runs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    worktree_id INTEGER REFERENCES worktrees(id) ON DELETE SET NULL,
    tool        TEXT NOT NULL,
    started_at  INTEGER NOT NULL,
    ended_at    INTEGER,
    prompt      TEXT,
    notes       TEXT
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,
    project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    worktree_id INTEGER REFERENCES worktrees(id) ON DELETE SET NULL,
    payload     TEXT,
    created_at  INTEGER NOT NULL
  );
  `,
];

let db: Database | null = null;

export function getDb(): Database {
  if (db) return db;

  const config = loadConfig();
  const dbPath = resolveDatabasePath(config);
  const dbDir = dirname(dbPath);

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.run("PRAGMA foreign_keys = ON");

  for (const migration of MIGRATIONS) {
    db.run(migration);
  }

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
