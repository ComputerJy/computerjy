<?php
/**
 * Template Name: Landing page
 * Template Post Type: page
 *
 * Edge-to-edge: hero band from the title and excerpt, then block content with
 * no chrome, so wide/full-aligned blocks run to the viewport edge.
 *
 * @package ComputerJy2
 */

get_header();
?>

<main id="primary-content" role="main">
    <?php
    while ( have_posts() ) :
        the_post();
        ?>
        <section class="landing-hero">
            <div class="container">
                <span class="archive-kicker"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></span>
                <h1><?php the_title(); ?></h1>
                <?php if ( has_excerpt() ) : ?>
                    <p><?php echo esc_html( get_the_excerpt() ); ?></p>
                <?php endif; ?>
            </div>
        </section>

        <?php if ( has_post_thumbnail() ) : ?>
            <div class="post-thumb"><?php the_post_thumbnail( 'computerjy2-hero' ); ?></div>
        <?php endif; ?>

        <div class="page-shell page-shell-wide">
            <div class="entry-content">
                <?php
                the_content();
                wp_link_pages( array( 'before' => '<div class="page-links">', 'after' => '</div>' ) );
                ?>
            </div>
        </div>
        <?php
    endwhile;
    ?>
</main>

<?php
get_footer();
