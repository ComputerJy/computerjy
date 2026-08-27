---
description: Standards and guidelines for Level 5 Agent-Native discovery (RFC 9727, RFC 8288, Auth.md, MCP, A2A, WebMCP, ARD)
always_on: true
---

# AI Agent Discovery & Machine-Readability Standards

## 1. API Discovery & Linkset (RFC 9727 & RFC 8288)
- Serve `/.well-known/api-catalog` with `Content-Type: application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"` and `Access-Control-Allow-Origin: *`.
- Expose machine-readable relations via HTTP `Link` response headers on HTML pages:
  ```http
  Link: </.well-known/api-catalog>; rel="api-catalog", </api/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json;version=3.0", <https://developer.wordpress.org/rest-api/>; rel="service-doc"; type="text/html", </search-index.json>; rel="describedby"; type="application/json", </.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/json"
  ```

## 2. Markdown Content Negotiation
- When requests include `Accept: text/markdown`, return clean semantic Markdown with:
  - `Content-Type: text/markdown; charset=utf-8`
  - `Vary: Accept, Accept-Encoding`
  - `x-markdown-tokens: <token_count>`
- Web server rewrite rules for markdown content negotiation MUST check if the requested file already exists on disk (`RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -f`) before delegating to the HTML-to-markdown converter, preventing shadowing of static files (e.g. `/auth.md`).

## 3. Auth.md & OAuth Discovery (RFC 8414 & RFC 9728)
- Serve `/auth.md` with an H1 heading containing `Auth.md` and clean URLs without trailing markdown ticks.
- In `/.well-known/oauth-authorization-server`, include an `agent_auth` block containing `skill`, `register_uri`, `claim_uri`, `revocation_uri`, `identity_types_supported`, and `credential_types_supported`.
- In `/.well-known/oauth-protected-resource`, declare `resource`, `authorization_servers`, `scopes_supported`, and `bearer_methods_supported: ["header"]`.

## 4. MCP, A2A & Agent Skills Architecture
- **MCP Server Card (SEP-1649)**: Serve at `/.well-known/mcp/server-card.json` declaring `serverInfo`, `endpoint`, and supported capabilities.
- **A2A Protocol**: Serve `/.well-known/agent-card.json` declaring `name`, `version`, `supportedInterfaces`, `capabilities`, and `skills`.
- **Agent Skills (RFC v0.2.0)**: Serve `/.well-known/agent-skills/index.json` with `$schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json"`, skill definitions, and exact `sha256:{hex}` digests.

## 5. WebMCP & ARD Capability Manifest
- **WebMCP**: In the site's layout, register interactive tools for browser agents via `navigator.modelContext?.registerTool()` and `navigator.modelContext?.provideContext()`.
- **ARD (`ai-catalog.json`)**: Serve `/.well-known/ai-catalog.json` with `Content-Type: application/json` and `Access-Control-Allow-Origin: *`, structuring entries with `urn:air:...` identifiers and 2–5 `representativeQueries` for semantic embedding generation.
