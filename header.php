<?php
/**
 * Header: glass sticky bar, reading progress, search modal, mobile drawer.
 *
 * @package ComputerJy2
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <script>
        /* Default follows the system; an explicit choice persists. Runs before paint. */
        (function () {
            try {
                var stored = localStorage.getItem('computerjy_theme_pref');
                var system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', stored || system);
            } catch (e) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        })();
    </script>
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link" href="#primary-content"><?php esc_html_e( 'Skip to content', 'computerjy2' ); ?></a>

<?php if ( is_singular( 'post' ) ) : ?>
    <div class="reading-progress-track" aria-hidden="true"><div class="reading-progress-bar" id="readingProgressBar"></div></div>
<?php endif; ?>

<header class="site-header" id="masthead">
    <div class="container header-inner">
        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-brand" rel="home">
            <?php
            if ( has_custom_logo() ) {
                the_custom_logo();
            } else {
                printf(
                    '<img src="%1$s" alt="" width="26" height="26" aria-hidden="true">',
                    esc_url( get_template_directory_uri() . '/assets/images/logo-icon.svg' )
                );
            }
            ?>
            <span class="brand-word"><?php echo wp_kses_post( computerjy2_brand_mark() ); ?></span>
        </a>

        <nav class="site-nav" aria-label="<?php esc_attr_e( 'Primary', 'computerjy2' ); ?>">
            <?php
            if ( has_nav_menu( 'primary' ) ) {
                wp_nav_menu( array(
                    'theme_location' => 'primary',
                    'menu_class'     => 'nav-list',
                    'container'      => false,
                    'depth'          => 1,
                    'fallback_cb'    => false,
                ) );
            } else {
                ?>
                <ul class="nav-list">
                    <li><a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="active">home</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/category/tech/' ) ); ?>">tech-tips</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/category/entertainment/' ) ); ?>">entertainment</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/contact-me/' ) ); ?>">contact</a></li>
                </ul>
                <?php
            }
            ?>
        </nav>

        <div class="header-actions">
            <button class="search-trigger-btn" type="button" aria-label="<?php esc_attr_e( 'Search', 'computerjy2' ); ?>">
                <span><?php esc_html_e( 'SEARCH', 'computerjy2' ); ?></span>
                <kbd class="search-kbd-shortcut">&#8984;K</kbd>
            </button>
            <button class="theme-toggle-btn" type="button" aria-label="<?php esc_attr_e( 'Toggle light and dark mode', 'computerjy2' ); ?>" aria-pressed="false">&#9689;</button>
            <button class="mobile-menu-btn" type="button" aria-label="<?php esc_attr_e( 'Open menu', 'computerjy2' ); ?>">&#9776;</button>
        </div>
    </div>
</header>

<div class="mobile-drawer-backdrop">
    <aside class="mobile-drawer" aria-label="<?php esc_attr_e( 'Mobile menu', 'computerjy2' ); ?>">
        <div class="mobile-drawer-header">
            <span class="brand-word"><?php echo wp_kses_post( computerjy2_brand_mark() ); ?></span>
            <button class="search-close-btn" type="button" aria-label="<?php esc_attr_e( 'Close menu', 'computerjy2' ); ?>">ESC</button>
        </div>
        <nav aria-label="<?php esc_attr_e( 'Mobile', 'computerjy2' ); ?>">
            <?php
            if ( has_nav_menu( 'primary' ) ) {
                wp_nav_menu( array( 'theme_location' => 'primary', 'menu_class' => 'mobile-nav-list', 'container' => false, 'fallback_cb' => false ) );
            } else {
                ?>
                <ul class="mobile-nav-list">
                    <li><a href="<?php echo esc_url( home_url( '/' ) ); ?>">/home</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/category/tech/' ) ); ?>">/tech-tips</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/category/entertainment/' ) ); ?>">/entertainment</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/contact-me/' ) ); ?>">/contact</a></li>
                </ul>
                <?php
            }
            ?>
        </nav>
    </aside>
</div>

<div class="search-modal-backdrop">
    <div class="search-modal-card" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e( 'Search', 'computerjy2' ); ?>">
        <div class="search-modal-header">
            <form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" style="flex:1">
                <label class="screen-reader-text" for="cjy-search"><?php esc_html_e( 'Search for:', 'computerjy2' ); ?></label>
                <input type="search" id="cjy-search" class="search-modal-input" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'Type keywords and press Enter…', 'computerjy2' ); ?>" autocomplete="off">
            </form>
            <button class="search-close-btn" type="button">ESC</button>
        </div>
        <div class="search-results-list">
            <div class="search-hint"><?php esc_html_e( 'Recent posts', 'computerjy2' ); ?></div>
            <?php
            $cjy_recent = new WP_Query( array( 'posts_per_page' => 4, 'ignore_sticky_posts' => true, 'no_found_rows' => true ) );
            while ( $cjy_recent->have_posts() ) :
                $cjy_recent->the_post();
                ?>
                <a href="<?php the_permalink(); ?>" class="search-result-item">
                    <div class="search-result-title"><?php the_title(); ?></div>
                    <div class="search-result-snippet"><?php echo esc_html( get_the_date( 'Y-m-d' ) ); ?> &middot; <?php echo esc_html( computerjy2_reading_time() ); ?></div>
                </a>
                <?php
            endwhile;
            wp_reset_postdata();
            ?>
        </div>
    </div>
</div>
