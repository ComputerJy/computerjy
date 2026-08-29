---
name: lightsail-deploy
description: >-
  Use this skill when the user asks to deploy the static frontend to AWS Lightsail, check deployment readiness, or update deployment configs.
---

# AWS Lightsail Deployment Runbook

This skill outlines the process for building and deploying the static Astro distribution to AWS Lightsail (`/var/www/computerjy_dist`).

## 1. Pre-Flight Verification

Ensure environment variables and credentials are configured in `.env` (or inherited from environment):

- `SERVER_HOST`: The Lightsail server IP or hostname.
- `SERVER_USER`: Typically `ubuntu`.
- `KEY_PATH`: Path to the SSH private key (e.g. `~/.ssh/lightsail.pem`). Set the real path in `.env`;
  never name the actual key file in a tracked file.
- `REMOTE_DEST`: Destination directory (defaults to `/var/www/computerjy_dist`).

Check that `.env` exists:

```bash
test -f .env && echo "✅ .env found" || echo "❌ .env missing. Copy .env.example to .env and configure."
```

## 2. Test Build & Verify

Before deploying to production, run a clean build and artifact check:

```bash
npm run build
npm run verify:build
```

## 3. Execute Deployment

Run the automated deployment script:

```bash
./deploy/deploy-lightsail.sh
```

The script performs the following steps:

1. Compiles the static site to `dist/`.
2. Creates the target directory on the Lightsail host via SSH.
3. Rsyncs `dist/` to `${REMOTE_DEST}/` with `--delete` to remove stale files.
4. Updates file ownership to `www-data:www-data` and sets permissions to `755`.

## 4. Post-Deploy Health Check

Verify that the production endpoint responds with HTTP 200:

```bash
curl -sI https://www.computerjy.com/ | head -n 5
```
