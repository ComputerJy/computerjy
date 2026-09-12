<?php
/**
 * Plugin Name: ComputerJy Edge Cache
 * Description: Purges the Cloudflare cache when published content changes. Pairs with the s-maxage header Apache sets on anonymous HTML.
 * Version: 1.0.0
 * Author: Eyad Salah
 * Requires PHP: 8.0
 *
 * WordPress renders the public site and Cloudflare holds anonymous HTML for an
 * hour (deploy/lightsail-apache.conf sets `s-maxage=3600`). This plugin is the
 * other half: when something a visitor can see changes, purge the zone once,
 * at shutdown, so a bulk edit costs one purge rather than twenty.
 *
 * Secrets are wp-config.php constants, not options — the database is backed up
 * to disk on this host and a purge token must not travel with it:
 *
 *   define( 'COMPUTERJY_CF_ZONE_ID', '...' );
 *   define( 'COMPUTERJY_CF_PURGE_TOKEN', '...' ); // API token scoped to Zone → Cache Purge → Purge
 *
 * Manual purge:  sudo -u www-data wp eval 'computerjy_edge_cache_purge();'
 *
 * @package computerjy
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * True when both constants are configured.
 *
 * @return bool
 */
function computerjy_edge_cache_configured() {
    return defined( 'COMPUTERJY_CF_ZONE_ID' ) && '' !== trim( (string) constant( 'COMPUTERJY_CF_ZONE_ID' ) )
        && defined( 'COMPUTERJY_CF_PURGE_TOKEN' ) && '' !== trim( (string) constant( 'COMPUTERJY_CF_PURGE_TOKEN' ) );
}

/**
 * Arrange exactly one purge for this request, at shutdown.
 */
function computerjy_edge_cache_schedule_purge() {
    static $armed = false;
    if ( $armed || ! computerjy_edge_cache_configured() ) {
        return;
    }
    $armed = true;
    add_action( 'shutdown', 'computerjy_edge_cache_purge' );
}

/**
 * Purge everything in the zone.
 *
 * `purge_everything` rather than per-URL: a publish changes the homepage, the
 * feed, every archive it appears in, the search index and the related-posts
 * blocks of other articles. Enumerating that is the static build's job, and
 * the static build is gone.
 *
 * @return bool True on success.
 */
function computerjy_edge_cache_purge() {
    if ( ! computerjy_edge_cache_configured() ) {
        return false;
    }

    $response = wp_remote_post(
        'https://api.cloudflare.com/client/v4/zones/' . rawurlencode( constant( 'COMPUTERJY_CF_ZONE_ID' ) ) . '/purge_cache',
        array(
            'timeout' => 10,
            'headers' => array(
                'Authorization' => 'Bearer ' . trim( (string) constant( 'COMPUTERJY_CF_PURGE_TOKEN' ) ),
                'Content-Type'  => 'application/json',
            ),
            'body'    => wp_json_encode( array( 'purge_everything' => true ) ),
        )
    );

    if ( is_wp_error( $response ) ) {
        error_log( 'computerjy-edge-cache: purge failed: ' . $response->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
        return false;
    }
    if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
        error_log( 'computerjy-edge-cache: purge returned ' . wp_remote_retrieve_response_code( $response ) . ': ' . substr( (string) wp_remote_retrieve_body( $response ), 0, 200 ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
        return false;
    }
    return true;
}

/**
 * A post entering or leaving `publish` changes what visitors see.
 *
 * @param string  $new_status New status.
 * @param string  $old_status Old status.
 * @param WP_Post $post       Post.
 */
function computerjy_edge_cache_on_post_status( $new_status, $old_status, $post ) {
    if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
        return;
    }
    if ( ! is_post_type_viewable( $post->post_type ) ) {
        return;
    }
    computerjy_edge_cache_schedule_purge();
}
add_action( 'transition_post_status', 'computerjy_edge_cache_on_post_status', 10, 3 );

/**
 * Approved comments render on the post page.
 *
 * @param int        $id      Comment ID.
 * @param WP_Comment $comment Comment.
 */
function computerjy_edge_cache_on_comment( $id, $comment ) {
    if ( '1' === (string) $comment->comment_approved ) {
        computerjy_edge_cache_schedule_purge();
    }
}
add_action( 'wp_insert_comment', 'computerjy_edge_cache_on_comment', 10, 2 );
add_action( 'transition_comment_status', 'computerjy_edge_cache_schedule_purge' );

// Taxonomy names, customizer settings (brand, sponsor slots, GA id) and the theme itself.
add_action( 'edited_term', 'computerjy_edge_cache_schedule_purge' );
add_action( 'delete_term', 'computerjy_edge_cache_schedule_purge' );
add_action( 'customize_save_after', 'computerjy_edge_cache_schedule_purge' );
add_action( 'switch_theme', 'computerjy_edge_cache_schedule_purge' );
add_action( 'wp_update_nav_menu', 'computerjy_edge_cache_schedule_purge' );
