#!/usr/bin/env bash
# Runs on the host before the devcontainer starts. Two jobs:
#   1. make sure ~/.claude{,.json} exist so the bind-mounts in
#      docker-compose.yaml don't create them as root-owned directories.
#   2. seed .devcontainer/.env with the parameters docker-compose needs,
#      without clobbering any values the user has already set.
set -euo pipefail

mkdir -p "$HOME/.claude"
touch "$HOME/.claude.json"

env_file=".devcontainer/.env"
mkdir -p "$(dirname "$env_file")"
touch "$env_file"

# Add `KEY=VALUE` only if no line for KEY is already in the file. Lets us
# evolve the set of managed defaults over time without overwriting user
# customizations or stale-but-deliberate values (e.g. WORKSPACE_NAME after
# the user has renamed the checkout).
ensure_var() {
    local key="$1" value="$2"
    if ! grep -q "^${key}=" "$env_file"; then
        echo "${key}=${value}" >> "$env_file"
    fi
}

# Used by docker-compose.yaml to build the bind-mount path. Defaults to the
# current directory name — usually `stakecore-frontend`, but matches whatever
# you cloned into.
ensure_var WORKSPACE_NAME "$(basename "$PWD")"

# Host-side ports published by docker-compose.yaml. Seeded here so they are
# discoverable and editable: a port already taken on the host makes
# `docker compose up` fail, and that failure takes the whole devcontainer
# with it rather than just the one service you wanted to reach.
# TOOL_PORTS is a range and is applied to both sides of the mapping, so it
# must stay a range (or a single number) — not a list.
ensure_var DEV_SERVER_PORT 5173
ensure_var PREVIEW_PORT 4173
ensure_var TOOL_PORTS 53770-53779
