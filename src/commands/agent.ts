import { Command } from "commander";
import { getProjectByName } from "../models/project.js";
import { getWorktreeByName } from "../models/worktree.js";
import { startAgentRun, stopAgentRun, getAgentRunById, listActiveAgentRuns, listAgentRunsForProject } from "../models/agent.js";

export function setupAgentCommands(program: Command) {
  const agent = program.command("agent").description("Manage agent runs");

  agent
    .command("start <project>")
    .description("Log the start of an agent run")
    .requiredOption("-t, --tool <tool>", "Agent tool name (e.g., opencode, claude, codex)")
    .option("-w, --worktree <name>", "Worktree name")
    .option("-p, --prompt <text>", "What was asked")
    .option("-n, --notes <text>", "Additional notes")
    .action((projectName: string, options: { tool: string; worktree?: string; prompt?: string; notes?: string }) => {
      try {
        const project = getProjectByName(projectName);
        if (!project) {
          console.error(`Project "${projectName}" not found.`);
          process.exit(1);
        }

        let worktreeId: number | undefined;
        if (options.worktree) {
          const worktree = getWorktreeByName(project.id, options.worktree);
          if (!worktree) {
            console.error(`Worktree "${options.worktree}" not found for project "${projectName}".`);
            process.exit(1);
          }
          worktreeId = worktree.id;
        }

        const run = startAgentRun({
          projectId: project.id,
          worktreeId,
          tool: options.tool,
          prompt: options.prompt,
          notes: options.notes,
        });

        console.log(`Started agent run ${run.id} for "${projectName}" (${run.tool})`);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  agent
    .command("stop <run-id>")
    .description("Log the end of an agent run")
    .action((runIdStr: string) => {
      try {
        const runId = parseInt(runIdStr, 10);
        if (isNaN(runId)) {
          console.error("Invalid run ID.");
          process.exit(1);
        }

        const ok = stopAgentRun(runId);
        if (!ok) {
          console.error(`Agent run ${runId} not found or already stopped.`);
          process.exit(1);
        }

        console.log(`Stopped agent run ${runId}`);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  agent
    .command("list [project]")
    .description("List agent runs (all active, or for a specific project)")
    .action((projectName?: string) => {
      try {
        let runs;
        if (projectName) {
          const project = getProjectByName(projectName);
          if (!project) {
            console.error(`Project "${projectName}" not found.`);
            process.exit(1);
          }
          runs = listAgentRunsForProject(project.id);
        } else {
          runs = listActiveAgentRuns();
        }

        if (runs.length === 0) {
          console.log("No agent runs found.");
          return;
        }

        for (const run of runs) {
          const status = run.ended_at ? "stopped" : "active";
          const duration = run.ended_at ? ` (${Math.round((run.ended_at - run.started_at) / 1000)}s)` : "";
          const worktree = run.worktree_id ? ` worktree:${run.worktree_id}` : "";
          const prompt = run.prompt ? ` "${run.prompt.substring(0, 40)}${run.prompt.length > 40 ? "..." : ""}"` : "";
          console.log(`Run ${run.id} [${status}] project:${run.project_id}${worktree} ${run.tool}${duration}${prompt}`);
        }
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
