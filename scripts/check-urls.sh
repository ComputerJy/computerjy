#!/usr/bin/env bash
# ==============================================================================
# URL parity check for www.computerjy.com.
#
# Every URL the site has ever published must answer the way it did before the
# WordPress cutover. Run it against the live edge, or against the origin through
# an SSH tunnel (see MIGRATION plan, Task 10):
#
#   scripts/check-urls.sh                                   # live, wordpress mode
#   MODE=astro scripts/check-urls.sh                        # baseline before cutover
#   CONNECT_TO=www.computerjy.com:443:127.0.0.1:8443 scripts/check-urls.sh
#   LIVE_SLUGS=1 scripts/check-urls.sh                      # + every slug from REST
#   scripts/check-urls.sh --print-urls                      # list checks, no network
#
# Exit 0 when every check passes.
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="${1:-https://www.computerjy.com}"
case "$BASE" in --print-urls) PRINT_ONLY=1; BASE="https://www.computerjy.com";; *) PRINT_ONLY=0;; esac
MODE="${MODE:-wordpress}"
SITEMAP="${SITEMAP:-/sitemap_index.xml}"
CANON="https://www.computerjy.com"

CURL_BASE="-s --max-time 30 -A computerjy-cutover-check"
if [ -n "${CONNECT_TO:-}" ]; then CURL_BASE="$CURL_BASE --connect-to $CONNECT_TO"; fi
CURL_OPTS="$CURL_BASE -o /dev/null"
export BASE CURL_OPTS CURL_BASE

# check PATH WANT_STATUS_REGEX [WANT_LOCATION] [WANT_CONTENT_TYPE_PREFIX] [ACCEPT]
check() {
    local path="$1" want="$2" want_loc="${3:-}" want_ct="${4:-}" accept="${5:-}"
    local out code loc ct
    # shellcheck disable=SC2086
    # Field separator is \x1f (unit separator), not a tab: bash's IFS word
    # splitting treats tab/space/newline as collapsible whitespace even when
    # IFS is set to just one of them, so an empty redirect_url field (the
    # common case — most checks aren't redirects) would shift ct into loc's
    # slot and loc into ct's.
    out=$(curl $CURL_OPTS ${accept:+-H "Accept: $accept"} -w $'%{http_code}\x1f%{redirect_url}\x1f%{content_type}' "$BASE$path")
    IFS=$'\x1f' read -r code loc ct <<< "$out"
    if ! [[ "$code" =~ ^($want)$ ]]; then echo "FAIL $path -> $code (want $want)"; return 1; fi
    if [ -n "$want_loc" ] && [ "$loc" != "$want_loc" ]; then echo "FAIL $path -> $loc (want $want_loc)"; return 1; fi
    if [ -n "$want_ct" ] && [[ "$ct" != "$want_ct"* ]]; then echo "FAIL $path -> $ct (want $want_ct)"; return 1; fi
    echo "ok   $path $code"
}
export -f check

# check_header PATH HEADER_NAME SUBSTRING
check_header() {
    local path="$1" name="$2" sub="$3" val
    # shellcheck disable=SC2086
    val=$(curl $CURL_OPTS -D - "$BASE$path" | tr -d '\r' | awk -v n="$name" 'tolower($1)==tolower(n":") {sub(/^[^:]*: */,""); print; exit}')
    if [[ "$val" != *"$sub"* ]]; then echo "FAIL $path header $name: '$val' lacks '$sub'"; return 1; fi
    echo "ok   $path $name"
}
export -f check_header

# check_markdown PATH — Accept: text/markdown must yield markdown with the token header
check_markdown() {
    local path="$1" hdr body
    # shellcheck disable=SC2086
    hdr=$(curl $CURL_BASE -o /dev/null -D - -H 'Accept: text/markdown' "$BASE$path" | tr -d '\r')
    # shellcheck disable=SC2086
    body=$(curl $CURL_BASE -H 'Accept: text/markdown' "$BASE$path" | head -c 2)
    if ! grep -qi '^content-type: text/markdown' <<< "$hdr"; then echo "FAIL $path markdown content-type"; return 1; fi
    if ! grep -qi '^x-markdown-tokens:' <<< "$hdr"; then echo "FAIL $path missing x-markdown-tokens"; return 1; fi
    if [ "$body" != "# " ]; then echo "FAIL $path markdown body does not start with '# '"; return 1; fi
    echo "ok   $path markdown"
}
export -f check_markdown

# ---- Fixed URL table: PATH STATUS [LOCATION] [CONTENT-TYPE] ----------------
fixed() {
    cat <<EOF
/ 200 - text/html
/page/2 200 - text/html
/category/entertainment 200 - text/html
/category/g33ky 200 - text/html
/tag/linux 200 - text/html
/contact-me 200 - text/html
/privacy-policy 200 - text/html
/posts/1goal 200 - text/html
/2008/01/1goal 301 $CANON/posts/1goal
/feed 200 - application/
/feed/ 200|301
/robots.txt 200 - text/plain
/security.txt 200 - text/plain
/.well-known/security.txt 200 - text/plain
/auth.md 200 - text/markdown
/.well-known/api-catalog 200 - application/linkset+json
/.well-known/openid-configuration 200 - application/json
/.well-known/oauth-authorization-server 200 - application/json
/.well-known/oauth-protected-resource 200 - application/json
/.well-known/ai-catalog.json 200 - application/json
/.well-known/agent-card.json 200 - application/json
/api/openapi.json 200 - application/json
/search-index.json 200 - application/json
/wp-json/wp/v2/posts?per_page=1 200 - application/json
/this-url-never-existed-$RANDOM 404
EOF
    if [ "$MODE" = "astro" ]; then
        cat <<EOF
/posts/1goal/ 200 - text/html
/rss.xml 200 - application/
/sitemap.xml 200 - application/xml
/sitemap-index.xml 200 - application/xml
/posts/author/computerjy 404
EOF
    else
        cat <<EOF
/posts/1goal/ 301 $CANON/posts/1goal
/rss.xml 301 $CANON/feed
/sitemap.xml 301 $CANON$SITEMAP
/sitemap-index.xml 301 $CANON$SITEMAP
$SITEMAP 200 - application/xml
/posts/author/computerjy 200 - text/html
/category/entertainment/page/2 200 - text/html
EOF
    fi
}

# ---- Slug list ------------------------------------------------------------
slugs() {
    node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).forEach(s=>console.log(s))' "$ROOT_DIR/scripts/known-slugs.json"
    if [ "${LIVE_SLUGS:-0}" = "1" ]; then
        local page=1 out
        while :; do
            # shellcheck disable=SC2086
            out=$(curl $CURL_BASE "$BASE/wp-json/wp/v2/posts?per_page=100&page=$page&_fields=slug")
            # An empty page ("[]") means we're done; past the last page the REST
            # API answers with a 400 error object instead, so stop on anything
            # that isn't a JSON array too (otherwise this loops forever).
            case "$out" in
                '[]') break ;;
                '['*) ;;
                *)
                    if [ -z "$out" ]; then
                        echo "WARN: REST page $page returned no body; live slug list may be truncated" >&2
                    fi
                    break
                    ;;
            esac
            node -e 'JSON.parse(process.argv[1]).forEach(p=>console.log(p.slug))' "$out"
            page=$((page + 1))
        done
    fi
}

if [ "$PRINT_ONLY" = "1" ]; then
    fixed | awk '{printf "%s %s", $1, $2; if ($3 != "" && $3 != "-") printf " %s", $3; print ""}'
    slugs | sort -u | sed 's#^#/posts/#'
    exit 0
fi

fails=0

echo "== fixed URLs ($MODE mode) =="
while read -r path status loc ct; do
    [ "$loc" = "-" ] && loc=""
    check "$path" "$status" "$loc" "$ct" || fails=$((fails + 1))
done < <(fixed)

echo "== headers =="
check_header / Link 'rel="api-catalog"' || fails=$((fails + 1))
check_header / Link '</search-index.json>; rel="describedby"' || fails=$((fails + 1))
check_header /.well-known/api-catalog Access-Control-Allow-Origin '*' || fails=$((fails + 1))

echo "== markdown negotiation =="
check_markdown / || fails=$((fails + 1))
check_markdown /posts/1goal || fails=$((fails + 1))

echo "== every post slug =="
slug_fails=$(slugs | sort -u | sed 's#^#/posts/#' \
    | xargs -P 8 -I{} bash -c 'check "$1" 200 "" text/html' _ {} \
    | tee /dev/stderr | grep -c '^FAIL' || true)
fails=$((fails + slug_fails))

echo
if [ "$fails" -eq 0 ]; then echo "ALL CHECKS PASSED"; exit 0; fi
echo "$fails CHECK(S) FAILED"; exit 1
