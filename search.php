<?php
/**
 * Search results.
 *
 * @package ComputerJy2
 */

get_header();
global $wp_query;
?>

<main id="primary-content" class="container" role="main">

    <?php computerjy2_breadcrumbs(); ?>

    <header class="archive-header">
        <span class="archive-kicker"><?php esc_html_e( 'Search', 'computerjy2' ); ?></span>
        <h1 class="archive-title">&ldquo;<?php echo esc_html( get_search_query() ); ?>&rdquo;</h1>
        <p class="entry-meta-mono">
            <?php
            /* translators: %d: result count */
            printf( esc_html( _n( '%d RESULT', '%d RESULTS', (int) $wp_query->found_posts, 'computerjy2' ) ), (int) $wp_query->found_posts );
            ?>
        </p>
        <div style="margin-top:14px;max-width:420px"><?php get_search_form(); ?></div>
    </header>

    <?php if ( have_posts() ) : ?>
        <div class="tile-grid grid-3" id="primary-feed" style="margin-top:22px">
            <?php
            while ( have_posts() ) :
                the_post();
                get_template_part( 'template-parts/content', 'card' );
            endwhile;
            ?>
        </div>
        <?php computerjy2_pagination(); ?>
    <?php else : ?>
        <?php get_template_part( 'template-parts/content', 'none' ); ?>
    <?php endif; ?>

</main>

<?php
get_footer();
