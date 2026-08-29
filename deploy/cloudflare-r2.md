# Cloudflare R2 + edge Worker

Serves the Astro build (`dist/`) from a Cloudflare R2 bucket through a Worker,
and leaves `/wp-admin`, `/wp-json`, `/wp-content` and `markdown.php` on the
Lightsail origin.

Nothing here is live until you create the two API tokens, add the six GitHub
secrets, and uncomment the routes in
[`workers/edge-router/wrangler.toml`](../workers/edge-router/wrangler.toml).
Until then `deploy.yml` behaves exactly as it always has: build, verify, rsync
to Lightsail.

## What is in the repo

| Path                                | Role                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `workers/edge-router/src/router.ts` | The whole routing table as pure functions — no I/O, unit-tested.                    |
| `workers/edge-router/src/index.ts`  | R2 reads, conditional/range handling, edge cache, origin pass-through.              |
| `workers/edge-router/wrangler.toml` | Worker config. Routes are commented out; uncommenting them **is** the cutover.      |
| `tests/edge-router.test.ts`         | The routing table, plus a parity check that reads `lightsail-apache.conf` directly. |
| `tests/edge-worker.test.ts`         | The handler end to end against a fake R2 bucket: statuses, headers, pass-throughs.  |
| `.github/workflows/deploy.yml`      | R2 sync + cache purge steps, both gated on the secrets being present.               |

## Deployment model: both targets, always

Every deploy writes the build to **both** R2 and the Lightsail webroot. That is
not a transitional hedge, it is the design:

- `public/markdown.php` reads the rendered HTML off `/var/www/computerjy_dist`
  on the origin. Content negotiation breaks the moment the origin stops
  receiving the build.
- Rollback is then free. Delete the Worker routes and the origin is already
  serving the current build, with no restore step.

## Step 1 — create the bucket

Cloudflare dashboard → **R2** → **Create bucket**.

- Name: `computerjy-dist` (must match `bucket_name` in `wrangler.toml`)
- Location: Automatic
- **Do not** attach a public custom domain or enable the public
  `r2.dev` URL. The bucket is reached only through the Worker binding; a second
  public hostname serving the same pages would compete with the canonical URLs
  and bypass every header rule below.

No lifecycle rule is needed. The deploy's second sync pass carries `--delete`,
so the bucket holds exactly what the last build produced.

## Step 2 — the R2 object token (used by CI)

R2 → **Manage R2 API Tokens** → **Create API token**.

- Token name: `computerjy-deploy-r2`
- Permissions: **Object Read & Write**
- Specify bucket: `computerjy-dist` — not "all buckets"
- TTL: forever (or your rotation window)

Cloudflare shows three values exactly once:

| Shown as                                                                  | Goes into GitHub as     |
| ------------------------------------------------------------------------- | ----------------------- |
| Access Key ID                                                             | `R2_ACCESS_KEY_ID`      |
| Secret Access Key                                                         | `R2_SECRET_ACCESS_KEY`  |
| The account id in the S3 endpoint `https://<id>.r2.cloudflarestorage.com` | `CLOUDFLARE_ACCOUNT_ID` |

## Step 3 — the cache-purge token (used by CI)

**My Profile → API Tokens → Create Token → Create Custom Token.**

- Token name: `computerjy-deploy-purge`
- Permissions: **Zone → Cache Purge → Purge**
- Zone Resources: **Include → Specific zone → computerjy.com**
- Nothing else. This token cannot read content, edit DNS, or touch Workers.

Copy the token into `CLOUDFLARE_API_TOKEN`. The zone id is on the zone's
**Overview** page, bottom right → `CLOUDFLARE_ZONE_ID`.

## Step 4 — store the secrets

`gh secret set` prompts for the value instead of taking it as an argument, so
none of these land in shell history:

```bash
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set R2_BUCKET               # computerjy-dist
gh secret set R2_ACCESS_KEY_ID
gh secret set R2_SECRET_ACCESS_KEY
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ZONE_ID
gh secret list
```

The R2 sync step turns on once all four of `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_ACCOUNT_ID` and `R2_BUCKET` exist; the purge
step turns on once `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` exist. Both
gates are evaluated in `jobs.build-and-deploy.env`, because the `secrets`
context is not readable from a step-level `if`.

Run the workflow once (`gh workflow run deploy.yml`) and confirm the bucket
fills before going any further. At this point R2 is a mirror that nothing
serves.

## Step 5 — a third token, for deploying the Worker

Wrangler needs more than CI does, which is why it is a **separate token that is
never stored in GitHub** — it lives in your shell for as long as a deploy takes.

**My Profile → API Tokens → Create Custom Token:**

- Account → **Workers Scripts** → Edit
- Account → **Workers R2 Storage** → Edit
- Zone → **Workers Routes** → Edit (zone `computerjy.com`)

```bash
export CLOUDFLARE_ACCOUNT_ID=...          # same value as the GitHub secret
export CLOUDFLARE_API_TOKEN=...           # the wrangler token, not the purge one
cd workers/edge-router
npx wrangler deploy
```

With `workers_dev = false` and the routes still commented out, this publishes a
Worker that receives no traffic at all.

## Step 6 — verify before cutover

`wrangler dev --remote` runs the real Worker against the real bucket on a local
URL, so every rule can be checked without production traffic:

```bash
cd workers/edge-router && npx wrangler dev --remote
```

Against `http://localhost:8787`, each of these must hold:

```bash
# Canonical URL answers 200 with no redirect hop
curl -sI http://localhost:8787/posts/<slug> | head -1

# RFC 9727 linkset content type and CORS
curl -sI http://localhost:8787/.well-known/api-catalog \
  | grep -iE 'content-type|access-control-allow-origin'

# RFC 8288 relations on an HTML page
curl -sI http://localhost:8787/ | grep -i '^link:'

# Immutable chunks
curl -sI http://localhost:8787/_astro/<hashed>.css | grep -i cache-control

# A missing page is a 404, not a 200 or a redirect
curl -sI http://localhost:8787/definitely-not-a-page | head -1

# PHP source is never served as text
curl -s http://localhost:8787/markdown.php | head -3
```

`wrangler dev` cannot reach the Lightsail origin, so the WordPress and markdown
pass-throughs will error locally — that is expected. They are covered by the
unit tests, and re-checked against production in step 8.

## Step 7 — cutover

Uncomment the two `[[routes]]` blocks in `wrangler.toml`, then:

```bash
cd workers/edge-router && npx wrangler deploy
```

The Worker is in front of production the moment that returns.

## Step 8 — verify in production

Re-run every check from step 6 against `https://www.computerjy.com`, plus the
paths that only work with a real origin:

```bash
curl -sI https://www.computerjy.com/wp-json/wp/v2/posts?per_page=1 | head -1
curl -sI https://www.computerjy.com/wp-admin/ | head -1
curl -s -H 'Accept: text/markdown' https://www.computerjy.com/posts/<slug> | head -5
curl -s -H 'Accept: text/markdown' https://www.computerjy.com/auth.md | head -3   # the real file, not the converter
curl -sI https://www.computerjy.com/feed | head -1
curl -sI https://www.computerjy.com/sitemap.xml | head -1
```

Then post a test comment on a live post — that is a `POST` to `/wp-json`, the
one write path a read-only edge would silently break.

## Rollback

Delete the two `[[routes]]` blocks and `npx wrangler deploy`, or remove the
routes in the dashboard under **Workers & Pages → computerjy-edge → Settings →
Domains & Routes**. Traffic returns to Apache immediately, serving the same
build the last deploy rsynced. Nothing needs restoring.

## Parity with `lightsail-apache.conf`

The vhost is the specification; `router.ts` is a port of it, and
`tests/edge-router.test.ts` reads the vhost at test time to assert the `Link`
and security headers still match byte for byte. Everything else is checked by
hand. These are the deliberate differences:

| Behaviour                    | Apache                                   | Worker                                      | Why                                                                         |
| ---------------------------- | ---------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| Sensitive filenames          | `FilesMatch`, final path component only  | Every path segment                          | An object store has no absent directories, so `/.git/config` needs blocking |
| HTML cache                   | No `Cache-Control` at all                | `max-age=0, must-revalidate, s-maxage=3600` | Lets the edge hold pages between deploys; the deploy purges                 |
| `search-index.json`, `*.xml` | 1 day (`application/json`) / unset (xml) | `must-revalidate`                           | A rebuild replaces them in place, and the ⌘K index must not lag the site    |
| `Accept: text/markdown`      | Local `-f` check, then `markdown.php`    | Always forwarded to the origin              | Same outcome — the origin still runs its own `-f` check first               |
| Any `*.php`                  | Executed from the webroot                | Forwarded to the origin                     | Identical outcome, and the bucket can never leak PHP source                 |
| Compression                  | `mod_brotli` / `mod_deflate`             | Cloudflare's edge compression               | Nothing to configure                                                        |
| Immutable `_astro/*`         | 1 year by MIME type                      | 1 year **+ `immutable`**                    | Filenames are content-hashed                                                |

Redirects are unchanged: the Worker adds none, so the apex/www and HTTP/HTTPS
behaviour stays whatever Cloudflare and the port-80 vhost already do.

## Out of scope

Phase 3 of [#24](https://github.com/ComputerJy/computerjy/issues/24) — offloading
`/wp-content/uploads` to a second R2 bucket — is not implemented here. It
changes URLs that are already indexed and baked into 413 published posts, so it
wants its own issue, its own migration of existing media, and its own rollback
plan.
