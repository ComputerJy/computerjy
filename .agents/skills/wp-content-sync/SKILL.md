---
name: wp-content-sync
description: >-
  Use this skill when synchronizing WordPress content, categories, tags, or regenerating static JSON datasets and search indices.
---

# WordPress Content Synchronization

This skill guides the synchronization of posts, categories, tags, and comments between the WordPress backend and the Astro static site.

## Data Flow Architecture

- In development/production, `src/lib/api.ts` loads static JSON datasets (`src/data/*.json`) rather than directly hitting the network on every route render.
- The file `public/data/posts.json` is served statically to clients and must remain byte-identical to `src/data/posts.json`.

## Steps to Synchronize Content

### 1. Parse WordPress XML Export

If a new WordPress XML export file (e.g. `export.xml`) is obtained from `/wp-admin/export.php`:

```bash
python3 scripts/parse_wp_export.py path/to/export.xml src/data
```

### 2. Synchronize Public Data Replica

Copy the updated `posts.json` to the public assets directory:

```bash
cp src/data/posts.json public/data/posts.json
```

### 3. Verify Static Regeneration

Rebuild the site and verify search index and RSS generation:

```bash
npm run build
npm run verify:build
```

### 4. Important Considerations

- **URL Rewrites**: Ensure `http://` image and link references in post content are rewritten to `https://` to prevent mixed-content warnings.
- **Pagination Sync**: Bento slots consume posts 0–3, and paginated feeds consume 12 posts per page. Keep `src/pages/index.astro` and `src/pages/page/[page].astro` synchronized if altering pagination offsets.
