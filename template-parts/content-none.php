<?php
/**
 * Empty state.
 *
 * @package ComputerJy2
 */
?>
<section class="state-block">
    <div class="state-code">000</div>
    <h2 class="state-title"><?php esc_html_e( 'Nothing here yet', 'computerjy2' ); ?></h2>
    <p class="state-text">
        <?php
        if ( is_search() ) {
            esc_html_e( 'No posts matched that search. Try a shorter phrase or a different keyword.', 'computerjy2' );
        } else {
            esc_html_e( 'No posts have been published in this section.', 'computerjy2' );
        }
        ?>
    </p>
    <div style="max-width:380px;margin:0 auto"><?php get_search_form(); ?></div>
</section>
