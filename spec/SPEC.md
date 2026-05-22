# Context — Project Spec

> A project lifecycle and context manager.
> Tracks ideas, repos, worktrees, tmux sessions, and agent runs.
> Primary interface: CLI engine (with chat/MCP as the eventual UI).

---

## 1. Overview

`context` (working title) is an evolution of `choose`. Instead of simply launching tmux sessions, it manages the full lifecycle of a project from idea to archive, with rich tracking of sessions and agent runs via a local SQLite database.

The goal is to never lose an idea, always know what you were working on, and easily isolate explorations via git worktrees.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Runtime** | Bun | Fast TS runtime, easy native compilation (`bun build --compile`), built-in test runner, fast SQLite |
| **Language** | TypeScript | Preferred by author, fast iteration, great ecosystem |
| **CLI Framework** | `commander` | Mature, simple, widely used |
| **Database** | SQLite (`bun:sqlite`) | Zero-config local DB, perfect for analytics and timeline data |
| **Config** | YAML (`js-yaml`) | Human-readable, easy to edit by hand. Stored in XDG-compliant paths. |
| **Process Mgmt** | `child_process` + shell shim | TS can't `execve` replace itself like Go, so we use a small shell wrapper for tmux attach |

---

## 3. MVP Scope

### In Scope
1. **Project Registry**: CRUD operations for projects. Status tracking.
2. **Git Worktree Management**: Create, list, and remove worktrees for active projects.
3. **Session Tracking**: Log tmux session start/end times tied to a project + worktree.
4. **Agent Run Logging**: Manual CLI hook to log agent runs (tool, branch, notes).
5. **Timeline Query**: `context log` to view recent activity.
6. **Import / Export**: `context export` and `context import` for JSON/YAML.

### Out of Scope (v2)
- Auto-detection of agent runs (no plugins yet).
- MCP server.
- GitHub integration.
- Fancy TUI.
- Time analytics / reporting (raw collection only).
- Scheduling.

---

## 4. CLI Command Tree

```
context
├── project
│   ├── add <name> [path]          # Add a new project (path optional for ideas)
│   ├── list [status]              # List projects, optionally filter by status
│   ├── status <name> <status>     # Update project status
│   ├── archive <name>             # Shorthand for status -> ARCHIVED
│   └── remove <name>              # Delete project and all associated data
├── worktree
│   ├── add <project> [name]       # Create a new worktree + branch (auto-named if omitted)
│   ├── list <project>             # List worktrees for a project
│   └── remove <project> <name>    # Remove a worktree
├── session
│   ├── start <project> [worktree] # Start a tmux session (logs to DB)
│   ├── stop [session-id]          # Mark a session as ended (defaults to active session)
│   └── sync                       # Poll tmux and auto-close any missing sessions
├── agent
│   ├── start <project>            # Log the start of an agent run
│   └── stop <run-id>              # Log the end of an agent run
├── log                            # Show timeline of sessions and agent runs
└── data
    ├── export [format]            # Export DB to JSON or YAML
    └── import <file>              # Import data from JSON or YAML
```

### Usage Patterns
- `context` or `context project list` → fuzzy finder via `fzf` (external script).
- `context session start myproject` → creates worktree if needed, starts tmux, logs session.
- `ctx myproject` → shell alias/shim that starts a session and attaches to tmux (replaces current shell process).
- `context agent start myproject --tool opencode --branch feature-x` → logs an agent run.

---

## 5. Data Model

### 5.1 SQLite Schema

```sql
-- Projects: the core entity
CREATE TABLE projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    path        TEXT,                     -- null for IDEA/SPEC stage
    status      TEXT NOT NULL DEFAULT 'IDEA',
    created_at  INTEGER NOT NULL,         -- unix timestamp
    updated_at  INTEGER NOT NULL
);

-- Worktrees: git worktrees tied to projects
CREATE TABLE worktrees (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    branch      TEXT NOT NULL,
    path        TEXT NOT NULL,
    created_at  INTEGER NOT NULL
);

-- Sessions: tmux sessions (or any shell session)
CREATE TABLE sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    worktree_id INTEGER REFERENCES worktrees(id) ON DELETE SET NULL,
    started_at  INTEGER NOT NULL,
    ended_at    INTEGER,                  -- null if active
    context     TEXT                      -- freeform note
);

-- Agent Runs: tracked AI tool usage
CREATE TABLE agent_runs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    worktree_id INTEGER REFERENCES worktrees(id) ON DELETE SET NULL,
    tool        TEXT NOT NULL,             -- 'opencode', 'claude', 'codex', etc.
    started_at  INTEGER NOT NULL,
    ended_at    INTEGER,
    prompt      TEXT,                      -- what was asked (optional)
    notes       TEXT
);

-- Activity Log: a generic, append-only event stream for extensibility
CREATE TABLE activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,             -- 'project_created', 'session_started', 'agent_run_started', etc.
    project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    worktree_id INTEGER REFERENCES worktrees(id) ON DELETE SET NULL,
    payload     TEXT,                      -- JSON blob for flexibility
    created_at  INTEGER NOT NULL
);
```

### 5.2 Config File

Stored at `$XDG_CONFIG_HOME/context/config.yaml` (fallback: `~/.config/context/config.yaml`).

```yaml
# Machine-specific settings
database_path: "~/.local/share/context/context.db"   # default; resolved via XDG
default_editor: "nvim"
tmux_wrapper: true          # if true, session start tries to attach tmux

# Optional: paths to scan for auto-discovering existing git repos
# (out of scope for MVP, but reserved key)
project_roots: []
```

**XDG Base Directory compliance:**
- **Config**: `$XDG_CONFIG_HOME/context/` (fallback `~/.config/context/`)
- **Data (DB)**: `$XDG_DATA_HOME/context/` (fallback `~/.local/share/context/`)
- **State (logs, session state)**: `$XDG_STATE_HOME/context/` (fallback `~/.local/state/context/`)
- **Cache**: `$XDG_CACHE_HOME/context/` (fallback `~/.cache/context/`)

The tool will create these directories on first run. All paths are resolved via a small internal XDG helper rather than pulling in a dependency.

---

## 6. Project Structure

```
context/
├── package.json
├── tsconfig.json
├── biome.json               # linting / formatting
├── src/
│   ├── index.ts             # CLI entrypoint (commander setup)
│   ├── config.ts            # Config loading / validation
│   ├── db.ts                # SQLite connection, migrations, helpers
│   ├── models/
│   │   ├── project.ts       # Project CRUD
│   │   ├── worktree.ts      # Worktree CRUD
│   │   ├── session.ts       # Session tracking
│   │   └── agent.ts         # Agent run tracking
│   ├── commands/
│   │   ├── project.ts
│   │   ├── worktree.ts
│   │   ├── session.ts
│   │   ├── agent.ts
│   │   ├── log.ts
│   │   └── data.ts
│   └── lib/
│       ├── xdg.ts           # XDG Base Directory path resolution
│       ├── git.ts           # git worktree helpers
│       ├── tmux.ts          # tmux session helpers
│       └── time.ts          # timestamp utilities
├── scripts/
│   ├── context-fzf.sh       # Optional fzf wrapper for project selection
│   └── context.sh           # Shell shim: source this for the `ctx` alias
└── spec/
    └── SPEC.md              # This file
```

---

## 7. Key Design Decisions

| Decision | Rationale |
|---|---|
| **SQLite over plain text** | Enables complex queries (timeline, analytics) while remaining local and zero-config. |
| **Import/Export from day one** | Prevents lock-in, makes it easy to back up or migrate data, satisfies the plain-text preference for core data. |
| **Agent runs are manual/hooked** | Avoids building brittle tool-specific plugins for MVP. A simple `context agent start/stop` command is enough to prove value. |
| **No TUI** | Focus on CLI engine and data. UI can be built later via chat/MCP or simple `fzf` scripts. |
| **Status enum** | `IDEA`, `SPEC`, `REPO`, `ACTIVE`, `ARCHIVED`. Explicit lifecycle stages prevent drift. |
| **Activity log table** | Append-only event stream makes the DB extensible. New features can add events without schema changes. |
| **XDG Base Directory compliance** | Respects `$XDG_CONFIG_HOME`, `$XDG_DATA_HOME`, etc. Keeps the home directory clean and follows Linux/macOS conventions. |

---

## 8. Resolved Questions

| # | Question | Resolution |
|---|---|---|
| 1 | **Tmux Attach Strategy** | Shell shim (`scripts/context.sh`) providing a `ctx()` function. Users source it in their shell; it calls `context session start`, reads the session name, and `exec`s into `tmux attach -t <session>`. This preserves the `choose`-style UX where the user ends up *inside* tmux. |
| 2 | **Worktree Naming Convention** | Auto-generated by default: `explore/YYYY-MM-DD-<slug>` (or `ctx-<timestamp>-<slug>`). Optional override: `context worktree add myproject custom-name`. Optimizes for capturing random ideas without clutter. |
| 3 | **Session Auto-Stop** | Manual `context session stop [id]` as primary. `context session sync` polls `tmux list-sessions` and auto-closes any sessions no longer present. No background daemon required for MVP. |
| 4 | **Validation on `project add`** | Auto-detects if the path is a git repo. If yes, suggest status `REPO`. No automatic worktree creation — the user explicitly requests that with `context worktree add`. |
| 5 | **Name** | **Project name**: `context`. **Daily alias**: `ctx`. Descriptive and short. Can always rename later if needed. |

## 9. Next Steps

1. Scaffold the project (`bun init`, `tsconfig.json`, `biome.json`).
2. Write `src/lib/xdg.ts` — XDG path resolution.
3. Write `src/config.ts` — config loading, validation, and auto-creation of XDG dirs.
4. Write `src/db.ts` — SQLite connection, schema migrations, and helpers.
5. Write `src/models/project.ts` — Project CRUD.
6. Wire up the CLI entrypoint (`src/index.ts`) with the first command: `context project add`.

---

*Last updated: 2026-05-21*
*Status: Draft — open questions resolved, ready to scaffold*
