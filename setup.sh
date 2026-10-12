#!/usr/bin/env bash
# One-time local setup: install, test, build, and set the deploy switch to off.
# The GitHub repo marcelodiazd/santo-rosario already exists; run this from a clone of it.
set -euo pipefail
REPO="marcelodiazd/santo-rosario"

command -v node >/dev/null || { echo "Install Node.js 22 first: https://nodejs.org"; exit 1; }
command -v gh   >/dev/null || { echo "Install the GitHub CLI: https://cli.github.com"; exit 1; }
gh auth status >/dev/null 2>&1 || gh auth login

npm ci               # exact versions from package-lock.json
npm test -- --run    # unit tests once
npm run build        # type-check and production build into dist/

# Deploy stays off until the FTP secrets are set (see README, "Switch on deploy").
gh variable set DEPLOY_ENABLED --body false --repo "$REPO"
echo "Pipeline: https://github.com/$REPO/actions"
