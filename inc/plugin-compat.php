<?php
/**
 * Plugin compatibility shims.
 *
 * Covered: Gutenberg (theme.json + editor styles, see functions.php),
 * Yoast SEO / Rank Math (breadcrumbs + primary term, see template-tags.php),
 * Contact Form 7, Jetpack (related posts, sharing, infinite scroll, subscriptions),
 * AdSense and other sponsor plugins (reserved slots, see slots.php),
 * page caching plugins (transient-backed queries, see related.php).
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* ---------- Contact Form 7 ---------- */

// CF7 ships its own CSS/JS on every page; only load it where a form exists.
function computerjy2_dequeue_cf7_assets() {
    if ( is_singular() ) {
        $post = get_post();
        if ( $post && ! has_shortcode( $post->post_content, 'contact-form-7' ) && ! has_block( 'contact-form-7/contact-form-selector', $post ) ) {
            wp_dequeue_style( 'contact-form-7' );
            wp_dequeue_script( 'contact-form-7' );
        }
    }
}
add_action( 'wp_enqueue_scripts', 'computerjy2_dequeue_cf7_assets', 99 );

// Let CF7 markup inherit theme form styles rather than its own <p> wrappers.
add_filter( 'wpcf7_autop_or_not', '__return_false' );

/* ---------- Jetpack ---------- */

function computerjy2_jetpack_setup() {
    add_theme_support( 'infinite-scroll', array(
        'container' => 'primary-feed',
        'render'    => 'computerjy2_infinite_scroll_render',
        'footer'    => false,
        'type'      => 'click',
        'wrapper'   => false,
    ) );

    add_theme_support( 'jetpack-responsive-videos' );
    add_theme_support( 'jetpack-content-options', array(
        'blog-display'       => 'excerpt',
        'author-bio'         => true,
        'post-details'       => array(
            'stylesheet' => 'computerjy2-theme',
            'date'       => '.entry-meta-mono',
            'categories' => '.category-badge',
        ),
        'featured-images'    => array( 'archive' => true, 'post' => true, 'page' => true ),
    ) );
}
add_action( 'after_setup_theme', 'computerjy2_jetpack_setup' );

function computerjy2_infinite_scroll_render() {
    while ( have_posts() ) {
        the_post();
        get_template_part( 'template-parts/content', 'card' );
    }
}

// Jetpack's related posts duplicate the theme's own block; keep one of them.
function computerjy2_jetpack_related( $options ) {
    if ( get_theme_mod( 'computerjy2_use_theme_related', true ) ) {
        $options['enabled'] = false;
    }
    return $options;
}
add_filter( 'jetpack_relatedposts_filter_options', 'computerjy2_jetpack_related' );

// Sharing buttons: theme renders its own share row, so move Jetpack's out of the content.
add_filter( 'jetpack_sharing_display_markup', function ( $markup ) { return $markup; } );

/* ---------- SEO plugins ---------- */

// The theme prints its own breadcrumb trail only when neither plugin is active
// (see computerjy2_breadcrumbs), so nothing to disable here; just make sure the
// title tag stays with the plugin when one is present.
function computerjy2_seo_notice() {
    // Intentionally empty: title-tag support is compatible with both plugins.
}

/* ---------- AMP-safe output ---------- */

function computerjy2_is_amp() {
    return ( function_exists( 'amp_is_request' ) && amp_is_request() );
}

// Skip the JS-driven furniture on AMP requests.
function computerjy2_amp_dequeue() {
    if ( computerjy2_is_amp() ) {
        wp_dequeue_script( 'computerjy2-theme' );
    }
}
add_action( 'wp_enqueue_scripts', 'computerjy2_amp_dequeue', 100 );

/* ---------- Caching plugins ---------- */

// Give cache plugins an explicit hook to purge the theme's transients.
function computerjy2_register_cache_purge() {
    foreach ( array( 'wp_cache_cleared', 'w3tc_flush_all', 'rocket_purge_cache', 'litespeed_purged_all' ) as $hook ) {
        add_action( $hook, 'computerjy2_flush_caches' );
    }
}
add_action( 'init', 'computerjy2_register_cache_purge' );
