# context

`context` (daily alias: `ctx`) is a CLI tool for managing project lifecycles, git worktrees, tmux sessions, and agent runs.

## Quick Start

```bash
# Build the binary
bun run build

# Install to PATH
mkdir -p ~/.local/bin
cp dist/context ~/.local/bin/

# Source the shell shim
echo 'source /path/to/context/scripts/context.sh' >> ~/.zshrc
```

Then: `ctx myproject` to start a session and attach, or `context project add my-idea` to log an idea.

## What It Does

Track every project stage from `IDEA` → `SPEC` → `REPO` → `ACTIVE` → `ARCHIVED`. Use git worktrees to isolate explorations. Log tmux sessions and agent runs to a local SQLite database for later querying.

## Built With

- Bun + TypeScript
- `commander` for CLI
- SQLite (`bun:sqlite`) for data
- YAML for config

## AI Disclaimer

This project is being built with the help of AI tools. Currently that means **Kimi k2.5** via [opencode](https://github.com/opencode-ai/opencode). We expect to use other models and agents over time.

## Project Docs

- `HANDOFF.md` — Full project status, decisions, and next steps
- `spec/SPEC.md` — MVP specification
- `QUESTIONS.md` — Original Q&A that shaped the project

---

*MVP complete. See `HANDOFF.md` for post-MVP roadmap.*
