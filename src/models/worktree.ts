import { getDb } from "../db.js";

export interface Worktree {
  id: number;
  project_id: number;
  name: string;
  branch: string;
  path: string;
  created_at: number;
}

export function listWorktrees(projectId: number): Worktree[] {
  const db = getDb();
  return db.query("SELECT * FROM worktrees WHERE project_id = ? ORDER BY created_at DESC").all(projectId) as Worktree[];
}

export function getWorktreeByName(projectId: number, name: string): Worktree | null {
  const db = getDb();
  const row = db.query("SELECT * FROM worktrees WHERE project_id = ? AND name = ?").get(projectId, name) as Worktree | null;
  return row ?? null;
}

export function createWorktreeRecord(projectId: number, name: string, branch: string, path: string): Worktree {
  const db = getDb();
  const now = Date.now();
  const result = db.run(
    "INSERT INTO worktrees (project_id, name, branch, path, created_at) VALUES (?, ?, ?, ?, ?)",
    [projectId, name, branch, path, now]
  );
  return {
    id: result.lastInsertRowid as number,
    project_id: projectId,
    name,
    branch,
    path,
    created_at: now,
  };
}

export function deleteWorktreeRecord(id: number): void {
  const db = getDb();
  db.run("DELETE FROM worktrees WHERE id = ?", [id]);
}
