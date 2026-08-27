<?php
/**
 * ComputerJy World - Main Index Template
 *
 * @package ComputerJy
 */

get_header();
?>

<main id="primary-content" class="main-layout" role="main">
    <div class="container">
        
        <?php if ( is_home() && ! is_paged() ) : ?>
            <!-- Hero Banner -->
            <section class="hero-section">
                <div class="hero-banner">
                    <div class="hero-banner-content">
                        <div class="hero-tag">
                            <span class="badge-glow">
                                <span class="hero-sparkle">✦</span> <?php esc_html_e( 'Welcome to ComputerJy World', 'computerjy' ); ?>
                            </span>
                        </div>
                        <h1 class="hero-title">
                            Entertainment, Tech Tips &amp; <span class="text-gradient">Occasional Software Reviews</span>
                        </h1>
                        <p class="hero-description">
                            Exploring technology, internet culture, productivity tips, software discoveries, and fun reflections with a friendly, energetic, and tech-savvy voice.
                        </p>
                        <div class="hero-stats">
                            <div class="hero-stat-item">
                                <span class="hero-stat-number">500+</span>
                                <span class="hero-stat-label"><?php esc_html_e( 'Articles & Tips', 'computerjy' ); ?></span>
                            </div>
                            <div class="hero-stat-item">
                                <span class="hero-stat-number" style="color: var(--brand-pink);">18+</span>
                                <span class="hero-stat-label"><?php esc_html_e( 'Years Online', 'computerjy' ); ?></span>
                            </div>
                            <div class="hero-stat-item">
                                <span class="hero-stat-number" style="color: var(--brand-amber);">100%</span>
                                <span class="hero-stat-label"><?php esc_html_e( 'Independent Tech', 'computerjy' ); ?></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        <?php endif; ?>

        <div class="layout-grid">
            <!-- Main Content Column -->
            <div class="content-area">
                <?php if ( have_posts() ) : ?>

                    <div class="section-header-bar">
                        <h2 class="section-heading">
                            <span class="section-icon"></span>
                            <?php 
                            if ( is_home() ) {
                                esc_html_e( 'Latest Articles & Insights', 'computerjy' );
                            } else {
                                esc_html_e( 'Articles', 'computerjy' );
                            }
                            ?>
                        </h2>
                        <span class="badge-glow" style="font-size: 0.72rem;">
                            <?php esc_html_e( 'Fresh Content', 'computerjy' ); ?>
                        </span>
                    </div>

                    <div class="posts-grid">
                        <?php
                        $post_counter = 0;
                        while ( have_posts() ) :
                            the_post();
                            $post_counter++;
                            
                            // Load standard post card template part
                            get_template_part( 'template-parts/content', get_post_format() );
                        endwhile;
                        ?>
                    </div>

                    <?php computerjy_pagination(); ?>

                <?php else : ?>

                    <?php get_template_part( 'template-parts/content', 'none' ); ?>

                <?php endif; ?>
            </div>

            <!-- Sidebar Column -->
            <aside class="sidebar-column">
                <?php get_sidebar(); ?>
            </aside>
        </div>

    </div>
</main>

<?php
get_footer();
