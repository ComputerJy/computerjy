<?php
/**
 * Single post: full-bleed tinted header, reading column, sticky sidebar.
 *
 * @package ComputerJy2
 */

get_header();

while ( have_posts() ) :
    the_post();
    $cjy_hero = get_theme_mod( 'computerjy2_single_hero', true ) && has_post_thumbnail();
    ?>

    <main id="primary-content" role="main">

        <?php if ( $cjy_hero ) : ?>
            <div class="single-hero">
                <?php the_post_thumbnail( 'computerjy2-hero', array( 'class' => 'hero-img', 'fetchpriority' => 'high' ) ); ?>
                <div class="hero-scrim" aria-hidden="true"></div>
                <div class="hero-copy">
                    <div class="container">
                        <?php computerjy2_breadcrumbs(); ?>
                        <?php echo wp_kses_post( computerjy2_category_chip() ); ?>
                        <h1 class="entry-title"><?php the_title(); ?></h1>
                    </div>
                </div>
            </div>
        <?php else : ?>
            <div class="container single-no-hero">
                <?php computerjy2_breadcrumbs(); ?>
                <?php echo wp_kses_post( computerjy2_category_chip() ); ?>
                <h1 class="entry-title"><?php the_title(); ?></h1>
            </div>
        <?php endif; ?>

        <div class="single-shell">
            <div class="single-main">
                <?php get_template_part( 'template-parts/content', 'single' ); ?>
            </div>

            <aside class="single-aside" role="complementary">
                <?php get_sidebar(); ?>
            </aside>
        </div>

    </main>

    <?php
endwhile;

get_footer();
