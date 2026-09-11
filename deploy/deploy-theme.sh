#!/usr/bin/env bash
# ==============================================================================
# Deploy the ComputerJy 2.0 theme and the agent-discovery files to the origin.
#
# The repo root also carries the deploy tooling, tests and the retired edge Worker, so the theme is
# staged from an allowlist: only what WordPress needs reaches the server, and
# .env / node_modules / src never land in a web-served directory.
#
#   deploy/deploy-theme.sh                 # stage + rsync + php -l on the server
#   STAGE_ONLY=1 STAGE_DIR=/tmp/x deploy/deploy-theme.sh   # stage only (tests)
#
# Credentials come from .env (SERVER_HOST, SERVER_USER, KEY_PATH), exactly as
# deploy/deploy-lightsail.sh reads them.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${ROOT_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"

if [ -f "${ROOT_DIR}/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/.env"
    set +a
fi

SERVER_HOST="${SERVER_HOST:-${LIGHTSAIL_HOST:-}}"
SERVER_USER="${SERVER_USER:-ubuntu}"
KEY_PATH="${KEY_PATH:-${HOME}/.ssh/lightsail.pem}"
KEY_PATH="${KEY_PATH/#\~/$HOME}"
KEY_PATH="${KEY_PATH/\$\{HOME\}/$HOME}"
KEY_PATH="${KEY_PATH/\$HOME/$HOME}"
WP_ROOT="${WP_ROOT:-/var/www/wordpress}"
THEME_SLUG="${THEME_SLUG:-computerjy-2}"
STAGE_DIR="${STAGE_DIR:-$(mktemp -d)}"
THEME_STAGE="${STAGE_DIR}/theme"
ROOT_STAGE="${STAGE_DIR}/webroot"

rm -rf "${THEME_STAGE}" "${ROOT_STAGE}"
mkdir -p "${THEME_STAGE}/inc" "${ROOT_STAGE}"

echo "📦 Staging theme in ${THEME_STAGE}"
# Top-level templates and theme metadata.
cp "${ROOT_DIR}"/*.php "${ROOT_DIR}/style.css" "${ROOT_DIR}/theme.json" "${ROOT_DIR}/screenshot.png" "${THEME_STAGE}/"
cp -r "${ROOT_DIR}/assets" "${ROOT_DIR}/template-parts" "${ROOT_DIR}/page-templates" "${THEME_STAGE}/"
[ -d "${ROOT_DIR}/languages" ] && cp -r "${ROOT_DIR}/languages" "${THEME_STAGE}/"
# inc/computerjy-*.php are standalone plugins installed by hand into
# wp-content/plugins (see deploy/wordpress-rebuild-trigger.md); not theme files.
for f in "${ROOT_DIR}"/inc/*.php; do
    case "$(basename "$f")" in
        computerjy-*) ;;
        *) cp "$f" "${THEME_STAGE}/inc/" ;;
    esac
done

echo "📦 Staging webroot files in ${ROOT_STAGE}"
# Agent-discovery documents, robots/security.txt, logos, auth.md, markdown.php.
# These are served straight from the WordPress DocumentRoot by Apache's real-file
# check ahead of WordPress's rewrite (deploy/lightsail-apache.conf).
cp -r "${ROOT_DIR}/public/." "${ROOT_STAGE}/"

if command -v php >/dev/null 2>&1; then
    echo "🔍 php -l on staged files"
    lint_output=$(find "${THEME_STAGE}" "${ROOT_STAGE}" -name '*.php' -exec php -l {} + 2>&1 || true)
    if grep -q 'Errors parsing' <<< "${lint_output}"; then
        grep -v '^No syntax errors' <<< "${lint_output}"
        echo "❌ PHP syntax error in staged files"; exit 1
    fi
fi

if [ "${STAGE_ONLY:-0}" = "1" ]; then
    echo "✅ Staged only (STAGE_ONLY=1): ${STAGE_DIR}"
    exit 0
fi

if [ -z "${SERVER_HOST}" ]; then
    echo "❌ SERVER_HOST is not set (see .env.example)"; exit 1
fi

SSH=(ssh -i "${KEY_PATH}" -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_HOST}")
REMOTE_TMP="/tmp/computerjy-deploy-$$"
THEME_DIR="${WP_ROOT}/wp-content/themes/${THEME_SLUG}"

echo "🚀 Uploading to ${SERVER_HOST}:${REMOTE_TMP}"
"${SSH[@]}" "mkdir -p ${REMOTE_TMP}"
rsync -az --delete -e "ssh -i ${KEY_PATH} -o StrictHostKeyChecking=accept-new" "${STAGE_DIR}/" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_TMP}/"

echo "🔧 Installing theme into ${THEME_DIR} (with --delete) and webroot files (without)"
"${SSH[@]}" "set -e
sudo mkdir -p '${THEME_DIR}'
sudo rsync -a --delete --chown=www-data:www-data '${REMOTE_TMP}/theme/' '${THEME_DIR}/'
sudo rsync -a --chown=www-data:www-data '${REMOTE_TMP}/webroot/' '${WP_ROOT}/'
sudo find '${THEME_DIR}' -type d -exec chmod 755 {} + -o -type f -exec chmod 644 {} +
rm -rf '${REMOTE_TMP}'
sudo -u www-data wp --path='${WP_ROOT}' theme status '${THEME_SLUG}'"

echo "🎉 Theme deployed. Activate with: sudo -u www-data wp --path=${WP_ROOT} theme activate ${THEME_SLUG}"
