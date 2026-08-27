<?php
/**
 * ComputerJy World - Page Template
 *
 * @package ComputerJy
 */

get_header();
?>

<main id="primary-content" class="main-layout" role="main">
    <div class="container">
        
        <div class="layout-grid">
            <!-- Page Content Column -->
            <div class="content-area">
                <?php
                while ( have_posts() ) :
                    the_post();

                    get_template_part( 'template-parts/content', 'page' );

                    if ( comments_open() || get_comments_number() ) :
                        comments_template();
                    endif;

                endwhile;
                ?>
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
