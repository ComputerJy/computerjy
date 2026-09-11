<?php
/**
 * Page content.
 *
 * @package ComputerJy2
 */
?>
<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
    <header style="padding-bottom:16px;border-bottom:1px solid var(--border-color);margin-bottom:22px">
        <h1 class="entry-title" style="font-size:clamp(28px,4vw,40px);margin:0"><?php the_title(); ?></h1>
    </header>

    <?php if ( has_post_thumbnail() && ! is_front_page() ) : ?>
        <div class="post-thumb" style="margin-bottom:22px"><?php the_post_thumbnail( 'computerjy2-lead' ); ?></div>
    <?php endif; ?>

    <div class="entry-content">
        <?php
        the_content();
        wp_link_pages( array( 'before' => '<div class="page-links entry-meta-mono">', 'after' => '</div>' ) );
        ?>
    </div>

    <?php if ( get_edit_post_link() ) : ?>
        <footer style="margin-top:18px">
            <?php edit_post_link( esc_html__( 'Edit', 'computerjy2' ), '<span class="entry-meta-mono">', '</span>' ); ?>
        </footer>
    <?php endif; ?>
</article>
