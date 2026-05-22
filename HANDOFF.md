# Handoff: Context Project

> Created: 2026-05-21
> Updated: 2026-05-22
> Purpose: Reset context and resume work from a known state.

---

## What This Project Is

`context` (daily alias: `ctx`) is a CLI tool for managing project lifecycles, git worktrees, tmux sessions, and agent runs. It is an evolution of the older Go tool `choose` (https://github.com/ericbaukhages/choose).

**Core goal:** Never lose an idea. Track every project stage from `IDEA` → `SPEC` → `REPO` → `ACTIVE` → `ARCHIVED`. Use git worktrees to isolate explorations. Log tmux sessions and agent runs to a local SQLite database for later querying.

**Primary interface:** CLI engine, with chat/MCP as the eventual UI. No fancy TUI for MVP.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Bun |
| Language | TypeScript |
| CLI Framework | `commander` |
| Database | SQLite (`bun:sqlite`) |
| Config | YAML (`js-yaml`), XDG-compliant paths |
| Process Mgmt | `child_process` + shell shim (`scripts/context.sh`) |

---

## What's Been Done

1. **Idea exploration** — Answered 7 foundational questions. See `QUESTIONS.md`.
2. **Spec written** — Full MVP spec in `spec/SPEC.md`.
3. **Git repo initialized** — Multiple commits on `main`.
4. **Project scaffolded** — `bun init`, dependencies installed (`commander`, `js-yaml`).
5. **Core modules written and tested:**
   - `src/lib/xdg.ts` — XDG Base Directory path resolution (creates dirs on demand).
   - `src/config.ts` — YAML config loading with defaults, auto-creates `~/.config/context/config.yaml`.
   - `src/db.ts` — SQLite connection via `bun:sqlite`, all 5 schema migrations applied.
   - `src/models/project.ts` — Project CRUD with activity logging.
   - `src/index.ts` — CLI entrypoint with `commander`. All `project` subcommands working:
     - `add`, `list`, `status`, `archive`, `remove`

---

## Current State

- **Basic CLI engine is running.** You can add/list/update/remove projects.
- **Database auto-creates.** All tables exist: `projects`, `worktrees`, `sessions`, `agent_runs`, `activity_log`.
- **Config auto-creates.** `~/.config/context/config.yaml` with sensible defaults.
- **Next action:** Build `worktree`, `session`, `agent`, and `log` commands.

---

## Next Steps (In Order)

1. **`src/models/worktree.ts`** — Worktree CRUD (create, list, remove).
2. **`src/commands/worktree.ts`** — `context worktree add/list/remove` wired to `git worktree`.
3. **`src/models/session.ts`** — Session tracking (start, stop, sync).
4. **`src/commands/session.ts`** — `context session start/stop/sync` wired to `tmux`.
5. **`src/models/agent.ts`** — Agent run tracking.
6. **`src/commands/agent.ts`** — `context agent start/stop`.
7. **`src/commands/log.ts`** — `context log` timeline query.
8. **`src/commands/data.ts`** — `context export/import` for JSON/YAML.
9. **`scripts/context.sh`** — Shell shim for `ctx()` alias that `exec`s into tmux.
10. **`scripts/context-fzf.sh`** — Optional `fzf` wrapper for project selection.
11. **Build & binary** — `bun build --compile --outfile dist/context src/index.ts`.

---

## Key Decisions (Don't Revisit Without Good Reason)

- **MVP is tight.** No auto-detecting agent runs, no MCP server, no TUI, no GitHub integration.
- **Agent runs are manual/hooked.** `context agent start/stop` commands. Plugins later.
- **Worktree naming is auto-generated.** Default: `explore/YYYY-MM-DD-<slug>`. Optional override.
- **Tmux attach uses a shell shim.** `scripts/context.sh` provides a `ctx()` function that `exec`s into tmux.
- **Storage is dual-track.** YAML config for settings, SQLite for usage/analytics data. Import/export from day one.
- **XDG compliance.** Config in `~/.config/context/`, data in `~/.local/share/context/`, state in `~/.local/state/context/`, cache in `~/.cache/context/`.

---

## Files

| File | Purpose |
|---|---|
| `QUESTIONS.md` | Original Q&A that shaped the spec |
| `spec/SPEC.md` | Full MVP specification |
| `.gitignore` | Standard ignore rules + DB files |
| `HANDOFF.md` | This file |
| `src/lib/xdg.ts` | XDG path resolution |
| `src/config.ts` | Config loading |
| `src/db.ts` | SQLite connection & migrations |
| `src/models/project.ts` | Project CRUD |
| `src/index.ts` | CLI entrypoint |

---

## How to Resume

1. Read `spec/SPEC.md` (especially sections 4–6 for commands and data model).
2. Pick the next step from the list above.
3. Write code in `src/models/` and `src/commands/`, wire into `src/index.ts`.
4. Test with `bun run src/index.ts <command>`.

---

*Last updated: 2026-05-22*
