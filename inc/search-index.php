<?php
/**
 * /search-index.json — the client-side search dataset.
 *
 * The Astro build generated this file (src/pages/search-index.json.ts) and the
 * discovery layer still advertises it: the HTTP Link header (rel="describedby"),
 * public/openapi.json, .well-known/api-catalog and the search-articles agent
 * skill. Same shape as before, plus `url`, so every existing consumer keeps
 * working and the ⌘K modal can link without knowing the permalink structure.
 *
 * Cached in a `cjy2_` transient, which computerjy2_flush_caches() in related.php
 * already clears on publish and comment.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Register the pretty URL.
 */
function computerjy2_search_index_rewrite() {
    add_rewrite_rule( '^search-index\.json$', 'index.php?computerjy2_search_index=1', 'top' );
}
add_action( 'init', 'computerjy2_search_index_rewrite' );

/**
 * Whitelist the query var the rewrite above sets, or parse_request drops it.
 *
 * @param string[] $vars Public query vars.
 * @return string[]
 */
function computerjy2_search_index_query_vars( $vars ) {
    $vars[] = 'computerjy2_search_index';
    return $vars;
}
add_filter( 'query_vars', 'computerjy2_search_index_query_vars' );

/**
 * Flush rewrite rules once, when the theme is activated, so the rule above exists.
 */
function computerjy2_search_index_activate() {
    computerjy2_search_index_rewrite();
    flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'computerjy2_search_index_activate' );

/**
 * One index entry, in the shape the Astro endpoint emitted.
 *
 * @param WP_Post $post Published post.
 * @return array
 */
function computerjy2_search_index_entry( WP_Post $post ) {
    $categories = get_the_category( $post->ID );
    $category   = empty( $categories ) ? 'Tech' : $categories[0]->name;
    $excerpt    = wp_strip_all_tags( get_the_excerpt( $post ) );

    return array(
        'id'       => (int) $post->ID,
        'title'    => html_entity_decode( wp_strip_all_tags( get_the_title( $post ) ), ENT_QUOTES, 'UTF-8' ),
        'slug'     => $post->post_name,
        'url'      => get_permalink( $post ),
        'date'     => get_the_date( 'd/m/Y', $post ), // en-GB toLocaleDateString, as before.
        'category' => html_entity_decode( $category, ENT_QUOTES, 'UTF-8' ),
        'excerpt'  => mb_substr( html_entity_decode( $excerpt, ENT_QUOTES, 'UTF-8' ), 0, 120 ),
    );
}

/**
 * The whole index, newest first, from the transient when warm.
 *
 * @return array
 */
function computerjy2_search_index_data() {
    $cached = get_transient( 'cjy2_search_index' );
    if ( false !== $cached ) {
        return $cached;
    }

    $posts = get_posts( array(
        'post_type'              => 'post',
        'post_status'            => 'publish',
        'numberposts'            => -1,
        'orderby'                => 'date',
        'order'                  => 'DESC',
        'no_found_rows'          => true,
        'update_post_meta_cache' => false,
    ) );

    $data = array_map( 'computerjy2_search_index_entry', $posts );
    set_transient( 'cjy2_search_index', $data, 12 * HOUR_IN_SECONDS );
    return $data;
}

/**
 * Answer the request before the main query runs.
 *
 * @param WP $wp Current request.
 */
function computerjy2_search_index_serve( $wp ) {
    if ( empty( $wp->query_vars['computerjy2_search_index'] ) ) {
        return;
    }

    // Keep page-cache plugins (W3TC) from storing this JSON as an HTML page.
    if ( ! defined( 'DONOTCACHEPAGE' ) ) {
        define( 'DONOTCACHEPAGE', true ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- cache-plugin convention.
    }

    status_header( 200 );
    header( 'Content-Type: application/json; charset=utf-8' );
    header( 'Cache-Control: public, max-age=0, must-revalidate, s-maxage=3600' );
    header( 'Access-Control-Allow-Origin: *' );
    echo wp_json_encode( computerjy2_search_index_data() );
    exit;
}
add_action( 'parse_request', 'computerjy2_search_index_serve' );

/**
 * Drop the cached index whenever computerjy2_flush_caches() would — but through
 * the transient API, so it also works when transients live in an object cache.
 */
function computerjy2_search_index_flush() {
    delete_transient( 'cjy2_search_index' );
}
add_action( 'save_post', 'computerjy2_search_index_flush' );
add_action( 'wp_insert_comment', 'computerjy2_search_index_flush' );
add_action( 'switch_theme', 'computerjy2_search_index_flush' );
