<?php
/**
 * ComputerJy World - Theme Functions and Definitions
 *
 * @package ComputerJy
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

if ( ! function_exists( 'computerjy_setup' ) ) :
    /**
     * Sets up theme defaults and registers support for various WordPress features.
     */
    function computerjy_setup() {
        // Make theme available for translation.
        load_theme_textdomain( 'computerjy', get_template_directory() . '/languages' );

        // Add default posts and comments RSS feed links to head.
        add_theme_support( 'automatic-feed-links' );

        // Let WordPress manage the document title.
        add_theme_support( 'title-tag' );

        // Enable support for Post Thumbnails on posts and pages.
        add_theme_support( 'post-thumbnails' );
        set_post_thumbnail_size( 720, 420, true );
        add_image_size( 'computerjy-featured-large', 1200, 675, true );
        add_image_size( 'computerjy-card', 600, 360, true );
        add_image_size( 'computerjy-thumb-small', 160, 120, true );

        // Register Navigation Menus.
        register_nav_menus( array(
            'primary' => esc_html__( 'Primary Navigation Menu', 'computerjy' ),
            'footer'  => esc_html__( 'Footer Navigation Menu', 'computerjy' ),
            'social'  => esc_html__( 'Social Profiles Menu', 'computerjy' ),
        ) );

        // Switch default core markup for search form, comment form, and comments to output valid HTML5.
        add_theme_support( 'html5', array(
            'search-form',
            'comment-form',
            'comment-list',
            'gallery',
            'caption',
            'style',
            'script',
        ) );

        // Set up the WordPress core custom logo feature.
        add_theme_support( 'custom-logo', array(
            'height'      => 60,
            'width'       => 240,
            'flex-width'  => true,
            'flex-height' => true,
        ) );

        // Add theme support for selective refresh for widgets.
        add_theme_support( 'customize-selective-refresh-widgets' );

        // Add support for Block Styles and full width alignment.
        add_theme_support( 'wp-block-styles' );
        add_theme_support( 'align-wide' );
        add_theme_support( 'responsive-embeds' );
    }
endif;
add_action( 'after_setup_theme', 'computerjy_setup' );

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 */
function computerjy_content_width() {
    $GLOBALS['content_width'] = apply_filters( 'computerjy_content_width', 840 );
}
add_action( 'after_setup_theme', 'computerjy_content_width', 0 );

/**
 * Register widget area.
 */
function computerjy_widgets_init() {
    register_sidebar( array(
        'name'          => esc_html__( 'Main Blog Sidebar', 'computerjy' ),
        'id'            => 'sidebar-1',
        'description'   => esc_html__( 'Add widgets here to appear in the main blog sidebar.', 'computerjy' ),
        'before_widget' => '<section id="%1$s" class="sidebar-widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ) );

    register_sidebar( array(
        'name'          => esc_html__( 'Footer Column 1', 'computerjy' ),
        'id'            => 'footer-1',
        'description'   => esc_html__( 'Footer first column widget area.', 'computerjy' ),
        'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="footer-col-title">',
        'after_title'   => '</h4>',
    ) );

    register_sidebar( array(
        'name'          => esc_html__( 'Footer Column 2', 'computerjy' ),
        'id'            => 'footer-2',
        'description'   => esc_html__( 'Footer second column widget area.', 'computerjy' ),
        'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="footer-col-title">',
        'after_title'   => '</h4>',
    ) );
}
add_action( 'widgets_init', 'computerjy_widgets_init' );

/**
 * Enqueue scripts and styles.
 */
function computerjy_scripts() {
    // Google Fonts: Plus Jakarta Sans & Inter
    wp_enqueue_style(
        'computerjy-google-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap',
        array(),
        null
    );

    // Main Theme CSS
    wp_enqueue_style(
        'computerjy-theme-style',
        get_template_directory_uri() . '/assets/css/theme.css',
        array(),
        '1.0.0'
    );

    // Root style.css
    wp_enqueue_style(
        'computerjy-style',
        get_stylesheet_uri(),
        array( 'computerjy-theme-style' ),
        '1.0.0'
    );

    // Theme JS
    wp_enqueue_script(
        'computerjy-theme-js',
        get_template_directory_uri() . '/assets/js/theme.js',
        array(),
        '1.0.0',
        true
    );

    if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
        wp_enqueue_script( 'comment-reply' );
    }
}
add_action( 'wp_enqueue_scripts', 'computerjy_scripts' );

/**
 * Helper: Calculate reading time for posts.
 */
function computerjy_reading_time( $post_id = null ) {
    $content = get_post_field( 'post_content', $post_id ? $post_id : get_the_ID() );
    $word_count = str_word_count( wp_strip_all_tags( $content ) );
    $reading_time = ceil( $word_count / 200 );
    return max( 1, $reading_time ) . ' min read';
}

/**
 * Helper: Custom category badge markup with brand classes.
 */
function computerjy_get_category_badge( $post_id = null ) {
    $categories = get_the_category( $post_id );
    if ( empty( $categories ) ) {
        return '';
    }

    $primary_cat = $categories[0];
    $cat_slug = strtolower( $primary_cat->slug );
    $badge_class = 'category-badge';

    if ( in_array( $cat_slug, array( 'entertainment', 'fun', 'humor' ) ) ) {
        $badge_class .= ' badge-entertainment';
    } elseif ( in_array( $cat_slug, array( 'computers', 'tech', 'software', 'programming', 'internet' ) ) ) {
        $badge_class .= ' badge-tech';
    } elseif ( in_array( $cat_slug, array( 'education', 'science' ) ) ) {
        $badge_class .= ' badge-education';
    }

    return sprintf(
        '<a href="%1$s" class="%2$s">%3$s</a>',
        esc_url( get_category_link( $primary_cat->term_id ) ),
        esc_attr( $badge_class ),
        esc_html( $primary_cat->name )
    );
}

/**
 * Helper: Breadcrumbs navigation.
 */
function computerjy_breadcrumbs() {
    if ( is_home() || is_front_page() ) {
        return;
    }

    echo '<nav class="breadcrumbs-trail" aria-label="' . esc_attr__( 'Breadcrumbs', 'computerjy' ) . '">';
    echo '<a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'Home', 'computerjy' ) . '</a>';
    echo '<span class="meta-dot"></span>';

    if ( is_category() ) {
        echo '<span>' . esc_html( single_cat_title( '', false ) ) . '</span>';
    } elseif ( is_tag() ) {
        echo '<span>' . esc_html( single_tag_title( '', false ) ) . '</span>';
    } elseif ( is_singular( 'post' ) ) {
        $categories = get_the_category();
        if ( ! empty( $categories ) ) {
            echo '<a href="' . esc_url( get_category_link( $categories[0]->term_id ) ) . '">' . esc_html( $categories[0]->name ) . '</a>';
            echo '<span class="meta-dot"></span>';
        }
        echo '<span>' . esc_html( wp_trim_words( get_the_title(), 6 ) ) . '</span>';
    } elseif ( is_page() ) {
        echo '<span>' . esc_html( get_the_title() ) . '</span>';
    } elseif ( is_search() ) {
        /* translators: %s: search query */
        echo '<span>' . sprintf( esc_html__( 'Search: %s', 'computerjy' ), esc_html( get_search_query() ) ) . '</span>';
    } elseif ( is_404() ) {
        echo '<span>' . esc_html__( 'Error 404', 'computerjy' ) . '</span>';
    }

    echo '</nav>';
}

/**
 * Helper: Custom numeric pagination.
 */
function computerjy_pagination() {
    the_posts_pagination( array(
        'mid_size'  => 2,
        'prev_text' => __( '← Prev', 'computerjy' ),
        'next_text' => __( 'Next →', 'computerjy' ),
        'class'     => 'pagination-wrapper',
    ) );
}

/**
 * Custom Comment Callback for Modern Layout.
 */
function computerjy_comment_callback( $comment, $args, $depth ) {
    $GLOBALS['comment'] = $comment;
    ?>
    <li id="comment-<?php comment_ID(); ?>" <?php comment_class( 'comment-item' ); ?>>
        <div class="comment-avatar-wrap">
            <?php echo get_avatar( $comment, 48, '', '', array( 'class' => 'comment-avatar' ) ); ?>
        </div>
        <div class="comment-content-wrap">
            <div class="comment-header">
                <span class="comment-author-name"><?php echo get_comment_author_link(); ?></span>
                <div class="comment-date"><?php printf( esc_html__( '%1$s at %2$s', 'computerjy' ), esc_html( get_comment_date() ), esc_html( get_comment_time() ) ); ?></div>
            </div>
            <div class="comment-body">
                <?php comment_text(); ?>
            </div>
            <div class="comment-reply">
                <?php comment_reply_link( array_merge( $args, array( 'depth' => $depth, 'max_depth' => $args['max_depth'], 'reply_text' => __( 'Reply ↵', 'computerjy' ) ) ) ); ?>
            </div>
        </div>
    <?php
}

/**
 * Customizer Additions.
 */
function computerjy_customizer_settings( $wp_customize ) {
    // Brand & Social Section
    $wp_customize->add_section( 'computerjy_brand_options', array(
        'title'    => __( 'ComputerJy Brand & Social', 'computerjy' ),
        'priority' => 30,
    ) );

    // Social Links
    $socials = array(
        'twitter'    => 'Twitter / X URL',
        'facebook'   => 'Facebook URL',
        'instagram'  => 'Instagram URL',
        'linkedin'   => 'LinkedIn URL',
        'soundcloud' => 'SoundCloud URL',
        'github'     => 'GitHub URL',
        'youtube'    => 'YouTube URL',
    );

    foreach ( $socials as $key => $label ) {
        $wp_customize->add_setting( "computerjy_social_{$key}", array(
            'default'           => '',
            'sanitize_callback' => 'esc_url_raw',
        ) );

        $wp_customize->add_control( "computerjy_social_{$key}", array(
            'label'   => $label,
            'section' => 'computerjy_brand_options',
            'type'    => 'url',
        ) );
    }

    // Hero tagline setting
    $wp_customize->add_setting( 'computerjy_hero_tagline', array(
        'default'           => 'Entertainment, Tech tips & Occasional software reviews',
        'sanitize_callback' => 'sanitize_text_field',
    ) );

    $wp_customize->add_control( 'computerjy_hero_tagline', array(
        'label'   => __( 'Hero Subtitle / Tagline', 'computerjy' ),
        'section' => 'computerjy_brand_options',
        'type'    => 'text',
    ) );
}
add_action( 'customize_register', 'computerjy_customizer_settings' );
