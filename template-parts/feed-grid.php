<?php
/**
 * The card grid with the in-feed slot every N cards, plus pagination.
 * Continues the main loop from wherever the caller left it (index.php has
 * already consumed the lead block on page 1).
 *
 * Jetpack infinite scroll keeps its own loop in inc/plugin-compat.php: it
 * must not emit slots.
 *
 * @package ComputerJy2
 */

global $wp_query;
$cjy_in_grid  = 0;
$cjy_interval = computerjy2_infeed_interval();
?>
<div class="tile-grid grid-3" id="primary-feed">
    <?php
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
