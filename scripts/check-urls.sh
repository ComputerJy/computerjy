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
#   EDGE=1 scripts/check-urls.sh                            # + Cloudflare cache matrix
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

# check PATH WANT_STATUS_REGEX [WANT_LOCATION] [WANT_CONTENT_TYPE_REGEX_PREFIX] [ACCEPT]
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
    if [ -n "$want_ct" ] && ! [[ "$ct" =~ ^($want_ct) ]]; then echo "FAIL $path -> $ct (want $want_ct)"; return 1; fi
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

# check_edge LABEL PATH WANT_CF_STATUS_REGEX WANT_SMAXAGE(yes|no|-) WANT_CT_PREFIX(or -) [curl args…]
# One row of the Cloudflare cache matrix: cf-cache-status says whether the
# edge served/stored it, the origin's s-maxage says whether it was allowed to.
check_edge() {
    local label="$1" path="$2" want_cf="$3" want_sm="$4" want_ct="$5"
    shift 5
    local hdr cf cc ct
    # shellcheck disable=SC2086
    hdr=$(curl $CURL_BASE -o /dev/null -D - "$@" "$BASE$path" | tr -d '\r')
    cf=$(awk 'tolower($1)=="cf-cache-status:" {print $2; exit}' <<< "$hdr")
    cc=$(awk 'tolower($1)=="cache-control:" {sub(/^[^:]*: */,""); print; exit}' <<< "$hdr")
    ct=$(awk 'tolower($1)=="content-type:" {print $2; exit}' <<< "$hdr")
    if ! [[ "$cf" =~ ^($want_cf)$ ]]; then echo "FAIL edge [$label] $path cf-cache-status '$cf' (want $want_cf)"; return 1; fi
    case "$want_sm" in
        yes) [[ "$cc" == *s-maxage=3600* ]] || { echo "FAIL edge [$label] $path cache-control '$cc' lacks s-maxage=3600"; return 1; } ;;
        no)  [[ "$cc" != *s-maxage* ]] || { echo "FAIL edge [$label] $path cache-control '$cc' must not carry s-maxage"; return 1; } ;;
    esac
    if [ "$want_ct" != "-" ] && [[ "$ct" != "$want_ct"* ]]; then echo "FAIL edge [$label] $path content-type '$ct' (want $want_ct)"; return 1; fi
    echo "ok   edge [$label] $path $cf"
}

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
/.well-known/api-catalog 200 - application/linkset\+json
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
/sitemap.xml 200 - (application|text)/xml
/sitemap-index.xml 200 - (application|text)/xml
/posts/author/computerjy 404
EOF
    else
        cat <<EOF
/posts/1goal/ 301 $CANON/posts/1goal
/rss.xml 301 $CANON/feed
/sitemap.xml 301 $CANON$SITEMAP
/sitemap-index.xml 301 $CANON$SITEMAP
$SITEMAP 200 - (application|text)/xml
/posts/author/computerjy 200 - text/html
/category/entertainment/page/2 200 - text/html
EOF
    fi
}

# ---- Slug list ------------------------------------------------------------
slugs() {
    node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).forEach(s=>console.log(s))' "$ROOT_DIR/scripts/known-slugs.json"
    if [ "${LIVE_SLUGS:-0}" = "1" ]; then
        local page=1 out rc url
        while :; do
            url="/wp-json/wp/v2/posts?per_page=100&page=$page&_fields=slug"
            # A curl failure is reported as a FAIL line (picked out of the slug
            # list by the caller) instead of aborting the run under `set -e`.
            rc=0
            # shellcheck disable=SC2086
            out=$(curl $CURL_BASE "$BASE$url") || rc=$?
            if [ "$rc" -ne 0 ]; then
                echo "FAIL $url curl exit $rc while paging live slugs"
                break
            fi
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

# The Cache Rule "WordPress anonymous HTML" must keep its cookie and
# Accept: text/markdown bypasses (Cloudflare ignores Vary); during #55 it went
# live without them and only a manual curl -I noticed. Live edge only: through
# CONNECT_TO the origin answers directly and there is no cf-cache-status.
if [ "${EDGE:-0}" = "1" ]; then
    if [ -n "${CONNECT_TO:-}" ]; then
        echo "== edge cache: skipped (CONNECT_TO bypasses Cloudflare) =="
    else
        echo "== edge cache (Cloudflare) =="
        STORED='MISS|HIT|EXPIRED|REVALIDATED'
        NOT_STORED='DYNAMIC|BYPASS'
        check_edge 'anonymous HTML, 1st' / "$STORED" yes text/html || fails=$((fails + 1))
        check_edge 'anonymous HTML, 2nd' / HIT yes text/html || fails=$((fails + 1))
        check_edge 'wordpress_logged_in_ cookie' / "$NOT_STORED" no text/html -H 'Cookie: wordpress_logged_in_x=1' || fails=$((fails + 1))
        check_edge 'wp-postpass_ cookie' / "$NOT_STORED" no text/html -H 'Cookie: wp-postpass_x=1' || fails=$((fails + 1))
        check_edge 'comment_author_ cookie' / "$NOT_STORED" no text/html -H 'Cookie: comment_author_x=1' || fails=$((fails + 1))
        check_edge 'Accept: text/markdown' /posts/1goal "$NOT_STORED" - text/markdown -H 'Accept: text/markdown' || fails=$((fails + 1))
        check_edge 'REST' '/wp-json/wp/v2/posts?per_page=1' "$NOT_STORED" no application/json || fails=$((fails + 1))
        check_edge 'theme CSS' /wp-content/themes/computerjy-2/assets/css/theme.css "$STORED" - text/css || fails=$((fails + 1))
        check_edge 'search index' /search-index.json "$STORED" yes application/json || fails=$((fails + 1))
    fi
fi

echo "== every post slug =="
# Collected in temp files rather than `tee /dev/stderr`: re-opening /dev/stderr
# truncates a log the caller redirected 2>&1 into, wiping the sections above.
# slugs() reports a REST paging failure as a "FAIL …" line among the slugs
# (slugs never contain a space), so it is split out and counted here.
slug_list=$(mktemp)
slug_out=$(mktemp)
slugs > "$slug_list"
grep '^FAIL ' "$slug_list" || true
grep -v '^FAIL ' "$slug_list" | sort -u | sed 's#^#/posts/#' | tr '\n' '\0' \
    | xargs -0 -P 8 -I{} bash -c 'check "$1" 200 "" text/html' _ {} > "$slug_out" || true
cat "$slug_out"
slug_fails=$(cat "$slug_list" "$slug_out" | grep -c '^FAIL ' || true)
rm -f "$slug_list" "$slug_out"
fails=$((fails + slug_fails))

echo
if [ "$fails" -eq 0 ]; then echo "ALL CHECKS PASSED"; exit 0; fi
echo "$fails CHECK(S) FAILED"; exit 1
