#!/usr/bin/env bash
# context-fzf.sh — fuzzy finder wrapper for context project selection
# Source this file in your shell rc (.bashrc, .zshrc, etc.):
#   source /path/to/context/scripts/context-fzf.sh
#
# Requires: fzf (https://github.com/junegunn/fzf)
# Usage: ctxf

ctxf() {
    if ! command -v fzf >/dev/null 2>&1; then
        echo "fzf is not installed. Install it from https://github.com/junegunn/fzf" >&2
        return 1
    fi

    local project
    project=$(context project list | fzf | awk '{print $1}')
    if [ -n "$project" ]; then
        ctx "$project"
    fi
}
