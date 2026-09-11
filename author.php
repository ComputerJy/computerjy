<?php
/**
 * Author profile page.
 *
 * @package ComputerJy2
 */

get_header();
$cjy_author = get_queried_object();
?>

<main id="primary-content" role="main">

    <div class="container"><?php computerjy2_slot( 'leaderboard', __( 'Leaderboard', 'computerjy2' ) ); ?></div>

    <section class="landing-hero" style="text-align:left">
        <div class="container">
            <?php computerjy2_breadcrumbs(); ?>
            <div style="display:flex;gap:18px;align-items:flex-start;margin-top:14px;flex-wrap:wrap">
                <?php echo get_avatar( $cjy_author->ID, 96, '', '', array( 'style' => 'flex:none' ) ); ?>
                <div style="flex:1;min-width:260px">
                    <span class="archive-kicker"><?php esc_html_e( 'Author', 'computerjy2' ); ?></span>
                    <h1 style="margin:10px 0 8px;text-align:left"><?php echo esc_html( get_the_author_meta( 'display_name', $cjy_author->ID ) ); ?></h1>
                    <?php if ( get_the_author_meta( 'description', $cjy_author->ID ) ) : ?>
                        <p style="margin:0;text-align:left;max-width:62ch"><?php echo esc_html( get_the_author_meta( 'description', $cjy_author->ID ) ); ?></p>
                    <?php endif; ?>
                    <p class="entry-meta-mono" style="margin-top:12px">
                        <?php
                        $cjy_count = (int) count_user_posts( $cjy_author->ID, 'post' );
                        /* translators: %d: post count */
                        echo esc_html( sprintf( _n( '%d POST', '%d POSTS', $cjy_count, 'computerjy2' ), $cjy_count ) );
                        ?>
                        <?php if ( get_the_author_meta( 'user_url', $cjy_author->ID ) ) : ?>
                            &middot; <a href="<?php echo esc_url( get_the_author_meta( 'user_url', $cjy_author->ID ) ); ?>" rel="noopener"><?php esc_html_e( 'WEBSITE', 'computerjy2' ); ?></a>
                        <?php endif; ?>
                    </p>
                </div>
            </div>
        </div>
    </section>

    <div class="container" style="padding-top:22px">
        <?php if ( have_posts() ) : ?>
            <div class="tile-grid grid-3" id="primary-feed">
                <?php
                while ( have_posts() ) :
                    the_post();
                    get_template_part( 'template-parts/content', 'card' );
                endwhile;
                ?>
            </div>
            <?php computerjy2_pagination(); ?>
        <?php else : ?>
            <?php get_template_part( 'template-parts/content', 'none' ); ?>
        <?php endif; ?>
    </div>

</main>

<?php
get_footer();
