<?php
/**
 * Related posts, trending list, and the transient caching behind both.
 *
 * Both queries are cached in transients so a page cache plugin (or a cold cache)
 * never pays for them twice. Every key carries a generation number stored in an
 * option; publishing or commenting bumps the generation, which invalidates every
 * key at once — through the transient API, so it works whether transients live
 * in wp_options or in a persistent object cache (the origin runs APCu).
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Current cache generation.
 *
 * @return int
 */
function computerjy2_cache_generation() {
    return (int) get_option( 'cjy2_cache_generation', 1 );
}

/**
 * Transient key for the current generation.
 *
 * @param string $suffix Key-specific part, e.g. "related_12_3".
 * @return string
 */
function computerjy2_cache_key( $suffix ) {
    return 'cjy2_' . computerjy2_cache_generation() . '_' . $suffix;
}

/**
 * Related posts by shared category/tag, newest first.
 */
function computerjy2_related_posts( $post_id = null, $count = 3 ) {
    $post_id = $post_id ? $post_id : get_the_ID();
    $key     = computerjy2_cache_key( 'related_' . $post_id . '_' . $count );
    $cached  = get_transient( $key );
    if ( false !== $cached ) {
        return new WP_Query( array( 'post__in' => $cached ? $cached : array( 0 ), 'orderby' => 'post__in', 'ignore_sticky_posts' => true, 'posts_per_page' => $count, 'no_found_rows' => true ) );
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
    $key    = computerjy2_cache_key( 'trending_' . $count );
    $cached = get_transient( $key );
    if ( false !== $cached && ! empty( $cached ) ) {
        return new WP_Query( array( 'post__in' => $cached, 'orderby' => 'post__in', 'posts_per_page' => $count, 'ignore_sticky_posts' => true, 'no_found_rows' => true ) );
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
 * Recent posts for the search modal, rendered on every page.
 */
function computerjy2_recent_posts( $count = 4 ) {
    $key    = computerjy2_cache_key( 'recent_' . $count );
    $cached = get_transient( $key );
    if ( false !== $cached && ! empty( $cached ) ) {
        return new WP_Query( array( 'post__in' => $cached, 'orderby' => 'post__in', 'posts_per_page' => $count, 'ignore_sticky_posts' => true, 'no_found_rows' => true ) );
    }

    $query = new WP_Query( array( 'posts_per_page' => $count, 'ignore_sticky_posts' => true, 'no_found_rows' => true ) );
    set_transient( $key, wp_list_pluck( $query->posts, 'ID' ), 12 * HOUR_IN_SECONDS );
    return $query;
}

/**
 * Flush caches on publish / comment.
 *
 * Bumping the generation is the invalidation; the DELETE only prunes the
 * previous generation's rows when transients are stored in wp_options (they
 * would otherwise sit there until their timeout). Fires the
 * `computerjy2_flush_caches` action so other caches (search index) share one
 * invalidation policy.
 */
function computerjy2_flush_caches() {
    global $wpdb;
    update_option( 'cjy2_cache_generation', computerjy2_cache_generation() + 1 );
    $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
            $wpdb->esc_like( '_transient_cjy2_' ) . '%',
            $wpdb->esc_like( '_transient_timeout_cjy2_' ) . '%'
        )
    );
    do_action( 'computerjy2_flush_caches' );
}

/**
 * Autosaves, revisions and auto-drafts never change what visitors see.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post.
 */
function computerjy2_flush_on_save( $post_id, $post ) {
    if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) || 'auto-draft' === $post->post_status ) {
        return;
    }
    computerjy2_flush_caches();
}
add_action( 'save_post', 'computerjy2_flush_on_save', 10, 2 );

/**
 * Only approved comments affect trending counts; pending/spam go through
 * transition_comment_status when moderated.
 *
 * @param int        $id      Comment ID.
 * @param WP_Comment $comment Comment.
 */
function computerjy2_flush_on_comment( $id, $comment ) {
    if ( '1' === (string) $comment->comment_approved ) {
        computerjy2_flush_caches();
    }
}
add_action( 'wp_insert_comment', 'computerjy2_flush_on_comment', 10, 2 );
add_action( 'transition_comment_status', 'computerjy2_flush_caches' );
add_action( 'switch_theme', 'computerjy2_flush_caches' );
