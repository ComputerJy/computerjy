<?php
/**
 * Sidebar list of up to five articles with thumbnails.
 *
 * @package ComputerJy2
 *
 * @var array $args title, query (WP_Query), ranked (bool), exclude (post ID).
 */

$cjy_list = $args['query'];
if ( ! $cjy_list->have_posts() ) {
    return;
}

$cjy_rank = 0;
?>
<section class="sidebar-widget<?php echo empty( $args['ranked'] ) ? '' : ' widget-cyan'; ?>">
    <h3 class="widget-title"><?php echo esc_html( $args['title'] ); ?></h3>
    <div class="rail-list">
        <?php
        while ( $cjy_list->have_posts() && $cjy_rank < 5 ) :
            $cjy_list->the_post();
            if ( get_the_ID() === ( $args['exclude'] ?? 0 ) ) {
                continue;
            }
            $cjy_rank++;
            ?>
            <div class="rail-item">
                <a href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true"><?php computerjy2_thumb( 'computerjy2-side' ); ?></a>
                <div>
                    <?php if ( ! empty( $args['ranked'] ) ) : ?>
                        <span class="rail-rank"><?php echo esc_html( str_pad( $cjy_rank, 2, '0', STR_PAD_LEFT ) ); ?></span>
                    <?php endif; ?>
                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                </div>
            </div>
            <?php
        endwhile;
        wp_reset_postdata();
        ?>
    </div>
</section>
