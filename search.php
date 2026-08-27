<?php
/**
 * ComputerJy World - Search Results Template
 *
 * @package ComputerJy
 */

get_header();
?>

<main id="primary-content" class="main-layout" role="main">
    <div class="container">
        
        <header class="archive-header-banner">
            <div class="archive-subtitle"><?php esc_html_e( 'Search Results For:', 'computerjy' ); ?></div>
            <h1 style="font-size: clamp(1.8rem, 3vw, 2.5rem);">
                &ldquo;<span class="text-gradient"><?php echo esc_html( get_search_query() ); ?></span>&rdquo;
            </h1>
        </header>

        <div class="layout-grid">
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

            <aside class="sidebar-column">
                <?php get_sidebar(); ?>
            </aside>
        </div>

    </div>
</main>

<?php
get_footer();
