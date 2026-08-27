<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    
    <!-- Google Analytics (GA4) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-MYP6LK1T99"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-MYP6LK1T99');
    </script>
    
    <!-- Prevent Flash of Unstyled Theme (FOUC) -->
    <script>
        (function() {
            try {
                var theme = localStorage.getItem('computerjy_theme_pref');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var activeTheme = theme || (prefersDark ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', activeTheme);
            } catch (e) {}
        })();
    </script>
    
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link" href="#primary-content"><?php esc_html_e( 'Skip to content', 'computerjy' ); ?></a>

<?php if ( is_singular( 'post' ) ) : ?>
    <div class="reading-progress-bar" id="readingProgressBar"></div>
<?php endif; ?>

<!-- Main Header -->
<header class="site-header" id="masthead">
    <div class="container header-inner">
        <!-- Brand Logo & Name -->
        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-brand" rel="home">
            <?php
            if ( has_custom_logo() ) {
                the_custom_logo();
            } else {
                ?>
                <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/logo.svg' ); ?>" 
                     alt="<?php bloginfo( 'name' ); ?>" 
                     class="site-logo-img" 
                     width="220" 
                     height="44">
                <?php
            }
            ?>
        </a>

        <!-- Desktop Navigation Menu -->
        <nav class="site-nav" aria-label="<?php esc_attr_e( 'Primary Navigation', 'computerjy' ); ?>">
            <?php
            if ( has_nav_menu( 'primary' ) ) {
                wp_nav_menu( array(
                    'theme_location' => 'primary',
                    'menu_class'     => 'nav-list',
                    'container'      => false,
                    'fallback_cb'    => false,
                    'items_wrap'     => '<ul id="%1$s" class="%2$s">%3$s</ul>',
                ) );
            } else {
                ?>
                <ul class="nav-list">
                    <li><a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="nav-link active"><?php esc_html_e( 'Home', 'computerjy' ); ?></a></li>
                    <li><a href="<?php echo esc_url( home_url( '/category/tech/' ) ); ?>" class="nav-link"><?php esc_html_e( 'Tech Tips', 'computerjy' ); ?></a></li>
                    <li><a href="<?php echo esc_url( home_url( '/category/entertainment/' ) ); ?>" class="nav-link"><?php esc_html_e( 'Entertainment', 'computerjy' ); ?></a></li>
                    <li><a href="<?php echo esc_url( home_url( '/contact-me/' ) ); ?>" class="nav-link"><?php esc_html_e( 'Contact', 'computerjy' ); ?></a></li>
                    <li><a href="<?php echo esc_url( home_url( '/privacy-policy-2/' ) ); ?>" class="nav-link"><?php esc_html_e( 'Privacy', 'computerjy' ); ?></a></li>
                </ul>
                <?php
            }
            ?>
        </nav>

        <!-- Header Actions: Search, Dark Mode, Mobile Menu -->
        <div class="header-actions">
            <!-- Search Trigger -->
            <button class="search-trigger-btn" type="button" aria-label="<?php esc_attr_e( 'Search website', 'computerjy' ); ?>">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span><?php esc_html_e( 'Search', 'computerjy' ); ?></span>
                <kbd class="search-kbd-shortcut">⌘K</kbd>
            </button>

            <!-- Dark / Light Mode Toggle -->
            <button class="theme-toggle-btn" type="button" aria-label="<?php esc_attr_e( 'Toggle Theme Mode', 'computerjy' ); ?>">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            </button>

            <!-- Mobile Drawer Button -->
            <button class="mobile-menu-btn" type="button" aria-label="<?php esc_attr_e( 'Open Navigation Menu', 'computerjy' ); ?>">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
        </div>
    </div>
</header>

<!-- Mobile Navigation Drawer -->
<div class="mobile-drawer-backdrop" aria-hidden="true">
    <aside class="mobile-drawer" aria-label="<?php esc_attr_e( 'Mobile Menu', 'computerjy' ); ?>">
        <div class="mobile-drawer-header">
            <div class="brand-text-name">
                <span>Computer</span><span class="brand-text-accent">Jy</span>
            </div>
            <button class="mobile-drawer-close-btn search-close-btn" type="button" aria-label="<?php esc_attr_e( 'Close menu', 'computerjy' ); ?>">
                ✕
            </button>
        </div>
        <nav class="mobile-nav">
            <?php
            if ( has_nav_menu( 'primary' ) ) {
                wp_nav_menu( array(
                    'theme_location' => 'primary',
                    'menu_class'     => 'mobile-nav-list',
                    'container'      => false,
                    'fallback_cb'    => false,
                ) );
            } else {
                ?>
                <ul class="mobile-nav-list">
                    <li><a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="mobile-nav-link"><?php esc_html_e( 'Home', 'computerjy' ); ?></a></li>
                    <li><a href="<?php echo esc_url( home_url( '/category/tech/' ) ); ?>" class="mobile-nav-link"><?php esc_html_e( 'Tech Tips', 'computerjy' ); ?></a></li>
                    <li><a href="<?php echo esc_url( home_url( '/category/entertainment/' ) ); ?>" class="mobile-nav-link"><?php esc_html_e( 'Entertainment', 'computerjy' ); ?></a></li>
                    <li><a href="<?php echo esc_url( home_url( '/contact-me/' ) ); ?>" class="mobile-nav-link"><?php esc_html_e( 'Contact Me', 'computerjy' ); ?></a></li>
                    <li><a href="<?php echo esc_url( home_url( '/privacy-policy-2/' ) ); ?>" class="mobile-nav-link"><?php esc_html_e( 'Privacy Policy', 'computerjy' ); ?></a></li>
                </ul>
                <?php
            }
            ?>
        </nav>
    </aside>
</div>

<!-- Search Modal Backdrop -->
<div class="search-modal-backdrop" aria-hidden="true">
    <div class="search-modal-card" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e( 'Search Site', 'computerjy' ); ?>">
        <div class="search-modal-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" style="flex-grow: 1;">
                <input type="search" class="search-modal-input" placeholder="<?php esc_attr_e( 'Type keywords and press Enter...', 'computerjy' ); ?>" value="<?php echo get_search_query(); ?>" name="s" autocomplete="off" />
            </form>
            <button class="search-close-btn" type="button">ESC</button>
        </div>
        <div class="search-results-list">
            <div style="padding: 10px 14px; font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">
                <?php esc_html_e( 'Popular Searches', 'computerjy' ); ?>
            </div>
            <a href="<?php echo esc_url( home_url( '/?s=clickbait' ) ); ?>" class="search-result-item">
                <div class="search-result-title">Clickbait Headlines &amp; Internet Psychology</div>
                <div class="search-result-snippet">Computers, Internet, News, SEO</div>
            </a>
            <a href="<?php echo esc_url( home_url( '/?s=software' ) ); ?>" class="search-result-item">
                <div class="search-result-title">Software Reviews &amp; Freeware Tools</div>
                <div class="search-result-snippet">Windows, Mac, Open Source, Freeware</div>
            </a>
            <a href="<?php echo esc_url( home_url( '/?s=humor' ) ); ?>" class="search-result-item">
                <div class="search-result-title">Photo Dumps, Fun &amp; Motivational Posters</div>
                <div class="search-result-snippet">Entertainment, Humor, Images</div>
            </a>
        </div>
    </div>
</div>
