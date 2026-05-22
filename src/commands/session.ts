import { Command } from "commander";
import { getProjectByName } from "../models/project.js";
import { getWorktreeByName } from "../models/worktree.js";
import { startSession, stopSession, getActiveSessions, syncSessions, getSessionById } from "../models/session.js";
import { tmuxNewSession, tmuxKillSession, tmuxSessionExists } from "../lib/tmux.js";

export function setupSessionCommands(program: Command) {
  const session = program.command("session").description("Manage tmux sessions");

  session
    .command("start <project> [worktree]")
    .description("Start a tmux session (logs to DB)")
    .option("-c, --context <note>", "Optional context note")
    .action((projectName: string, worktreeName: string | undefined, options: { context?: string }) => {
      try {
        const project = getProjectByName(projectName);
        if (!project) {
          console.error(`Project "${projectName}" not found.`);
          process.exit(1);
        }
        if (!project.path) {
          console.error(`Project "${projectName}" has no path.`);
          process.exit(1);
        }

        let worktreeId: number | undefined;
        let cwd = project.path;

        if (worktreeName) {
          const worktree = getWorktreeByName(project.id, worktreeName);
          if (!worktree) {
            console.error(`Worktree "${worktreeName}" not found for project "${projectName}".`);
            process.exit(1);
          }
          worktreeId = worktree.id;
          cwd = worktree.path;
        }

        const dbSession = startSession(project.id, worktreeId, options.context);
        const tmuxName = `ctx-${dbSession.id}`;

        if (tmuxSessionExists(tmuxName)) {
          console.error(`Tmux session "${tmuxName}" already exists.`);
          process.exit(1);
        }

        tmuxNewSession(tmuxName, cwd);
        console.log(`Started session "${tmuxName}" for project "${projectName}"`);
        console.log(`Attach with: tmux attach -t ${tmuxName}`);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  session
    .command("stop [session-id]")
    .description("Mark a session as ended (defaults to active session)")
    .action((sessionIdStr?: string) => {
      try {
        let sessionId: number;

        if (sessionIdStr) {
          sessionId = parseInt(sessionIdStr, 10);
          if (isNaN(sessionId)) {
            console.error("Invalid session ID.");
            process.exit(1);
          }
        } else {
          const active = getActiveSessions();
          if (active.length === 0) {
            console.error("No active sessions found.");
            process.exit(1);
          }
          sessionId = active[0].id;
        }

        const session = getSessionById(sessionId);
        if (!session) {
          console.error(`Session ${sessionId} not found.`);
          process.exit(1);
        }

        const tmuxName = `ctx-${sessionId}`;
        if (tmuxSessionExists(tmuxName)) {
          tmuxKillSession(tmuxName);
        }

        const ok = stopSession(sessionId);
        if (!ok) {
          console.error(`Session ${sessionId} is not active.`);
          process.exit(1);
        }

        console.log(`Stopped session ${sessionId}`);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  session
    .command("sync")
    .description("Poll tmux and auto-close any missing sessions")
    .action(() => {
      try {
        const { closed } = syncSessions();
        if (closed.length === 0) {
          console.log("All active sessions are still running in tmux.");
        } else {
          console.log(`Closed ${closed.length} stale session(s): ${closed.join(", ")}`);
        }
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  session
    .command("list")
    .description("List active sessions")
    .action(() => {
      try {
        const active = getActiveSessions();
        if (active.length === 0) {
          console.log("No active sessions.");
          return;
        }
        for (const s of active) {
          const tmuxName = `ctx-${s.id}`;
          const running = tmuxSessionExists(tmuxName) ? "(running)" : "(orphaned)";
          const worktree = s.worktree_id ? ` worktree:${s.worktree_id}` : "";
          const context = s.context ? ` "${s.context}"` : "";
          console.log(`Session ${s.id} project:${s.project_id}${worktree} ${running}${context}`);
        }
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
