import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

export function isGitRepo(path: string): boolean {
  return existsSync(`${path}/.git`);
}

export function gitWorktreeAdd(repoPath: string, worktreePath: string, branch: string): void {
  execSync(`git -C "${repoPath}" worktree add "${worktreePath}" -b "${branch}"`, { encoding: "utf-8" });
}

export function gitWorktreeRemove(repoPath: string, worktreePath: string): void {
  execSync(`git -C "${repoPath}" worktree remove "${worktreePath}"`, { encoding: "utf-8" });
}

export function gitGetCurrentBranch(repoPath: string): string {
  return execSync(`git -C "${repoPath}" rev-parse --abbrev-ref HEAD`, { encoding: "utf-8" }).trim();
}
