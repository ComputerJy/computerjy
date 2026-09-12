<?php
/**
 * Post sidebar: author, trending, categories, tags, sticky slot, widgets.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
?>

<div class="author-card">
    <?php echo get_avatar( get_the_author_meta( 'ID' ), 54 ); ?>
    <div class="author-name"><?php the_author(); ?></div>
    <?php if ( get_the_author_meta( 'description' ) ) : ?>
        <p><?php echo esc_html( get_the_author_meta( 'description' ) ); ?></p>
    <?php endif; ?>
    <p style="margin-top:10px">
        <a class="entry-meta-mono" href="<?php echo esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ); ?>"><?php esc_html_e( 'ALL POSTS →', 'computerjy2' ); ?></a>
    </p>
</div>

<?php
$cjy_trending = computerjy2_trending_posts( 5 );
if ( $cjy_trending->have_posts() ) :
    ?>
    <section class="sidebar-widget widget-cyan">
        <h3 class="widget-title"><?php esc_html_e( 'Trending', 'computerjy2' ); ?></h3>
        <div class="trending-list">
            <?php
            $cjy_rank = 0;
            while ( $cjy_trending->have_posts() ) :
                $cjy_trending->the_post();
                $cjy_rank++;
                ?>
                <div class="trending-item">
                    <span class="trending-rank"><?php echo esc_html( str_pad( $cjy_rank, 2, '0', STR_PAD_LEFT ) ); ?></span>
                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                </div>
                <?php
            endwhile;
            wp_reset_postdata();
            ?>
        </div>
    </section>
    <?php
endif;
?>

<section class="sidebar-widget">
    <h3 class="widget-title"><?php esc_html_e( 'Categories', 'computerjy2' ); ?></h3>
    <ul><?php wp_list_categories( array( 'title_li' => '', 'number' => 8, 'show_count' => true ) ); ?></ul>
</section>

<?php
$cjy_tags = get_tags( array( 'number' => 12, 'orderby' => 'count', 'order' => 'DESC' ) );
if ( $cjy_tags ) :
    ?>
    <section class="sidebar-widget">
        <h3 class="widget-title"><?php esc_html_e( 'Tags', 'computerjy2' ); ?></h3>
        <div class="tag-list">
            <?php
            foreach ( $cjy_tags as $cjy_tag ) {
                printf( '<a class="tag-chip" href="%1$s">%2$s</a>', esc_url( get_tag_link( $cjy_tag->term_id ) ), esc_html( $cjy_tag->name ) );
            }
            ?>
        </div>
    </section>
    <?php
endif;
?>

<div class="is-sticky-slot">
    <?php computerjy2_slot( 'sidebar', __( 'Sidebar unit', 'computerjy2' ) ); ?>
    <?php
    if ( is_active_sidebar( 'sidebar-1' ) ) {
        dynamic_sidebar( 'sidebar-1' );
    }
    ?>
</div>
