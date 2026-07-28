#!/usr/bin/env bash
# Runs inside the container after creation. Activates pnpm via corepack
# (installing it into npm's global bin so it stays on PATH after npm
# updates), installs Claude Code and ripgrep, and installs Node deps when
# a package.json is present (the skeleton may not have one yet — guard so
# the command stays valid in both states).
set -euo pipefail

# Drop any previous npm-installed pnpm so corepack's shim wins on PATH.
# `|| true` because the package may not be there on a fresh container.
npm rm -g pnpm 2>/dev/null || true
corepack enable --install-directory "$(npm config get prefix)/bin" pnpm

npm install -g @anthropic-ai/claude-code

# The Todo Tree extension shells out to ripgrep, but resolves it only from
# a few hardcoded paths under VS Code's appRoot (`vscode-ripgrep` and
# `@vscode/ripgrep`) — it never falls back to PATH. Current VS Code ships
# the binary as `@vscode/ripgrep-universal/bin/<platform>/rg`, which
# matches none of them, so the extension errors out on startup. The base
# image carries no ripgrep of its own, so install one and pin
# `todo-tree.ripgrep` at it in devcontainer.json. Pointing the setting at
# VS Code's own copy instead would embed a build hash that changes on
# every VS Code update.
# Test the exact path the setting pins, not just `rg` on PATH — an rg
# somewhere else would satisfy a PATH check while leaving the setting
# dangling.
if [ ! -x /usr/bin/rg ]; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq ripgrep
fi

if [ -f package.json ]; then
    pnpm install
fi
