import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

/**
 * Resolve XDG Base Directory paths.
 * Creates the directory if it does not exist.
 */
export function xdgPath(kind: "config" | "data" | "state" | "cache", ...subdirs: string[]): string {
  let base: string;

  switch (kind) {
    case "config":
      base = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
      break;
    case "data":
      base = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
      break;
    case "state":
      base = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
      break;
    case "cache":
      base = process.env.XDG_CACHE_HOME || join(homedir(), ".cache");
      break;
  }

  const path = join(base, "context", ...subdirs);
  mkdirSync(path, { recursive: true });
  return path;
}
