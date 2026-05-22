import { execSync } from "node:child_process";

export function tmuxSessionExists(name: string): boolean {
  try {
    execSync(`tmux has-session -t "${name}"`, { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function tmuxNewSession(name: string, cwd: string): void {
  execSync(`tmux new-session -d -s "${name}" -c "${cwd}"`, { encoding: "utf-8" });
}

export function tmuxKillSession(name: string): void {
  execSync(`tmux kill-session -t "${name}"`, { encoding: "utf-8" });
}

export function tmuxListSessions(): string[] {
  try {
    const output = execSync("tmux list-sessions -F '#{session_name}'", { encoding: "utf-8", stdio: "pipe" });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
