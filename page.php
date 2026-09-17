<?php
/**
 * Single page (narrow reading shell). A static front page gets the wide
 * shell and the leaderboard slot instead, without breadcrumbs or comments.
 *
 * @package ComputerJy2
 */

$cjy_front = is_front_page();

get_header();
?>

<main id="primary-content" role="main">
    <?php if ( $cjy_front ) : ?>
        <?php computerjy2_slot( 'leaderboard', __( 'Leaderboard', 'computerjy2' ) ); ?>
    <?php else : ?>
        <div class="container"><?php computerjy2_breadcrumbs(); ?></div>
    <?php endif; ?>
    <div class="page-shell<?php echo $cjy_front ? ' page-shell-wide' : ''; ?>">
        <?php
        while ( have_posts() ) :
            the_post();
            get_template_part( 'template-parts/content', 'page' );

            if ( ! $cjy_front && ( comments_open() || get_comments_number() ) ) {
                comments_template();
            }
        endwhile;
        ?>
    </div>
</main>

<?php
get_footer();
