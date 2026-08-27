<?php
/**
 * Template part for displaying page content
 *
 * @package ComputerJy
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class( 'single-post-article' ); ?>>
    <header class="single-post-header">
        <?php computerjy_breadcrumbs(); ?>
        <h1 class="single-post-title"><?php the_title(); ?></h1>
    </header>

    <?php if ( has_post_thumbnail() ) : ?>
        <div class="single-featured-media">
            <?php the_post_thumbnail( 'computerjy-featured-large', array( 'alt' => the_title_attribute( array( 'echo' => false ) ) ) ); ?>
        </div>
    <?php endif; ?>

    <div class="article-content">
        <?php
        the_content();

        wp_link_pages( array(
            'before' => '<div class="page-links"><span class="page-links-title">' . esc_html__( 'Pages:', 'computerjy' ) . '</span>',
            'after'  => '</div>',
        ) );
        ?>
    </div>
</article>
