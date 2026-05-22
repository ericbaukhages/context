import { Command } from "commander";
import { readFileSync, writeFileSync } from "node:fs";
import yaml from "js-yaml";
import { getDb } from "../db.js";

const TABLES = ["projects", "worktrees", "sessions", "agent_runs", "activity_log"];

interface ExportData {
  version: string;
  exported_at: number;
  projects: unknown[];
  worktrees: unknown[];
  sessions: unknown[];
  agent_runs: unknown[];
  activity_log: unknown[];
}

function exportData(): ExportData {
  const db = getDb();
  const data: ExportData = {
    version: "1",
    exported_at: Date.now(),
    projects: [],
    worktrees: [],
    sessions: [],
    agent_runs: [],
    activity_log: [],
  };

  for (const table of TABLES) {
    (data as Record<string, unknown[]>)[table] = db.query(`SELECT * FROM ${table}`).all();
  }

  return data;
}

function serialize(data: ExportData, format: string): string {
  if (format === "json") {
    return JSON.stringify(data, null, 2);
  }
  if (format === "yaml") {
    return yaml.dump(data);
  }
  throw new Error(`Unsupported format: ${format}. Use 'json' or 'yaml'.`);
}

function detectFormat(path: string): string {
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
  throw new Error("Cannot detect format from file extension. Use .json, .yaml, or .yml");
}

function parseContent(content: string, format: string): ExportData {
  if (format === "json") {
    return JSON.parse(content) as ExportData;
  }
  if (format === "yaml") {
    return yaml.load(content) as ExportData;
  }
  throw new Error(`Unsupported format: ${format}`);
}

function importData(data: ExportData): void {
  const db = getDb();

  db.run("PRAGMA foreign_keys = OFF");
  db.transaction(() => {
    for (const table of [...TABLES].reverse()) {
      db.run(`DELETE FROM ${table}`);
    }

    for (const table of TABLES) {
      const rows = (data as Record<string, unknown[]>)[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const columns = Object.keys(rows[0]).filter((c) => c !== "id");
      const placeholders = columns.map(() => "?").join(", ");
      const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`);

      for (const row of rows) {
        const values = columns.map((c) => (row as Record<string, unknown>)[c] ?? null);
        stmt.run(...values);
      }

      stmt.finalize();
    }
  })();
  db.run("PRAGMA foreign_keys = ON");
}

export function setupDataCommands(program: Command) {
  const data = program.command("data").description("Import and export data");

  data
    .command("export [format]")
    .description("Export DB to JSON or YAML (default: json)")
    .option("-o, --output <path>", "Output file path")
    .action((format: string = "json", options: { output?: string }) => {
      try {
        const data = exportData();
        const content = serialize(data, format);

        if (options.output) {
          writeFileSync(options.output, content, "utf-8");
          console.log(`Exported to ${options.output}`);
        } else {
          console.log(content);
        }
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  data
    .command("import <file>")
    .description("Import data from JSON or YAML file")
    .option("-f, --force", "Overwrite existing data without confirmation")
    .action((filePath: string, options: { force?: boolean }) => {
      try {
        const format = detectFormat(filePath);
        const content = readFileSync(filePath, "utf-8");
        const data = parseContent(content, format);

        if (!options.force) {
          console.error("Import will overwrite all existing data. Use --force to proceed.");
          process.exit(1);
        }

        importData(data);
        console.log(`Imported data from ${filePath}`);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
