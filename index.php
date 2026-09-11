<?php
/**
 * Main index: lead block + chronological Latest feed.
 *
 * @package ComputerJy2
 */

get_header();
?>

<main id="primary-content" class="container" role="main">

    <?php computerjy2_slot( 'leaderboard', __( 'Leaderboard', 'computerjy2' ) ); ?>

    <?php if ( is_home() && ! is_paged() ) : ?>
        <?php computerjy2_eyebrow_strip(); ?>
    <?php else : ?>
        <?php computerjy2_breadcrumbs(); ?>
    <?php endif; ?>

    <?php if ( have_posts() ) : ?>

        <?php
        global $wp_query;
        $cjy_index    = 0;
        $cjy_interval = computerjy2_infeed_interval();
        $cjy_lead     = ( is_home() && ! is_paged() );

        // The lead block only exists on page 1: one lead card plus three side cards.
        if ( $cjy_lead ) :
            $cjy_side = array();
            while ( have_posts() && count( $cjy_side ) < 3 ) :
                the_post();
                $cjy_index++;
                if ( 1 === $cjy_index ) {
                    ob_start();
                    get_template_part( 'template-parts/content', 'lead' );
                    $cjy_lead_html = ob_get_clean();
                } else {
                    ob_start();
                    get_template_part( 'template-parts/content', 'side' );
                    $cjy_side[] = ob_get_clean();
                }
            endwhile;
            ?>
            <section class="lead-block" aria-label="<?php esc_attr_e( 'Featured', 'computerjy2' ); ?>">
                <?php echo $cjy_lead_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                <div class="lead-side">
                    <?php foreach ( $cjy_side as $cjy_card ) { echo $cjy_card; } // phpcs:ignore ?>
                </div>
            </section>
        <?php endif; ?>

        <div class="section-header-bar">
            <h2 class="section-heading"><?php esc_html_e( 'Latest', 'computerjy2' ); ?></h2>
            <div class="section-rule"></div>
            <span class="section-count"><?php echo esc_html( get_query_var( 'posts_per_page' ) ); ?> / <?php esc_html_e( 'page', 'computerjy2' ); ?></span>
        </div>

        <div class="tile-grid grid-3" id="primary-feed">
            <?php
            $cjy_in_grid = 0;
            while ( have_posts() ) :
                the_post();
                $cjy_in_grid++;
                get_template_part( 'template-parts/content', 'card' );

                // A filled slot spans the full grid row so the tile rhythm survives.
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

</main>

<?php
get_footer();
