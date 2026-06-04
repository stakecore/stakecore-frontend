#!/usr/bin/env bash
# Runs inside the container after creation. Activates pnpm via corepack
# (installing it into npm's global bin so it stays on PATH after npm
# updates), installs Claude Code, and installs Node deps when a
# package.json is present (the skeleton may not have one yet — guard so
# the command stays valid in both states).
set -euo pipefail

# Drop any previous npm-installed pnpm so corepack's shim wins on PATH.
# `|| true` because the package may not be there on a fresh container.
npm rm -g pnpm 2>/dev/null || true
corepack enable --install-directory "$(npm config get prefix)/bin" pnpm

npm install -g @anthropic-ai/claude-code

if [ -f package.json ]; then
    pnpm install
fi
