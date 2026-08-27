# Auth.md

ComputerJy World provides public read access to articles, categories, comments, and search index APIs.

## Authentication Overview

Protected endpoints (such as content management or authenticated actions) support standard token and basic authentication.

## Authentication Mechanisms

### 1. OpenID Connect / OAuth 2.0
- **Issuer**: `https://www.computerjy.com`
- **Discovery**: `https://www.computerjy.com/.well-known/openid-configuration`
- **OAuth Authorization Server**: `https://www.computerjy.com/.well-known/oauth-authorization-server`
- **Protected Resource**: `https://www.computerjy.com/.well-known/oauth-protected-resource`
- **Authorization Endpoint**: `https://www.computerjy.com/oauth/authorize`
- **Token Endpoint**: `https://www.computerjy.com/oauth/token`

### 2. WordPress Application Passwords
- **Header**: `Authorization: Basic <base64(username:application_password)>`
- **Scope**: WordPress REST API (`/wp-json/wp/v2/`)
