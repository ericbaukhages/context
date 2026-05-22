#!/usr/bin/env bun
import { Command } from "commander";
import { createProject, listProjects, getProjectByName, updateProjectStatus, archiveProject, deleteProject } from "./models/project.js";
import { setupWorktreeCommands } from "./commands/worktree.js";
import { setupSessionCommands } from "./commands/session.js";
import { setupAgentCommands } from "./commands/agent.js";
import { setupLogCommands } from "./commands/log.js";

const program = new Command();

program.name("context").description("A project lifecycle and context manager").version("0.1.0");

// Project commands
const project = program.command("project").description("Manage projects");

project
  .command("add <name> [path]")
  .description("Add a new project")
  .option("-s, --status <status>", "Initial status (IDEA, SPEC, REPO, ACTIVE)", "IDEA")
  .action((name: string, path: string | undefined, options: { status: string }) => {
    try {
      const existing = getProjectByName(name);
      if (existing) {
        console.error(`Project "${name}" already exists.`);
        process.exit(1);
      }
      const project = createProject({ name, path, status: options.status as any });
      console.log(`Created project "${project.name}" (${project.status})`);
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

project
  .command("list [status]")
  .description("List projects")
  .action((status?: string) => {
    try {
      const projects = listProjects(status as any);
      if (projects.length === 0) {
        console.log("No projects found.");
        return;
      }
      for (const p of projects) {
        const path = p.path ? ` → ${p.path}` : "";
        console.log(`${p.name} [${p.status}]${path}`);
      }
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

project
  .command("status <name> <status>")
  .description("Update project status")
  .action((name: string, status: string) => {
    try {
      const ok = updateProjectStatus(name, status as any);
      if (!ok) {
        console.error(`Project "${name}" not found.`);
        process.exit(1);
      }
      console.log(`Updated "${name}" → ${status}`);
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

project
  .command("archive <name>")
  .description("Archive a project")
  .action((name: string) => {
    try {
      const ok = archiveProject(name);
      if (!ok) {
        console.error(`Project "${name}" not found.`);
        process.exit(1);
      }
      console.log(`Archived "${name}"`);
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

project
  .command("remove <name>")
  .description("Remove a project and all associated data")
  .action((name: string) => {
    try {
      const ok = deleteProject(name);
      if (!ok) {
        console.error(`Project "${name}" not found.`);
        process.exit(1);
      }
      console.log(`Removed "${name}"`);
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

setupWorktreeCommands(program);
setupSessionCommands(program);
setupAgentCommands(program);
setupLogCommands(program);

program.parse();
