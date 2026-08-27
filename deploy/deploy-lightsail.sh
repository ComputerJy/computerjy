#!/usr/bin/env bash
# ==============================================================================
# 1-Click Build & Deploy Script for ComputerJy World on AWS Lightsail
# Credentials and server host are loaded from local .env or environment variables
# ==============================================================================

set -e

# Load local .env if it exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${ROOT_DIR}/.env" ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' "${ROOT_DIR}/.env" | xargs -0 -d '\n' 2>/dev/null || grep -v '^#' "${ROOT_DIR}/.env" | xargs)
fi

SERVER_HOST="${SERVER_HOST:-${LIGHTSAIL_HOST:-}}"
SERVER_USER="${SERVER_USER:-ubuntu}"
KEY_PATH="${KEY_PATH:-${HOME}/<ssh-key-redacted>}"
REMOTE_DEST="${REMOTE_DEST:-/var/www/computerjy_dist}"

if [ -z "${SERVER_HOST}" ]; then
    echo "❌ Error: SERVER_HOST is not set."
    echo "💡 Please set SERVER_HOST in your .env file or environment:"
    echo "   echo 'SERVER_HOST=your_server_ip' >> .env"
    exit 1
fi

echo "🚀 Step 1: Building ComputerJy World Astro Static Site..."
npm run build

echo "✨ Step 2: Preparing destination directory on Lightsail server (${SERVER_HOST})..."
ssh -i "${KEY_PATH}" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" "sudo mkdir -p ${REMOTE_DEST} && sudo chown -R ${SERVER_USER}:${SERVER_USER} ${REMOTE_DEST}"

echo "📦 Step 3: Syncing static dist/ files to ${REMOTE_DEST}..."
rsync -avz --delete -e "ssh -i ${KEY_PATH} -o StrictHostKeyChecking=no" dist/ "${SERVER_USER}@${SERVER_HOST}:${REMOTE_DEST}/"

echo "🔧 Step 4: Setting correct file permissions for Apache..."
ssh -i "${KEY_PATH}" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" "sudo chown -R www-data:www-data ${REMOTE_DEST} && sudo chmod -R 755 ${REMOTE_DEST}"

echo "🎉 Deployment complete! Visit: https://www.computerjy.com/"
