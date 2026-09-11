<?php
/**
 * Single post body: byline, share, content (in-article slot injected by filter),
 * tags, bottom share, related posts, comments.
 *
 * @package ComputerJy2
 */
?>
<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>

    <div class="byline-row">
        <span class="byline-avatar"><?php echo get_avatar( get_the_author_meta( 'ID' ), 30 ); ?></span>
        <span class="byline-name">
            <a href="<?php echo esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ); ?>"><?php the_author(); ?></a><br>
            <span><?php echo esc_html( get_the_date( 'Y-m-d' ) ); ?> &middot; <?php echo esc_html( computerjy2_reading_time() ); ?></span>
        </span>
        <?php computerjy2_byline_links( 'top' ); ?>
    </div>

    <div class="entry-content">
        <?php
        the_content();
        wp_link_pages( array(
            'before' => '<div class="page-links entry-meta-mono">' . esc_html__( 'PAGES:', 'computerjy2' ) . ' ',
            'after'  => '</div>',
        ) );
        ?>
    </div>

    <div class="post-links-row">
        <?php if ( has_tag() ) : ?>
            <div class="tag-list">
                <?php
                foreach ( get_the_tags() as $cjy_tag ) {
                    printf(
                        '<a class="tag-chip" href="%1$s">%2$s</a>',
                        esc_url( get_tag_link( $cjy_tag->term_id ) ),
                        esc_html( $cjy_tag->name )
                    );
                }
                ?>
            </div>
        <?php endif; ?>
        <?php computerjy2_byline_links( 'bottom' ); ?>
    </div>

    <?php
    the_post_navigation( array(
        'prev_text' => '<span class="entry-meta-mono">' . esc_html__( '← PREVIOUS', 'computerjy2' ) . '</span><br>%title',
        'next_text' => '<span class="entry-meta-mono">' . esc_html__( 'NEXT →', 'computerjy2' ) . '</span><br>%title',
        'class'     => 'post-navigation',
    ) );
    ?>

    <?php if ( get_theme_mod( 'computerjy2_use_theme_related', true ) ) : ?>
        <?php
        $cjy_related = computerjy2_related_posts( get_the_ID(), 3 );
        if ( $cjy_related->have_posts() ) :
            ?>
            <div class="block-kicker"><?php esc_html_e( 'Related', 'computerjy2' ); ?></div>
            <div class="tile-grid grid-3 related-grid">
                <?php
                while ( $cjy_related->have_posts() ) :
                    $cjy_related->the_post();
                    ?>
                    <div class="related-item">
                        <?php computerjy2_thumb( 'computerjy2-side' ); ?>
                        <h4><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h4>
                    </div>
                    <?php
                endwhile;
                wp_reset_postdata();
                ?>
            </div>
            <?php
        endif;
        ?>
    <?php endif; ?>

    <?php
    if ( comments_open() || get_comments_number() ) {
        comments_template();
    }
    ?>
</article>
