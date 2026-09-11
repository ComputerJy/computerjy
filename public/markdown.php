<?php
/**
 * Markdown for Agents — RFC content-negotiation handler.
 *
 * Apache rewrites any request carrying `Accept: text/markdown` here after
 * confirming no real file matches (deploy/lightsail-apache.conf). Content
 * comes straight from WordPress, so the handler works from either the
 * WordPress DocumentRoot or the retired Astro build, and never lags a publish.
 *
 * Contract: .agents/rules/ai-agent-discovery.md §2 — text/markdown,
 * x-markdown-tokens, clean semantic Markdown.
 */

/**
 * Very small HTML → Markdown conversion for post bodies.
 *
 * @param string $html Rendered post HTML.
 * @return string
 */
function computerjy_html_to_markdown( $html ) {
    if ( empty( $html ) ) {
        return '';
    }

    // Embedded scripts and styles are not prose; drop them before the tag pass.
    $html = preg_replace( '/<(script|style)\b[^>]*>.*?<\/\1>/si', '', $html );

    $md = preg_replace( '/<h1[^>]*>(.*?)<\/h1>/si', "\n# $1\n\n", $html );
    $md = preg_replace( '/<h2[^>]*>(.*?)<\/h2>/si', "\n## $1\n\n", $md );
    $md = preg_replace( '/<h3[^>]*>(.*?)<\/h3>/si', "\n### $1\n\n", $md );
    $md = preg_replace( '/<h4[^>]*>(.*?)<\/h4>/si', "\n#### $1\n\n", $md );

    $md = preg_replace( '/<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/si', '[$2]($1)', $md );

    $md = preg_replace( '/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/si', "\n```\n$1\n```\n\n", $md );
    $md = preg_replace( '/<code[^>]*>(.*?)<\/code>/si', '`$1`', $md );

    $md = preg_replace( '/<blockquote[^>]*>(.*?)<\/blockquote>/si', "\n> $1\n\n", $md );

    $md = preg_replace( '/<li[^>]*>(.*?)<\/li>/si', "- $1\n", $md );
    $md = preg_replace( '/<p[^>]*>(.*?)<\/p>/si', "$1\n\n", $md );
    $md = preg_replace( '/<br\s*\/?>/si', "\n", $md );
    $md = preg_replace( '/<hr\s*\/?>/si', "\n---\n\n", $md );

    $md = strip_tags( $md );
    $md = html_entity_decode( $md, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
    $md = preg_replace( "/\n{3,}/", "\n\n", $md );

    return trim( $md );
}

/**
 * Rough token estimate for the x-markdown-tokens header.
 *
 * Counts whitespace-delimited runs with the /u flag so Arabic and other
 * non-Latin text count too — str_word_count() only sees Latin letters.
 *
 * @param string $output Markdown document.
 * @return int
 */
function computerjy_markdown_token_estimate( $output ) {
    $words = preg_match_all( '/\S+/u', $output );
    return (int) ceil( ( false === $words ? 0 : $words ) * 1.33 );
}

/**
 * Send the document with the token estimate the contract requires.
 *
 * @param string $output Markdown.
 */
function computerjy_markdown_emit( $output ) {
    header( 'x-markdown-tokens: ' . computerjy_markdown_token_estimate( $output ) );
    echo $output;
    exit;
}

// The converter is unit-tested from the CLI; nothing below runs there.
if ( PHP_SAPI === 'cli' ) {
    return;
}

header( 'Content-Type: text/markdown; charset=utf-8' );
header( 'Vary: Accept, Accept-Encoding' );
header( 'Access-Control-Allow-Origin: *' );

$uri = parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH );
$uri = rtrim( (string) $uri, '/' ) ?: '/';

// 0. Static markdown documents live next to this file.
if ( '/auth.md' === $uri || '/.well-known/auth.md' === $uri ) {
    $auth_file = __DIR__ . '/auth.md';
    if ( file_exists( $auth_file ) ) {
        readfile( $auth_file );
        exit;
    }
}

// W3TC must not store this response under the HTML page's cache key.
define( 'DONOTCACHEPAGE', true );
define( 'WP_USE_THEMES', false );

// W3TC's advanced-cache.php keys its page cache on REQUEST_URI and ignores
// Accept. Re-key this request so a cached HTML page for the same URL is never
// served (or stored) as markdown. Nothing below needs the original value.
$_SERVER['REQUEST_URI'] = '/markdown.php';

$wp_load = file_exists( __DIR__ . '/wp-load.php' ) ? __DIR__ . '/wp-load.php' : '/var/www/wordpress/wp-load.php';
require $wp_load;

// The theme injects a sponsor container into the_content; agents do not want it.
remove_filter( 'the_content', 'computerjy2_inject_inarticle_slot', 20 );

$site_name = get_bloginfo( 'name' );
$home      = home_url( '/' );

// 1. Single post: /posts/<slug>
if ( preg_match( '#^/posts/([^/]+)$#', $uri, $m ) ) {
    // get_page_by_path() with a single post type silently adds 'attachment'
    // and resolves by iterating post IDs, so an older attachment sharing the
    // slug can win over the actual post. get_posts() with an explicit
    // post_status also lets us require 'publish' in the query itself, rather
    // than fetching a post of unknown status and checking it after the fact.
    $found = get_posts( array(
        'name'                   => urldecode( $m[1] ),
        'post_type'              => 'post',
        'post_status'            => 'publish',
        'numberposts'            => 1,
        'no_found_rows'          => true,
        'update_post_meta_cache' => false,
    ) );
    $post = $found ? $found[0] : null;

    // Password-protected posts must not have their content rendered here;
    // post_password_required() needs the global $post, which setup_postdata()
    // below provides for the_content filters too (e.g. shortcodes reading
    // $post->ID).
    if ( $post && empty( $post->post_password ) ) {
        $GLOBALS['post'] = $post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
        setup_postdata( $post );

        $title      = html_entity_decode( wp_strip_all_tags( get_the_title( $post ) ), ENT_QUOTES, 'UTF-8' );
        $date       = get_the_date( 'F j, Y', $post );
        $categories = get_the_category( $post->ID );
        $category   = empty( $categories ) ? 'Tech' : $categories[0]->name;
        $author     = get_the_author_meta( 'display_name', $post->post_author );
        $content    = computerjy_html_to_markdown( apply_filters( 'the_content', $post->post_content ) );

        $output  = "# {$title}\n\n";
        $output .= "*Published: {$date} | Category: {$category} | Author: {$author}*\n";
        $output .= '*URL: ' . get_permalink( $post ) . "*\n\n";
        $output .= "---\n\n";
        $output .= $content . "\n\n";
        $output .= "---\n";
        $output .= "*{$site_name} — {$home}*\n";

        wp_reset_postdata();

        computerjy_markdown_emit( $output );
    }
}

// 2. Everything else: the site summary with the latest articles.
$output  = "# {$site_name}\n\n";
$output .= '> ' . get_bloginfo( 'description' ) . "\n\n";
$output .= "Website: {$home}\n";
$output .= "API Catalog: {$home}.well-known/api-catalog\n";
$output .= "OpenAPI Spec: {$home}api/openapi.json\n";
$output .= "Auth.md: {$home}auth.md\n\n";
$output .= "## Articles & Archives\n\n";

$recent = get_posts( array(
    'post_type'              => 'post',
    'post_status'            => 'publish',
    'numberposts'            => 30,
    'no_found_rows'          => true,
    'update_post_meta_cache' => false,
) );

foreach ( $recent as $p ) {
    $title      = html_entity_decode( wp_strip_all_tags( get_the_title( $p ) ), ENT_QUOTES, 'UTF-8' );
    $date       = get_the_date( 'Y-m-d', $p );
    $categories = get_the_category( $p->ID );
    $category   = empty( $categories ) ? 'Tech' : $categories[0]->name;
    $excerpt    = trim( wp_strip_all_tags( get_the_excerpt( $p ) ) );

    $output .= '- **[' . $title . '](' . get_permalink( $p ) . ")** ({$date} in *{$category}*)\n";
    if ( '' !== $excerpt ) {
        $output .= "  > {$excerpt}\n\n";
    }
}

$output .= "\n---\n";
$output .= "*For the full search index of every article, see: {$home}search-index.json*\n";

computerjy_markdown_emit( $output );
