<?php
/**
 * ComputerJy 2.0 - theme setup, assets, and feature wiring.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'COMPUTERJY2_VERSION', '2.0.0' );

/**
 * Theme setup.
 */
function computerjy2_setup() {
    load_theme_textdomain( 'computerjy2', get_template_directory() . '/languages' );

    add_theme_support( 'automatic-feed-links' );
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'customize-selective-refresh-widgets' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'align-wide' );
    add_theme_support( 'responsive-embeds' );
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/css/editor-style.css' );

    add_theme_support( 'html5', array(
        'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets',
    ) );

    add_theme_support( 'custom-logo', array(
        'height' => 48, 'width' => 48, 'flex-width' => true, 'flex-height' => true,
    ) );

    add_theme_support( 'custom-background', array( 'default-color' => '080B12' ) );

    set_post_thumbnail_size( 720, 420, true );
    add_image_size( 'computerjy2-hero', 1600, 900, true );
    add_image_size( 'computerjy2-lead', 1024, 576, true );
    add_image_size( 'computerjy2-card', 640, 400, true );
    add_image_size( 'computerjy2-side', 360, 234, true );

    register_nav_menus( array(
        'primary' => esc_html__( 'Primary Navigation', 'computerjy2' ),
        'footer'  => esc_html__( 'Footer Links', 'computerjy2' ),
        'social'  => esc_html__( 'Social Profiles', 'computerjy2' ),
    ) );
}
add_action( 'after_setup_theme', 'computerjy2_setup' );

/**
 * Content width.
 */
function computerjy2_content_width() {
    $GLOBALS['content_width'] = apply_filters( 'computerjy2_content_width', 760 );
}
add_action( 'after_setup_theme', 'computerjy2_content_width', 0 );

/**
 * Posts per page default (user-configurable in Settings > Reading).
 */
function computerjy2_default_posts_per_page( $query ) {
    if ( ! is_admin() && $query->is_main_query() && ( $query->is_home() || $query->is_archive() ) ) {
        if ( ! get_option( 'computerjy2_respect_reading_setting' ) ) {
            $query->set( 'posts_per_page', apply_filters( 'computerjy2_posts_per_page', 15 ) );
        }
    }
}
add_action( 'pre_get_posts', 'computerjy2_default_posts_per_page' );

/**
 * Widget areas.
 */
function computerjy2_widgets_init() {
    register_sidebar( array(
        'name'          => esc_html__( 'Post Sidebar', 'computerjy2' ),
        'id'            => 'sidebar-1',
        'description'   => esc_html__( 'Extra widgets below the built-in author, trending, categories and tags blocks.', 'computerjy2' ),
        'before_widget' => '<section id="%1$s" class="sidebar-widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ) );

    foreach ( array( 1 => 'Footer Column 1', 2 => 'Footer Column 2', 3 => 'Footer Column 3' ) as $i => $label ) {
        register_sidebar( array(
            'name'          => $label,
            'id'            => 'footer-' . $i,
            'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
            'after_widget'  => '</div>',
            'before_title'  => '<h4 class="footer-col-title">',
            'after_title'   => '</h4>',
        ) );
    }
}
add_action( 'widgets_init', 'computerjy2_widgets_init' );

/**
 * Front-end assets.
 */
function computerjy2_scripts() {
    computerjy2_enqueue_fonts();

    $css_ver = computerjy2_asset_version( 'assets/css/theme.css' );
    $js_ver  = computerjy2_asset_version( 'assets/js/theme.js' );

    wp_enqueue_style( 'computerjy2-theme', get_template_directory_uri() . '/assets/css/theme.css', array(), $css_ver );
    wp_enqueue_style( 'computerjy2-style', get_stylesheet_uri(), array( 'computerjy2-theme' ), $css_ver );

    wp_enqueue_script( 'computerjy2-theme', get_template_directory_uri() . '/assets/js/theme.js', array(), $js_ver, true );

    if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
        wp_enqueue_script( 'comment-reply' );
    }
}
add_action( 'wp_enqueue_scripts', 'computerjy2_scripts' );

/**
 * Cache-busting version for a theme asset.
 *
 * The origin serves css/js with a 1-year Expires, so the query string must
 * change with the file, not with the theme's release version. A missing file
 * (a partial deploy) falls back to the release version instead of an empty
 * `?ver=`.
 *
 * @param string $rel Path relative to the theme root.
 * @return string
 */
function computerjy2_asset_version( $rel ) {
    $file  = get_template_directory() . '/' . ltrim( $rel, '/' );
    $mtime = file_exists( $file ) ? filemtime( $file ) : false;
    return $mtime ? (string) $mtime : COMPUTERJY2_VERSION;
}

/**
 * Self-hosted Inter, Plus Jakarta Sans and JetBrains Mono (assets/css/fonts.css,
 * files in assets/fonts). The only third-party render-blocking request used to
 * be Google Fonts; now the vhost serves the woff2 with a 1-year Expires.
 */
function computerjy2_enqueue_fonts() {
    wp_enqueue_style(
        'computerjy2-fonts',
        get_template_directory_uri() . '/assets/css/fonts.css',
        array(),
        computerjy2_asset_version( 'assets/css/fonts.css' )
    );
}

/**
 * Block editor assets (fonts, so the editor matches the front end).
 */
function computerjy2_editor_assets() {
    computerjy2_enqueue_fonts();
}
add_action( 'enqueue_block_editor_assets', 'computerjy2_editor_assets' );

/**
 * Preload the two latin files every page needs (body and heading faces) so
 * they are fetched with the HTML instead of after fonts.css is parsed.
 * unicode-range keeps latin-ext and the mono face on demand.
 *
 * @param array $resources Preload entries.
 * @return array
 */
function computerjy2_preload_fonts( $resources ) {
    foreach ( array( 'inter-latin', 'plus-jakarta-sans-latin' ) as $file ) {
        $resources[] = array(
            'href'        => get_template_directory_uri() . '/assets/fonts/' . $file . '.woff2',
            'as'          => 'font',
            'type'        => 'font/woff2',
            'crossorigin' => 'anonymous',
        );
    }
    return $resources;
}
add_filter( 'wp_preload_resources', 'computerjy2_preload_fonts' );

/**
 * Google Analytics 4, when a measurement ID is configured.
 * Not printed for logged-in editors, and skipped on AMP requests.
 */
function computerjy2_analytics() {
    $id = trim( (string) get_theme_mod( 'computerjy2_ga4_id', '' ) );
    if ( '' === $id || is_user_logged_in() ) {
        return;
    }
    ?>
    <script async src="https://www.googletagmanager.com/gtag/js?id=<?php echo esc_attr( $id ); ?>"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', <?php echo wp_json_encode( $id ); ?>);
    </script>
    <?php
}
add_action( 'wp_head', 'computerjy2_analytics', 5 );

/**
 * Body classes.
 */
function computerjy2_body_classes( $classes ) {
    if ( is_singular( 'post' ) && has_post_thumbnail() ) {
        $classes[] = 'has-hero';
    }
    if ( ! is_active_sidebar( 'sidebar-1' ) ) {
        $classes[] = 'no-extra-widgets';
    }
    return $classes;
}
add_filter( 'body_class', 'computerjy2_body_classes' );

/** Excerpt tuning. */
add_filter( 'excerpt_length', function () { return 28; } );
add_filter( 'excerpt_more', function () { return '&hellip;'; } );

/** Include modules. */
require_once get_template_directory() . '/inc/template-tags.php';
require_once get_template_directory() . '/inc/comment-walker.php';
require_once get_template_directory() . '/inc/slots.php';
require_once get_template_directory() . '/inc/related.php';
require_once get_template_directory() . '/inc/search-index.php';
require_once get_template_directory() . '/inc/plugin-compat.php';
require_once get_template_directory() . '/inc/customizer.php';
require_once get_template_directory() . '/inc/block-patterns.php';
