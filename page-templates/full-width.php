<?php
/**
 * Template Name: Full width (no sidebar)
 * Template Post Type: page
 *
 * @package ComputerJy2
 */

get_header();
?>

<main id="primary-content" role="main">
    <div class="container"><?php computerjy2_breadcrumbs(); ?></div>
    <div class="page-shell page-shell-wide">
        <?php
        while ( have_posts() ) :
            the_post();
            get_template_part( 'template-parts/content', 'page' );

            if ( comments_open() || get_comments_number() ) {
                comments_template();
            }
        endwhile;
        ?>
    </div>
</main>

<?php
get_footer();
