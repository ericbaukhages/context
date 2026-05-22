import { Command } from "commander";
import { getDb } from "../db.js";

interface LogEntry {
  type: string;
  project_name: string | null;
  worktree_name: string | null;
  payload: string | null;
  created_at: number;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().replace("T", " ").slice(0, 19);
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remaining}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}

export function setupLogCommands(program: Command) {
  program
    .command("log")
    .description("Show timeline of sessions and agent runs")
    .option("-n, --limit <count>", "Number of entries to show", "20")
    .option("-p, --project <name>", "Filter by project name")
    .action((options: { limit: string; project?: string }) => {
      try {
        const db = getDb();
        const limit = parseInt(options.limit, 10);

        let query: string;
        let params: (string | number)[];

        if (options.project) {
          query = `
            SELECT 
              al.type,
              p.name as project_name,
              w.name as worktree_name,
              al.payload,
              al.created_at
            FROM activity_log al
            LEFT JOIN projects p ON al.project_id = p.id
            LEFT JOIN worktrees w ON al.worktree_id = w.id
            WHERE p.name = ?
            ORDER BY al.created_at DESC
            LIMIT ?
          `;
          params = [options.project, limit];
        } else {
          query = `
            SELECT 
              al.type,
              p.name as project_name,
              w.name as worktree_name,
              al.payload,
              al.created_at
            FROM activity_log al
            LEFT JOIN projects p ON al.project_id = p.id
            LEFT JOIN worktrees w ON al.worktree_id = w.id
            ORDER BY al.created_at DESC
            LIMIT ?
          `;
          params = [limit];
        }

        const rows = db.query(query).all(...params) as LogEntry[];

        if (rows.length === 0) {
          console.log("No activity found.");
          return;
        }

        for (const row of rows) {
          const time = formatTimestamp(row.created_at);
          const project = row.project_name || "(unknown)";
          const worktree = row.worktree_name ? ` /${row.worktree_name}` : "";

          let detail = "";
          if (row.payload) {
            try {
              const payload = JSON.parse(row.payload);
              if (payload.session_id) {
                detail = ` session:${payload.session_id}`;
              }
              if (payload.run_id) {
                detail = ` run:${payload.run_id} tool:${payload.tool}`;
              }
              if (payload.from && payload.to) {
                detail = ` ${payload.from} → ${payload.to}`;
              }
              if (payload.name && !payload.session_id && !payload.run_id) {
                detail = ` "${payload.name}"`;
              }
            } catch {
              // ignore parse errors
            }
          }

          const typeLabel = row.type.replace(/_/g, " ");
          console.log(`${time}  [${typeLabel}]  ${project}${worktree}${detail}`);
        }
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
