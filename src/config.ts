import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { xdgPath } from "./lib/xdg.js";

export interface Config {
  database_path: string;
  default_editor: string;
  tmux_wrapper: boolean;
  project_roots: string[];
}

const DEFAULT_CONFIG: Config = {
  database_path: "~/.local/share/context/context.db",
  default_editor: "nvim",
  tmux_wrapper: true,
  project_roots: [],
};

const CONFIG_PATH = join(xdgPath("config"), "config.yaml");

export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    writeFileSync(CONFIG_PATH, yaml.dump(DEFAULT_CONFIG), "utf-8");
    return { ...DEFAULT_CONFIG };
  }

  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const parsed = yaml.load(raw) as Partial<Config>;

  return {
    database_path: parsed.database_path ?? DEFAULT_CONFIG.database_path,
    default_editor: parsed.default_editor ?? DEFAULT_CONFIG.default_editor,
    tmux_wrapper: parsed.tmux_wrapper ?? DEFAULT_CONFIG.tmux_wrapper,
    project_roots: parsed.project_roots ?? DEFAULT_CONFIG.project_roots,
  };
}

export function resolveDatabasePath(config: Config): string {
  const path = config.database_path;
  if (path.startsWith("~/")) {
    return join(process.env.HOME || "/", path.slice(2));
  }
  return path;
}
