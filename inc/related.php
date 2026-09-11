<?php
/**
 * Related posts, trending list, and the transient caching behind both.
 *
 * Both queries are cached in transients so a page cache plugin (or a cold cache)
 * never pays for them twice; publishing or commenting clears the relevant key.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Related posts by shared category/tag, newest first.
 */
function computerjy2_related_posts( $post_id = null, $count = 3 ) {
    $post_id = $post_id ? $post_id : get_the_ID();
    $key     = 'cjy2_related_' . $post_id . '_' . $count;
    $cached  = get_transient( $key );
    if ( false !== $cached ) {
        return new WP_Query( array( 'post__in' => $cached ? $cached : array( 0 ), 'orderby' => 'post__in', 'ignore_sticky_posts' => true, 'posts_per_page' => $count ) );
    }

    $tags = wp_get_post_terms( $post_id, 'post_tag', array( 'fields' => 'ids' ) );
    $cats = wp_get_post_terms( $post_id, 'category', array( 'fields' => 'ids' ) );

    $tax_query = array( 'relation' => 'OR' );
    if ( $tags ) { $tax_query[] = array( 'taxonomy' => 'post_tag', 'field' => 'term_id', 'terms' => $tags ); }
    if ( $cats ) { $tax_query[] = array( 'taxonomy' => 'category', 'field' => 'term_id', 'terms' => $cats ); }

    $query = new WP_Query( array(
        'post__not_in'        => array( $post_id ),
        'posts_per_page'      => $count,
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
        'tax_query'           => count( $tax_query ) > 1 ? $tax_query : array(), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
    ) );

    set_transient( $key, wp_list_pluck( $query->posts, 'ID' ), 12 * HOUR_IN_SECONDS );
    return $query;
}

/**
 * Trending: most-commented in the last 90 days, falling back to recent posts.
 */
function computerjy2_trending_posts( $count = 5 ) {
    $key    = 'cjy2_trending_' . $count;
    $cached = get_transient( $key );
    if ( false !== $cached && ! empty( $cached ) ) {
        return new WP_Query( array( 'post__in' => $cached, 'orderby' => 'post__in', 'posts_per_page' => $count, 'ignore_sticky_posts' => true ) );
    }

    $query = new WP_Query( array(
        'posts_per_page'      => $count,
        'orderby'             => 'comment_count',
        'order'               => 'DESC',
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
        'date_query'          => array( array( 'after' => '90 days ago' ) ),
    ) );

    if ( ! $query->have_posts() ) {
        $query = new WP_Query( array( 'posts_per_page' => $count, 'ignore_sticky_posts' => true, 'no_found_rows' => true ) );
    }

    set_transient( $key, wp_list_pluck( $query->posts, 'ID' ), 6 * HOUR_IN_SECONDS );
    return $query;
}

/**
 * Flush caches on publish / comment.
 */
function computerjy2_flush_caches( $post_id = 0 ) {
    global $wpdb;
    $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_cjy2_%' OR option_name LIKE '_transient_timeout_cjy2_%'" ); // phpcs:ignore
}
add_action( 'save_post', 'computerjy2_flush_caches' );
add_action( 'wp_insert_comment', 'computerjy2_flush_caches' );
add_action( 'switch_theme', 'computerjy2_flush_caches' );
