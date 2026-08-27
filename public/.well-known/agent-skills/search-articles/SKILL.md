---
name: search-articles
description: Search and retrieve historical tech articles, tips, and blog posts from ComputerJy World.
---

# Search Articles Skill

Retrieve published articles and tech guides from ComputerJy World.

## How to use

1. Download the full static search dataset: `GET https://www.computerjy.com/search-index.json`
2. Or query articles via WordPress REST API: `GET https://www.computerjy.com/wp-json/wp/v2/posts?search={query}`
3. Retrieve clean markdown for any article by setting header `Accept: text/markdown`: `GET https://www.computerjy.com/posts/{slug}/`
