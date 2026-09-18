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

    <section class="landing-hero landing-hero--left">
        <div class="container">
            <?php computerjy2_breadcrumbs(); ?>
            <span class="archive-kicker"><?php esc_html_e( 'Category', 'computerjy2' ); ?></span>
            <h1><?php echo esc_html( single_cat_title( '', false ) ); ?></h1>
            <?php if ( category_description() ) : ?>
                <div class="archive-description"><?php echo wp_kses_post( category_description() ); ?></div>
            <?php endif; ?>
            <p class="entry-meta-mono">
                <?php
                /* translators: %d: post count */
                printf( esc_html( _n( '%d POST', '%d POSTS', (int) $cjy_term->count, 'computerjy2' ) ), (int) $cjy_term->count );
                ?>
            </p>
        </div>
    </section>

    <div class="container archive-feed">
        <?php if ( have_posts() ) : ?>
            <?php get_template_part( 'template-parts/feed', 'grid' ); ?>
        <?php else : ?>
            <?php get_template_part( 'template-parts/content', 'none' ); ?>
        <?php endif; ?>
    </div>

</main>

<?php
get_footer();
