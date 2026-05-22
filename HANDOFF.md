# Handoff: Context Project

> Created: 2026-05-21
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

1. **Idea exploration** — Answered 7 foundational questions about the project entity, git worktrees, agent runs, analytics, MVP workflow, config vs. database, and MCP server goals. See `QUESTIONS.md`.
2. **Spec written** — Full MVP spec in `spec/SPEC.md` covering:
   - CLI command tree (`project`, `worktree`, `session`, `agent`, `log`, `data`)
   - SQLite schema (`projects`, `worktrees`, `sessions`, `agent_runs`, `activity_log`)
   - XDG Base Directory compliance
   - Resolved open questions (tmux attach strategy, worktree naming, session auto-stop, validation, name)
3. **Git repo initialized** — One commit on `main`.

---

## Current State

- **No code yet.** The project is at the "ready to scaffold" stage.
- **Spec is approved.** All open questions resolved.
- **Next action:** Run `bun init` and begin writing the core files.

---

## Next Steps (In Order)

1. `bun init` — Scaffold `package.json`, `tsconfig.json`.
2. `src/lib/xdg.ts` — XDG Base Directory path resolution.
3. `src/config.ts` — Config loading, validation, auto-creation of XDG dirs.
4. `src/db.ts` — SQLite connection, schema migrations, helpers.
5. `src/models/project.ts` — Project CRUD.
6. `src/index.ts` — CLI entrypoint with `commander`. First command: `context project add`.

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

---

## How to Resume

1. Read `spec/SPEC.md`.
2. Pick the next step from the list above.
3. Run `bun init` if you haven't already.
4. Start writing code.

---

*Last updated: 2026-05-21*
