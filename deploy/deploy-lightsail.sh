#!/usr/bin/env bash
# ==============================================================================
# 1-Click Build & Deploy Script for ComputerJy World on AWS Lightsail
# SSH Target: ubuntu@3.81.5.209
# Key: ~/Wordpress2.pem
# ==============================================================================

set -e

KEY_PATH="${HOME}/Wordpress2.pem"
SERVER_HOST="3.81.5.209"
SERVER_USER="ubuntu"
REMOTE_DEST="/var/www/computerjy_dist"

echo "🚀 Step 1: Building ComputerJy World Astro Static Site..."
npm run build

echo "✨ Step 2: Preparing destination directory on Lightsail server (${SERVER_HOST})..."
ssh -i "${KEY_PATH}" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" "sudo mkdir -p ${REMOTE_DEST} && sudo chown -R ${SERVER_USER}:${SERVER_USER} ${REMOTE_DEST}"

echo "📦 Step 3: Syncing static dist/ files to ${REMOTE_DEST}..."
rsync -avz --delete -e "ssh -i ${KEY_PATH} -o StrictHostKeyChecking=no" dist/ "${SERVER_USER}@${SERVER_HOST}:${REMOTE_DEST}/"

echo "🔧 Step 4: Setting correct file permissions for Apache..."
ssh -i "${KEY_PATH}" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" "sudo chown -R www-data:www-data ${REMOTE_DEST} && sudo chmod -R 755 ${REMOTE_DEST}"

echo "🎉 Deployment complete! Visit: https://www.computerjy.com/"
