# Publishing in WordPress triggers a rebuild

The public site is a static Astro build. WordPress is only a content source, read
over the REST API at build time, so **nothing published in WordPress reaches
visitors until a build runs**. This is the link between the two.

```
Publish in WordPress
  → ComputerJy Rebuild Dispatch plugin
  → POST /repos/ComputerJy/computerjy/dispatches  (event_type: wp-content-updated)
  → .github/workflows/deploy.yml
  → build, verify, rsync to the webroot
```

## The token

The plugin authenticates with a GitHub **fine-grained personal access token**:

| Setting               | Value                                              |
| --------------------- | -------------------------------------------------- |
| Repository access     | Only select repositories → `ComputerJy/computerjy` |
| Repository permission | `Contents` → **Read and write**                    |
| Expiration            | set one, and diarise the rotation                  |

`Contents: write` is what the `dispatches` endpoint requires. There is no narrower
permission that can start a workflow.

### It goes in `wp-config.php`, not the database

```php
define( 'COMPUTERJY_GITHUB_DISPATCH_TOKEN', 'github_pat_...' );
```

This host writes WordPress database backups to disk (`/var/www/boldgrid_backup/`).
A token stored as an option would be copied into every one of them, and into any
database export. The constant keeps it in a single root-owned file.

Optionally override the target repository with `COMPUTERJY_GITHUB_DISPATCH_REPO`;
it defaults to `ComputerJy/computerjy`.

**This token is the cost of push-based rebuilds.** It can write to the repository,
and the repository deploys to this same server, so a WordPress compromise escalates
to both. The single-repository scope and the expiry date are what contain it. The
alternative considered was polling the API from CI, which needs no credential at
all but adds latency; push was chosen deliberately.

To rotate: create the replacement, edit the constant, save any published post, and
confirm the status row (below) reports `queued`. Then revoke the old token.

## Installing the plugin

The plugin lives in this repo at `inc/computerjy-rebuild-webhook.php` but is not
part of the theme. Install it as a single-file plugin:

```bash
sudo install -o www-data -g www-data -m 644 \
  inc/computerjy-rebuild-webhook.php \
  /var/www/wordpress/wp-content/plugins/computerjy-rebuild-webhook.php
```

Then activate it in **Plugins**. Updating it later means copying the file again —
it is not managed by the deploy, which only touches the static webroot.

## Debouncing happens in GitHub, not in WordPress

A bulk edit fires the save hooks many times in a few seconds. Two mechanisms
collapse that, at different scales.

**Within one request**, the hooks only record a reason; the single dispatch is sent
on `shutdown`. This is what makes a WP-CLI import correct — the whole import runs
inside one request, so dispatching on the first hook would deploy the state at the
_first_ post and never send another.

**Across requests**, the collapsing is done by the workflow's concurrency group:

```yaml
concurrency:
  group: deploy-production
  cancel-in-progress: false
```

GitHub allows at most one _pending_ run per group, and queueing a new one cancels
the previously pending run. Twenty dispatches therefore produce two deploys: the
one already running, plus one more that sees the final state.

`cancel-in-progress` stays `false` because an interrupted `rsync --delete` would
leave the webroot half-written.

The obvious alternative — `wp_schedule_single_event` a minute out — was rejected
because **WP-Cron is not prompt here**. It fires on page loads, and this install
is headless: visitors go to the static site, so WordPress sees almost no
front-end traffic. Events are therefore driven by
`/etc/cron.d/computerjy-wp-cron` on a 5-minute tick rather than by page loads, so
a scheduled event would land up to five minutes late instead of dispatching
immediately.

## Which changes trigger a deploy

The hook set mirrors exactly what `src/lib/wp-loader.ts` fetches: posts, terms and
featured media. Anything else in WordPress leaves the built site unchanged and
deliberately does not deploy.

| Change                                                         | Hook                                         |
| -------------------------------------------------------------- | -------------------------------------------- |
| Post published, unpublished, edited, trashed, scheduled → live | `transition_post_status`                     |
| Post permanently deleted (bypasses the transition)             | `deleted_post`                               |
| Category or tag created, renamed, re-described, deleted        | `created_term`, `edited_term`, `delete_term` |
| Media file replaced or deleted                                 | `attachment_updated`, `delete_attachment`    |

Term descriptions matter because the build embeds them — term names and
descriptions are rendered on archive pages, so a category rename that touches no
post still changes the site.

**Pages are absent on purpose.** `contact-me` and `privacy-policy` are hand-authored
Astro files; WordPress pages are not fetched by the build.

**Comments are absent on purpose, and deliberately so.** They are not build-time
data: `src/components/Comments.astro` fetches `/wp-json/wp/v2/comments` from the
browser when the comments section scrolls into view, and the Worker caches that
endpoint for 60 seconds at the edge (`workers/edge-router/src/router.ts`). A new
comment therefore needs no rebuild, no rsync, no R2 mirror and no edge purge — it
becomes visible the next time that 60-second cache expires, not on the next deploy.
The plugin used to hook `wp_insert_comment`, `transition_comment_status`,
`edit_comment` and a delete hook to dispatch a rebuild for every comment; all four
are gone as of plugin `Version: 3.0.0`. The insert hook was originally
`comment_post`, which turned out never to fire for a comment submitted over the
REST API — `WP_REST_Comments_Controller::create_item()` calls `wp_insert_comment()`
directly and never calls `wp_new_comment()`, which is what `comment_post` actually
hangs off — so visitor comments went missing until a manual rebuild (#42), and the
hook was swapped to `wp_insert_comment` before this design removed the whole
category. If a comment does not appear, the fault is not here — check the runtime
fetch (browser devtools, the Worker's edge cache) rather than the dispatch log below,
which no longer has anything to do with comments.

## Verifying

Settings → General has a read-only **Static site rebuild** row reporting the target
repository and the outcome of the last dispatch:

```
Last trigger: 2026-08-29 18:42 — post 1458: publish to publish — queued
```

`queued` means GitHub returned 204 and the run has started. Anything else is the
error GitHub gave, which is how a revoked or expired token becomes visible rather
than silently dropping every deploy. The request is blocking (5s timeout) for this
reason.

The Actions run is named after what changed, so the deploy history reads as a
content log:

```
Deploy — post 1458: publish to publish
Deploy — category term 2 changed
```

If the row says `queued` but the site is unchanged, the dispatch worked and the
problem is in the build — check the deploy run, which gates the rsync behind
`npm run verify:build` and publishes nothing on failure.
