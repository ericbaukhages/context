import { getDb } from "../db.js";

export interface Session {
  id: number;
  project_id: number;
  worktree_id: number | null;
  started_at: number;
  ended_at: number | null;
  context: string | null;
}

export function startSession(projectId: number, worktreeId?: number, context?: string): Session {
  const db = getDb();
  const now = Date.now();
  const result = db.run(
    "INSERT INTO sessions (project_id, worktree_id, started_at, context) VALUES (?, ?, ?, ?)",
    [projectId, worktreeId ?? null, now, context ?? null]
  );

  const sessionId = result.lastInsertRowid as number;

  db.run(
    "INSERT INTO activity_log (type, project_id, worktree_id, payload, created_at) VALUES (?, ?, ?, ?, ?)",
    ["session_started", projectId, worktreeId ?? null, JSON.stringify({ session_id: sessionId }), now]
  );

  return {
    id: sessionId,
    project_id: projectId,
    worktree_id: worktreeId ?? null,
    started_at: now,
    ended_at: null,
    context: context ?? null,
  };
}

export function stopSession(sessionId: number): boolean {
  const db = getDb();
  const session = db.query("SELECT * FROM sessions WHERE id = ?").get(sessionId) as Session | null;
  if (!session || session.ended_at) return false;

  const now = Date.now();
  db.run("UPDATE sessions SET ended_at = ? WHERE id = ?", [now, sessionId]);

  db.run(
    "INSERT INTO activity_log (type, project_id, worktree_id, payload, created_at) VALUES (?, ?, ?, ?, ?)",
    ["session_stopped", session.project_id, session.worktree_id, JSON.stringify({ session_id: sessionId }), now]
  );

  return true;
}

export function getActiveSessions(): Session[] {
  const db = getDb();
  return db.query("SELECT * FROM sessions WHERE ended_at IS NULL ORDER BY started_at DESC").all() as Session[];
}

export function getSessionById(sessionId: number): Session | null {
  const db = getDb();
  const row = db.query("SELECT * FROM sessions WHERE id = ?").get(sessionId) as Session | null;
  return row ?? null;
}

export function syncSessions(): { closed: number[] } {
  const { tmuxListSessions } = require("../lib/tmux.js") as typeof import("../lib/tmux.js");
  const activeTmuxSessions = new Set(tmuxListSessions());
  const activeDbSessions = getActiveSessions();

  const closed: number[] = [];
  for (const session of activeDbSessions) {
    const sessionName = `ctx-${session.id}`;
    if (!activeTmuxSessions.has(sessionName)) {
      stopSession(session.id);
      closed.push(session.id);
    }
  }

  return { closed };
}
