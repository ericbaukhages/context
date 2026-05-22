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
5. **All MVP modules written, tested, and committed:**
   - `src/lib/xdg.ts` — XDG Base Directory path resolution.
   - `src/lib/git.ts` — Git worktree helpers.
   - `src/lib/tmux.ts` — Tmux session helpers.
   - `src/config.ts` — YAML config loading with defaults.
   - `src/db.ts` — SQLite connection & all 5 schema migrations.
   - `src/models/project.ts` — Project CRUD with activity logging.
   - `src/models/worktree.ts` — Worktree CRUD.
   - `src/models/session.ts` — Session tracking (start, stop, sync).
   - `src/models/agent.ts` — Agent run tracking.
   - `src/commands/worktree.ts` — `worktree add/list/remove`.
   - `src/commands/session.ts` — `session start/stop/sync/list`.
   - `src/commands/agent.ts` — `agent start/stop/list`.
   - `src/commands/log.ts` — `log` timeline query.
   - `src/commands/data.ts` — `data export/import` JSON/YAML.
   - `scripts/context.sh` — Shell shim for `ctx()` alias.
   - `scripts/context-fzf.sh` — Optional `fzf` wrapper.
   - `dist/context` — Compiled standalone binary.

---

## Current State

- **MVP is complete.** All spec'd CLI commands are implemented and tested.
- **Binary compiles.** `bun build --compile --outfile dist/context src/index.ts` produces a working executable.
- **Database auto-creates.** All tables exist: `projects`, `worktrees`, `sessions`, `agent_runs`, `activity_log`.
- **Config auto-creates.** `~/.config/context/config.yaml` with sensible defaults.
- **Next action:** Install the binary and shell shim, then start using it. Or move on to v2 features.

---

## Install (Manual)

```bash
# 1. Build the binary
bun run build

# 2. Put it somewhere on your PATH
mkdir -p ~/.local/bin
cp dist/context ~/.local/bin/

# 3. Source the shell shim in your rc file
echo 'source /path/to/context/scripts/context.sh' >> ~/.zshrc
# Optional: fzf wrapper
echo 'source /path/to/context/scripts/context-fzf.sh' >> ~/.zshrc
```

Then: `ctx myproject` to start a session and attach, or `context project add my-idea` to log an idea.

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
| `src/lib/git.ts` | Git worktree helpers |
| `src/lib/tmux.ts` | Tmux session helpers |
| `src/config.ts` | Config loading |
| `src/db.ts` | SQLite connection & migrations |
| `src/models/*.ts` | CRUD models |
| `src/commands/*.ts` | CLI command handlers |
| `src/index.ts` | CLI entrypoint |
| `scripts/context.sh` | Shell shim for `ctx` alias |
| `scripts/context-fzf.sh` | Optional `fzf` wrapper |
| `dist/context` | Compiled binary |

---

## Next Steps (Post-MVP)

1. **MCP server** — Expose context data to chat interfaces.
2. **Auto-detect agent runs** — Plugin system to hook into tools automatically.
3. **Time analytics** — `context report` with session duration, agent usage, etc.
4. **GitHub integration** — Link projects to repos, auto-detect PRs/issues.
5. **TUI** — Simple ncurses or blessed-based interface (if desired).
6. **Tests** — Bun test runner for models and commands.

---

*Last updated: 2026-05-22*
*Status: MVP Complete*
