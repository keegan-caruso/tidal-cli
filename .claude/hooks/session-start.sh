#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install Node 24 via nvm
export NVM_DIR=/opt/nvm
source /opt/nvm/nvm.sh
nvm install 24
nvm use 24
nvm alias default 24

# Persist Node 24 on PATH for the rest of the session
echo "export NVM_DIR=/opt/nvm" >> "$CLAUDE_ENV_FILE"
echo 'source /opt/nvm/nvm.sh' >> "$CLAUDE_ENV_FILE"
echo 'nvm use 24 --silent' >> "$CLAUDE_ENV_FILE"

# Install project dependencies
cd "$CLAUDE_PROJECT_DIR"
npm install
