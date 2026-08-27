# Auth.md

ComputerJy World provides public read access to articles, categories, comments, and search index APIs.

## Agent Audience

This service is designed for autonomous AI agents, crawlers, and developer integrations searching and indexing tech blog articles.

## Registration Endpoints

- **Registration URI**: https://www.computerjy.com/oauth/register
- **Claim URI**: https://www.computerjy.com/oauth/claim
- **Revocation URI**: https://www.computerjy.com/oauth/revoke

## Supported Authentication Methods

### 1. Anonymous Agent Token
- **Identity Type**: anonymous
- **Credential Type**: bearer_token
- **Claim URL**: https://www.computerjy.com/oauth/claim

### 2. Identity Assertion (ID-JAG / Verified Email)
- **Identity Type**: identity_assertion
- **Assertion Types**: verified_email, urn:ietf:params:oauth:token-type:id-jag
- **Credential Type**: bearer_token
- **Revocation URL**: https://www.computerjy.com/oauth/revoke

### 3. OpenID Connect / OAuth 2.0 Discovery
- **Issuer**: https://www.computerjy.com
- **Discovery**: https://www.computerjy.com/.well-known/openid-configuration
- **OAuth Authorization Server**: https://www.computerjy.com/.well-known/oauth-authorization-server
- **OAuth Protected Resource**: https://www.computerjy.com/.well-known/oauth-protected-resource
- **Authorization Endpoint**: https://www.computerjy.com/oauth/authorize
- **Token Endpoint**: https://www.computerjy.com/oauth/token

### 4. WordPress Application Passwords
- **Header**: Authorization: Basic <base64(username:application_password)>
- **Scope**: WordPress REST API (https://www.computerjy.com/wp-json/wp/v2/)
