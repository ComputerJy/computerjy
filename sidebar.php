<?php
/**
 * Post sidebar: author, trending, latest, then a sticky signup, slot and widgets.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

$cjy_current = get_the_ID();
?>

<div class="author-card">
    <?php echo get_avatar( get_the_author_meta( 'ID' ), 54 ); ?>
    <div>
        <div class="author-name"><?php the_author(); ?></div>
        <a class="entry-meta-mono" href="<?php echo esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ); ?>"><?php esc_html_e( 'ALL POSTS →', 'computerjy2' ); ?></a>
    </div>
</div>

<?php
get_template_part( 'template-parts/sidebar', 'list', array(
    'title'  => __( 'Trending', 'computerjy2' ),
    'query'  => computerjy2_trending_posts( 5 ),
    'ranked' => true,
) );

// One extra, because the current article is left out of Latest.
get_template_part( 'template-parts/sidebar', 'list', array(
    'title'   => __( 'Latest', 'computerjy2' ),
    'query'   => computerjy2_recent_posts( 6 ),
    'exclude' => $cjy_current,
) );
?>

<div class="is-sticky-slot">
    <?php $cjy_signup = computerjy2_newsletter_form(); ?>
    <?php if ( $cjy_signup ) : ?>
        <section class="sidebar-widget">
            <h3 class="widget-title"><?php esc_html_e( 'Newsletter', 'computerjy2' ); ?></h3>
            <p class="widget-copy"><?php esc_html_e( 'One email when something worth reading goes up.', 'computerjy2' ); ?></p>
            <div class="newsletter-box"><?php echo $cjy_signup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
        </section>
    <?php endif; ?>
    <?php computerjy2_slot( 'sidebar', __( 'Sidebar unit', 'computerjy2' ) ); ?>
    <?php
    if ( is_active_sidebar( 'sidebar-1' ) ) {
        dynamic_sidebar( 'sidebar-1' );
    }
    ?>
</div>
