import { getDb } from "../db.js";

export interface AgentRun {
  id: number;
  project_id: number;
  worktree_id: number | null;
  tool: string;
  started_at: number;
  ended_at: number | null;
  prompt: string | null;
  notes: string | null;
}

export interface StartAgentRunInput {
  projectId: number;
  worktreeId?: number;
  tool: string;
  prompt?: string;
  notes?: string;
}

export function startAgentRun(input: StartAgentRunInput): AgentRun {
  const db = getDb();
  const now = Date.now();
  const result = db.run(
    "INSERT INTO agent_runs (project_id, worktree_id, tool, started_at, prompt, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [input.projectId, input.worktreeId ?? null, input.tool, now, input.prompt ?? null, input.notes ?? null]
  );

  const runId = result.lastInsertRowid as number;

  db.run(
    "INSERT INTO activity_log (type, project_id, worktree_id, payload, created_at) VALUES (?, ?, ?, ?, ?)",
    [
      "agent_run_started",
      input.projectId,
      input.worktreeId ?? null,
      JSON.stringify({ run_id: runId, tool: input.tool }),
      now,
    ]
  );

  return {
    id: runId,
    project_id: input.projectId,
    worktree_id: input.worktreeId ?? null,
    tool: input.tool,
    started_at: now,
    ended_at: null,
    prompt: input.prompt ?? null,
    notes: input.notes ?? null,
  };
}

export function stopAgentRun(runId: number): boolean {
  const db = getDb();
  const run = db.query("SELECT * FROM agent_runs WHERE id = ?").get(runId) as AgentRun | null;
  if (!run || run.ended_at) return false;

  const now = Date.now();
  db.run("UPDATE agent_runs SET ended_at = ? WHERE id = ?", [now, runId]);

  db.run(
    "INSERT INTO activity_log (type, project_id, worktree_id, payload, created_at) VALUES (?, ?, ?, ?, ?)",
    [
      "agent_run_stopped",
      run.project_id,
      run.worktree_id,
      JSON.stringify({ run_id: runId, tool: run.tool }),
      now,
    ]
  );

  return true;
}

export function getAgentRunById(runId: number): AgentRun | null {
  const db = getDb();
  const row = db.query("SELECT * FROM agent_runs WHERE id = ?").get(runId) as AgentRun | null;
  return row ?? null;
}

export function listActiveAgentRuns(): AgentRun[] {
  const db = getDb();
  return db.query("SELECT * FROM agent_runs WHERE ended_at IS NULL ORDER BY started_at DESC").all() as AgentRun[];
}

export function listAgentRunsForProject(projectId: number): AgentRun[] {
  const db = getDb();
  return db.query("SELECT * FROM agent_runs WHERE project_id = ? ORDER BY started_at DESC").all(projectId) as AgentRun[];
}
