<?php
/**
 * ComputerJy World - Sidebar Template
 *
 * @package ComputerJy
 */
?>

<div class="sidebar-wrapper">
    <?php
    if ( is_active_sidebar( 'sidebar-1' ) ) {
        dynamic_sidebar( 'sidebar-1' );
    } else {
        // Fallback Default Widgets
        ?>
        
        <!-- Author Profile Widget -->
        <section class="sidebar-widget widget-author-card">
            <div class="author-banner-bg"></div>
            <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/logo-icon.svg' ); ?>" 
                 alt="Eyad Salah - ComputerJy World" 
                 class="author-avatar-large">
            <h3 class="author-name">Eyad Salah</h3>
            <div class="author-title-sub">ComputerJy World &bull; Since 2007</div>
            <p class="author-bio">
                Passionate technologist, software explorer, and digital enthusiast sharing tips, reviews, and insights on the evolving tech world.
            </p>
            <div class="social-icons-list">
                <a href="https://x.com/ComputerJy" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="Twitter / X">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                </a>
                <a href="https://www.facebook.com/computerjy" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="Facebook">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                </a>
                <a href="https://www.linkedin.com/in/computerjy" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="LinkedIn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 1.45-1.45 1.45 1.45 0 0 0-1.45-1.45 1.45 1.45 0 0 0 1.45 1.45m1.37 9.74v-8.37H5.09v8.37h2.74z"/>
                    </svg>
                </a>
                <a href="https://www.instagram.com/computerjy/" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="Instagram">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                </a>
            </div>
        </section>

        <!-- Trending / Recent Posts Widget -->
        <section class="sidebar-widget">
            <h3 class="widget-title">
                <span>🔥 <?php esc_html_e( 'Trending Articles', 'computerjy' ); ?></span>
            </h3>
            <div class="trending-list">
                <?php
                $recent_posts = new WP_Query( array(
                    'posts_per_page'      => 4,
                    'ignore_sticky_posts' => 1,
                ) );

                if ( $recent_posts->have_posts() ) :
                    $rank = 0;
                    while ( $recent_posts->have_posts() ) :
                        $recent_posts->the_post();
                        $rank++;
                        ?>
                        <article class="trending-item">
                            <span class="trending-rank">0<?php echo esc_html( $rank ); ?></span>
                            <div class="trending-content">
                                <h4>
                                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                                </h4>
                                <div class="trending-date"><?php echo esc_html( get_the_date() ); ?></div>
                            </div>
                        </article>
                        <?php
                    endwhile;
                    wp_reset_postdata();
                endif;
                ?>
            </div>
        </section>

        <!-- Categories Widget -->
        <section class="sidebar-widget">
            <h3 class="widget-title">
                <span>📂 <?php esc_html_e( 'Categories', 'computerjy' ); ?></span>
            </h3>
            <div class="categories-widget-list">
                <?php
                $categories = get_categories( array(
                    'orderby'    => 'count',
                    'order'      => 'DESC',
                    'number'     => 6,
                    'hide_empty' => true,
                ) );

                foreach ( $categories as $cat ) :
                    ?>
                    <a href="<?php echo esc_url( get_category_link( $cat->term_id ) ); ?>" class="category-row-link">
                        <span><?php echo esc_html( $cat->name ); ?></span>
                        <span class="category-count"><?php echo esc_html( $cat->count ); ?></span>
                    </a>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- Tags Cloud Widget -->
        <section class="sidebar-widget">
            <h3 class="widget-title">
                <span>🏷️ <?php esc_html_e( 'Popular Tags', 'computerjy' ); ?></span>
            </h3>
            <div class="tags-cloud-flex">
                <?php
                $tags = get_tags( array(
                    'orderby' => 'count',
                    'order'   => 'DESC',
                    'number'  => 16,
                ) );

                foreach ( $tags as $tag ) :
                    ?>
                    <a href="<?php echo esc_url( get_tag_link( $tag->term_id ) ); ?>" class="tag-badge">
                        #<?php echo esc_html( $tag->name ); ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- Monthly Archives Widget -->
        <section class="sidebar-widget">
            <h3 class="widget-title">
                <span>📅 <?php esc_html_e( 'Archives', 'computerjy' ); ?></span>
            </h3>
            <ul class="footer-links-list">
                <?php
                wp_get_archives( array(
                    'type'            => 'monthly',
                    'limit'           => 6,
                    'show_post_count' => true,
                ) );
                ?>
            </ul>
        </section>

        <!-- Stay Connected Widget -->
        <section class="sidebar-widget">
            <div class="newsletter-box">
                <span class="hero-sparkle" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">✨</span>
                <h4>Join the Community</h4>
                <p>Get exclusive tech tips, reviews & updates delivered weekly.</p>
                <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Subscribed to ComputerJy updates!');">
                    <input type="email" class="newsletter-input" placeholder="Your email address" required />
                    <button type="submit" class="btn-primary">Join Free 🚀</button>
                </form>
            </div>
        </section>

        <?php
    }
    ?>
</div>
