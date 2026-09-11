<?php
/**
 * Front page. A static front page renders its content; otherwise the feed.
 *
 * @package ComputerJy2
 */

if ( 'page' === get_option( 'show_on_front' ) && get_option( 'page_on_front' ) ) {
    get_header();
    ?>
    <main id="primary-content" role="main">
        <?php computerjy2_slot( 'leaderboard', __( 'Leaderboard', 'computerjy2' ) ); ?>
        <div class="page-shell page-shell-wide">
            <?php
            while ( have_posts() ) :
                the_post();
                get_template_part( 'template-parts/content', 'page' );
            endwhile;
            ?>
        </div>
    </main>
    <?php
    get_footer();
} else {
    require get_template_directory() . '/index.php';
}
