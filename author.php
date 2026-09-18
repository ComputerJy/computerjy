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

    <section class="landing-hero landing-hero--left">
        <div class="container">
            <?php computerjy2_breadcrumbs(); ?>
            <div class="author-hero">
                <?php echo get_avatar( $cjy_author->ID, 96, '', '', array( 'class' => 'author-hero-avatar' ) ); ?>
                <div class="author-hero-body">
                    <span class="archive-kicker"><?php esc_html_e( 'Author', 'computerjy2' ); ?></span>
                    <h1><?php echo esc_html( get_the_author_meta( 'display_name', $cjy_author->ID ) ); ?></h1>
                    <?php if ( get_the_author_meta( 'description', $cjy_author->ID ) ) : ?>
                        <p class="author-hero-bio"><?php echo esc_html( get_the_author_meta( 'description', $cjy_author->ID ) ); ?></p>
                    <?php endif; ?>
                    <p class="entry-meta-mono">
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

    <div class="container archive-feed">
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
