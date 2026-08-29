# Recovering the posts' broken images

A record of the content migration performed on 2026-08-29 for issue #14, and of
what the investigation actually found — which differs from what the issue assumed.

## What was wrong

Issue #14 reported two posts with bad image sources. A scan of every `<img>` in
raw post content found 261 references across 55 posts, 184 of them on third-party
hosts. Each external URL was checked twice — the second pass with a browser
User-Agent, a `computerjy.com` referer and a residential IP, so hotlink blocking
could be told apart from an image that is genuinely gone:

| Result                                       | Count |
| -------------------------------------------- | ----- |
| OK                                           | 109   |
| Gone (404)                                   | 26    |
| Blocked (403)                                | 32    |
| Blocked (429, all `images.sixrevisions.com`) | 15    |
| Host unreachable (`spaces.live.com`)         | 2     |

**75 broken, not 2.** The two posts the issue names (`meanwhile-in-china`,
`sunday-sweets-when-geeks-marry`) both still return 200; their URLs merely look
wrong, one containing a pasted `C:\fakepath\` prefix.

## What was done

66 of the 75 were recovered from the Wayback Machine, imported into the media
library, and the post content repointed at the local copy — so the broken inline
`<img>` is fixed, not just the hero. A featured image was set only where the
recovered image is the post's **first** content image, so a mid-post image never
silently becomes the hero.

The database was exported to `/root/pre-rehost-backup.sql` first.

Two things worth knowing if this is ever repeated:

- **Use HTTPS snapshot URLs.** `archive.org/wayback/available` returns `http://`
  URLs, and the origin cannot reach `web.archive.org:80` — every fetch failed with
  a connect timeout. The same snapshots over HTTPS return immediately.
- **archive.org rate-limits the origin.** After roughly 50 downloads it began
  refusing connections. The remainder were fetched from a different machine and
  uploaded, which is faster than waiting the limit out.

## Still broken: 9 images, 3 posts

Not archived anywhere, so they cannot be recovered. They need a replacement image
chosen by hand, or the `<img>` removed:

| Post                  | Images                            |
| --------------------- | --------------------------------- |
| `why-teachers-drink`  | 7 (`bitsandpieces.us`)            |
| `google`              | 1 (`bitsandpieces.us`)            |
| `grandpa-reminiscing` | 1 (`pics.blameitonthevoices.com`) |

## The media count discrepancy is not a defect

`/wp-json/wp/v2/media` reports `X-WP-Total: 264` but serves 262. The two missing
records are attachments 1738 and 5585, both belonging to post 1737 ("If browsers
were celebrities"), which is **private**. The REST API correctly withholds them
from anonymous callers; the count query simply does not apply the same permission
filter.

Nothing to clean up. `fetchByIds` is used for media in `src/lib/wp-client.ts`
precisely because of this, and that remains correct.

## Why the payload fix had to be in the loader

Issue #14 proposes re-setting featured images in WordPress to restore the smaller
thumbnails. That could not have worked: the loader requested only
`id,source_url`, and `source_url` is always the full-size upload, so the build
would have shipped full size regardless.

`media_details` is now requested and `pickHeroImageUrl` selects a derivative — but
note that each size's own `source_url` is a **Jetpack Photon URL** pointing at the
original with a `?fit=` parameter, so `unwrapPhotonUrl` reduces it straight back
to the full-size file and silently undoes the selection. The `file` field is the
only one naming the real derivative. That is the `-WxH` filename the issue believed
had been lost.

Setting featured images is still required, and was done for 14 posts: the loader
only fetches `media_details` for featured media, so a hero derived from post
content can never be resolved to a derivative. Where the stored content referenced
a derivative (`Defrag-300x220.jpg`), `attachment_url_to_postid` cannot resolve it,
so the `-WxH` suffix is stripped before a second lookup.

`facebook-facts` remains unresolved: its image has no attachment record at all.

## Note on the "4.7x payload increase"

The issue treats the pre-migration `facebook-237x300.jpg` (11 KB) as the correct
value and the current `facebook.jpg` (54 KB) as a regression. `facebook.jpg` is
603x763 and its largest derivative is 237x300, so the old site was putting a 237px
image into a 700px slot. That is undersized, not merely smaller, and reproducing
it would trade a visible quality regression for bytes. The picker therefore takes
the smallest derivative that still covers the slot and keeps the original when
none does.
