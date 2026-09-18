<?php
/**
 * Page content.
 *
 * @package ComputerJy2
 */
?>
<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
    <header class="page-header">
        <h1 class="entry-title"><?php the_title(); ?></h1>
    </header>

    <?php if ( has_post_thumbnail() && ! is_front_page() ) : ?>
        <div class="post-thumb page-thumb"><?php the_post_thumbnail( 'computerjy2-lead' ); ?></div>
    <?php endif; ?>

    <div class="entry-content">
        <?php
        the_content();
        wp_link_pages( array( 'before' => '<div class="page-links entry-meta-mono">', 'after' => '</div>' ) );
        ?>
    </div>

    <?php if ( get_edit_post_link() ) : ?>
        <footer class="page-footer">
            <?php edit_post_link( esc_html__( 'Edit', 'computerjy2' ), '<span class="entry-meta-mono">', '</span>' ); ?>
        </footer>
    <?php endif; ?>
</article>
