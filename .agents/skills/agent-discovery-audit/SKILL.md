---
name: agent-discovery-audit
description: >-
  Use this skill when auditing, testing, or updating agent-native discovery endpoints, RFC 9727/8288/8414 metadata, WebMCP tools, or markdown conversion routes.
---

# Agent-Native Discovery & WebMCP Audit

This skill guides verification and maintenance of agent discovery protocols and endpoints across the site.

## Standardized Discovery Endpoints

Verify that all agent discovery endpoints are present and valid in `public/`:

- `public/.well-known/agent-card.json` (A2A Agent Card)
- `public/.well-known/ai-catalog.json` (RFC 9727 AI Catalog)
- `public/.well-known/api-catalog` (RFC 8288 Link-Format API Catalog)
- `public/.well-known/mcp/server-card.json` (MCP Server Card)
- `public/.well-known/agent-skills/index.json` (Agent Skills Index)
- `public/.well-known/oauth-authorization-server` & `openid-configuration`
- `public/api/openapi.json` (OpenAPI 3.1.0 Specification)
- `public/markdown.php` (Dynamic HTML-to-Markdown endpoint)

## Verification Checklist

1. **JSON Validity**:
   Ensure all JSON discovery documents in `public/.well-known/` and `public/api/` are valid JSON:

   ```bash
   node -e '
     const fs = require("fs");
     const files = [
       "public/.well-known/agent-card.json",
       "public/.well-known/ai-catalog.json",
       "public/.well-known/mcp/server-card.json",
       "public/.well-known/agent-skills/index.json",
       "public/api/openapi.json"
     ];
     files.forEach(f => { JSON.parse(fs.readFileSync(f, "utf8")); console.log("✓", f); });
   '
   ```

2. **Web Server Headers & Rewrites**:
   Check `deploy/lightsail-apache.conf` (the only web server config; the origin runs Apache) to confirm:
   - `Link` headers pointing to discovery endpoints.
   - `Accept: text/markdown` negotiation routes to `public/markdown.php`.
   - Content-Type headers for well-known JSON files.

3. **WebMCP Registration**:
   Verify that tool definitions in `src/layouts/BaseLayout.astro` (`navigator.modelContext` / `window.modelContext`) match the published tool schemas.
