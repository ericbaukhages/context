# context shell shim
# Source this file in your shell rc (.bashrc, .zshrc, etc.):
#   source /path/to/context/scripts/context.sh
#
# Then use `ctx <project>` to start a session and attach to tmux.

ctx() {
    local project="$1"
    if [ -z "$project" ]; then
        echo "Usage: ctx <project>"
        return 1
    fi

    local output
    output=$(context session start "$project" 2>&1)
    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        echo "$output" >&2
        return $exit_code
    fi

    # Extract session name from "Started session "NAME" ..."
    local session_name
    session_name=$(echo "$output" | sed -n 's/Started session "\([^"]*\)".*/\1/p')

    if [ -z "$session_name" ]; then
        echo "Failed to determine tmux session name" >&2
        return 1
    fi

    exec tmux attach -t "$session_name"
}
