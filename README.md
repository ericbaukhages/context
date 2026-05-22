# Context

A project lifecycle and context manager. Tracks ideas, repos, worktrees, tmux sessions, and agent runs.

## Install

### 1. Build the binary

Requires [Bun](https://bun.sh).

```bash
git clone <repo-url>
cd context
bun install
bun run build
```

This produces `dist/context`.

### 2. Put the binary on your PATH

```bash
mkdir -p ~/.local/bin
cp dist/context ~/.local/bin/
```

### 3. Install shell completions

**Bash:**

```bash
# Save to a completions directory
context completion bash > ~/.local/share/bash-completion/completions/context

# Or source directly in ~/.bashrc:
echo 'source <(context completion bash)' >> ~/.bashrc
```

**Zsh:**

```bash
# Save to a site-functions directory (must be in $fpath)
mkdir -p /usr/local/share/zsh/site-functions
context completion zsh > /usr/local/share/zsh/site-functions/_context

# Or source directly in ~/.zshrc:
echo 'source <(context completion zsh)' >> ~/.zshrc
```

### 4. Source the shell shim (optional)

The shell shim provides the `ctx` alias for starting sessions and auto-attaching to tmux.

```bash
echo "source $(pwd)/scripts/context.sh" >> ~/.zshrc
# Optional fzf wrapper:
echo "source $(pwd)/scripts/context-fzf.sh" >> ~/.zshrc
```

Then reload your shell or run `source ~/.zshrc`.

## Update

To update completions after adding new commands or subcommands:

```bash
# Rebuild the binary
bun run build

# Regenerate completions
context completion bash > ~/.local/share/bash-completion/completions/context
context completion zsh > /usr/local/share/zsh/site-functions/_context
```

Or, if you source completions directly in your rc file, simply restart your shell.

## Usage

```bash
context project add my-idea --status IDEA
context project list
ctx myproject              # starts session + attaches to tmux
context log                # see timeline
context data export        # backup everything
```

See `context --help` for all commands.
