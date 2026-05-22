import { getDb } from "../db.js";

export type ProjectStatus = "IDEA" | "SPEC" | "REPO" | "ACTIVE" | "ARCHIVED";

export interface Project {
  id: number;
  name: string;
  path: string | null;
  status: ProjectStatus;
  created_at: number;
  updated_at: number;
}

export interface CreateProjectInput {
  name: string;
  path?: string;
  status?: ProjectStatus;
}

const VALID_STATUSES: ProjectStatus[] = ["IDEA", "SPEC", "REPO", "ACTIVE", "ARCHIVED"];

export function createProject(input: CreateProjectInput): Project {
  const db = getDb();
  const now = Date.now();
  const status = input.status ?? "IDEA";

  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const result = db.run(
    `INSERT INTO projects (name, path, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [input.name, input.path ?? null, status, now, now]
  );

  const projectId = result.lastInsertRowid as number;

  db.run(
    `INSERT INTO activity_log (type, project_id, payload, created_at) VALUES (?, ?, ?, ?)`,
    ["project_created", projectId, JSON.stringify({ name: input.name, status }), now]
  );

  return {
    id: projectId,
    name: input.name,
    path: input.path ?? null,
    status,
    created_at: now,
    updated_at: now,
  };
}

export function getProjectByName(name: string): Project | null {
  const db = getDb();
  const row = db.query("SELECT * FROM projects WHERE name = ?").get(name) as
    | (Omit<Project, "path"> & { path: string | null })
    | null;
  return row ?? null;
}

export function listProjects(statusFilter?: ProjectStatus): Project[] {
  const db = getDb();
  if (statusFilter) {
    return db.query("SELECT * FROM projects WHERE status = ? ORDER BY updated_at DESC").all(statusFilter) as Project[];
  }
  return db.query("SELECT * FROM projects ORDER BY updated_at DESC").all() as Project[];
}

export function updateProjectStatus(name: string, status: ProjectStatus): boolean {
  const db = getDb();
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const project = getProjectByName(name);
  if (!project) return false;

  const now = Date.now();
  db.run("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?", [status, now, project.id]);

  db.run(
    `INSERT INTO activity_log (type, project_id, payload, created_at) VALUES (?, ?, ?, ?)`,
    ["project_status_changed", project.id, JSON.stringify({ from: project.status, to: status }), now]
  );

  return true;
}

export function archiveProject(name: string): boolean {
  return updateProjectStatus(name, "ARCHIVED");
}

export function deleteProject(name: string): boolean {
  const db = getDb();
  const project = getProjectByName(name);
  if (!project) return false;

  db.run("DELETE FROM projects WHERE id = ?", [project.id]);
  return true;
}
