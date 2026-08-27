<?php
/**
 * ComputerJy World - Archive Template
 *
 * @package ComputerJy
 */

get_header();
?>

<main id="primary-content" class="main-layout" role="main">
    <div class="container">
        
        <!-- Archive Header Banner -->
        <header class="archive-header-banner">
            <div class="archive-subtitle"><?php esc_html_e( 'Archive Browsing', 'computerjy' ); ?></div>
            <h1 style="font-size: clamp(1.8rem, 3vw, 2.5rem); margin-bottom: 0.5rem;">
                <?php the_archive_title(); ?>
            </h1>
            <?php
            $archive_description = get_the_archive_description();
            if ( ! empty( $archive_description ) ) :
                ?>
                <div style="color: var(--text-muted); font-size: 1.05rem; margin-top: 0.5rem;">
                    <?php echo wp_kses_post( $archive_description ); ?>
                </div>
            <?php endif; ?>
        </header>

        <div class="layout-grid">
            <!-- Articles List Column -->
            <div class="content-area">
                <?php if ( have_posts() ) : ?>

                    <div class="posts-grid">
                        <?php
                        while ( have_posts() ) :
                            the_post();
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
