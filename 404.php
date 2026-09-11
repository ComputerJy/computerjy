<?php
/**
 * 404.
 *
 * @package ComputerJy2
 */

get_header();
?>

<main id="primary-content" class="container" role="main">
    <?php computerjy2_breadcrumbs(); ?>

    <div class="state-block">
        <div class="state-code">404</div>
        <h1 class="state-title"><?php esc_html_e( 'Page not found', 'computerjy2' ); ?></h1>
        <p class="state-text"><?php esc_html_e( 'That address does not resolve. Try a search, or pick something from the latest posts below.', 'computerjy2' ); ?></p>
        <div style="max-width:380px;margin:0 auto"><?php get_search_form(); ?></div>
    </div>

    <div class="section-header-bar">
        <h2 class="section-heading"><?php esc_html_e( 'Latest', 'computerjy2' ); ?></h2>
        <div class="section-rule"></div>
    </div>
    <div class="tile-grid grid-3">
        <?php
        $cjy_404 = new WP_Query( array( 'posts_per_page' => 6, 'ignore_sticky_posts' => true, 'no_found_rows' => true ) );
        while ( $cjy_404->have_posts() ) :
            $cjy_404->the_post();
            get_template_part( 'template-parts/content', 'card' );
        endwhile;
        wp_reset_postdata();
        ?>
    </div>
</main>

<?php
get_footer();
