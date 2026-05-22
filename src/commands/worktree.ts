import { Command } from "commander";
import { getProjectByName } from "../models/project.js";
import { createWorktreeRecord, listWorktrees, getWorktreeByName, deleteWorktreeRecord } from "../models/worktree.js";
import { isGitRepo, gitWorktreeAdd, gitWorktreeRemove } from "../lib/git.js";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { getDb } from "../db.js";

function generateWorktreeName(projectName: string, existingNames: string[]): string {
  const date = new Date().toISOString().split("T")[0];
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  let name = `explore/${date}-${slug}`;
  let counter = 1;
  while (existingNames.includes(name)) {
    name = `explore/${date}-${slug}-${counter}`;
    counter++;
  }
  return name;
}

export function setupWorktreeCommands(program: Command) {
  const worktree = program.command("worktree").description("Manage git worktrees");

  worktree
    .command("add <project> [name]")
    .description("Create a new worktree + branch (auto-named if omitted)")
    .action((projectName: string, name: string | undefined) => {
      try {
        const project = getProjectByName(projectName);
        if (!project) {
          console.error(`Project "${projectName}" not found.`);
          process.exit(1);
        }
        if (!project.path) {
          console.error(`Project "${projectName}" has no path. Add a path first.`);
          process.exit(1);
        }
        if (!isGitRepo(project.path)) {
          console.error(`Project path "${project.path}" is not a git repository.`);
          process.exit(1);
        }

        const existing = listWorktrees(project.id);
        const existingNames = existing.map((w) => w.name);
        const worktreeName = name || generateWorktreeName(projectName, existingNames);
        const branch = worktreeName;
        const worktreePath = `${project.path}/.worktrees/${worktreeName.replace(/\//g, "-")}`;

        mkdirSync(dirname(worktreePath), { recursive: true });
        gitWorktreeAdd(project.path, worktreePath, branch);

        const record = createWorktreeRecord(project.id, worktreeName, branch, worktreePath);

        const db = getDb();
        db.run(
          `INSERT INTO activity_log (type, project_id, worktree_id, payload, created_at) VALUES (?, ?, ?, ?, ?)`,
          ["worktree_created", project.id, record.id, JSON.stringify({ name: worktreeName, branch, path: worktreePath }), Date.now()]
        );

        console.log(`Created worktree "${record.name}" at ${record.path}`);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  worktree
    .command("list <project>")
    .description("List worktrees for a project")
    .action((projectName: string) => {
      try {
        const project = getProjectByName(projectName);
        if (!project) {
          console.error(`Project "${projectName}" not found.`);
          process.exit(1);
        }
        const worktrees = listWorktrees(project.id);
        if (worktrees.length === 0) {
          console.log(`No worktrees for project "${projectName}".`);
          return;
        }
        for (const w of worktrees) {
          console.log(`${w.name} (${w.branch}) → ${w.path}`);
        }
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  worktree
    .command("remove <project> <name>")
    .description("Remove a worktree")
    .action((projectName: string, name: string) => {
      try {
        const project = getProjectByName(projectName);
        if (!project) {
          console.error(`Project "${projectName}" not found.`);
          process.exit(1);
        }
        const worktree = getWorktreeByName(project.id, name);
        if (!worktree) {
          console.error(`Worktree "${name}" not found for project "${projectName}".`);
          process.exit(1);
        }
        if (project.path && isGitRepo(project.path)) {
          gitWorktreeRemove(project.path, worktree.path);
        }
        deleteWorktreeRecord(worktree.id);
        console.log(`Removed worktree "${name}"`);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
