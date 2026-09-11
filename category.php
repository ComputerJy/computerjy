<?php
/**
 * Category archive: hero band, then the standard grid.
 *
 * @package ComputerJy2
 */

get_header();
$cjy_term = get_queried_object();
?>

<main id="primary-content" role="main">

    <div class="container"><?php computerjy2_slot( 'leaderboard', __( 'Leaderboard', 'computerjy2' ) ); ?></div>

    <section class="landing-hero" style="text-align:left">
        <div class="container">
            <?php computerjy2_breadcrumbs(); ?>
            <span class="archive-kicker"><?php esc_html_e( 'Category', 'computerjy2' ); ?></span>
            <h1 style="margin:12px 0 10px"><?php echo esc_html( single_cat_title( '', false ) ); ?></h1>
            <?php if ( category_description() ) : ?>
                <div class="archive-description" style="margin:0"><?php echo wp_kses_post( category_description() ); ?></div>
            <?php endif; ?>
            <p class="entry-meta-mono" style="margin-top:12px">
                <?php
                /* translators: %d: post count */
                printf( esc_html( _n( '%d POST', '%d POSTS', (int) $cjy_term->count, 'computerjy2' ) ), (int) $cjy_term->count );
                ?>
            </p>
        </div>
    </section>

    <div class="container" style="padding-top:22px">
        <?php if ( have_posts() ) : ?>
            <div class="tile-grid grid-3" id="primary-feed">
                <?php
                global $wp_query;
                $cjy_in_grid  = 0;
                $cjy_interval = computerjy2_infeed_interval();
                while ( have_posts() ) :
                    the_post();
                    $cjy_in_grid++;
                    get_template_part( 'template-parts/content', 'card' );
                    if ( 0 === $cjy_in_grid % $cjy_interval && $cjy_in_grid < $wp_query->post_count ) {
                        echo '<div class="feed-slot-row">';
                        computerjy2_slot( 'infeed', __( 'In-feed unit', 'computerjy2' ) );
                        echo '</div>';
                    }
                endwhile;
                ?>
            </div>
            <?php computerjy2_pagination(); ?>
        <?php else : ?>
            <?php get_template_part( 'template-parts/content', 'none' ); ?>
        <?php endif; ?>
    </div>

</main>

<?php
get_footer();
