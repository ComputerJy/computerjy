<?php
/**
 * Archive: category, tag, author, date, custom taxonomy.
 *
 * @package ComputerJy2
 */

get_header();
?>

<main id="primary-content" class="container" role="main">

    <?php computerjy2_slot( 'leaderboard', __( 'Leaderboard', 'computerjy2' ) ); ?>
    <?php computerjy2_breadcrumbs(); ?>

    <header class="archive-header">
        <span class="archive-kicker">
            <?php
            if ( is_category() )      { esc_html_e( 'Category', 'computerjy2' ); }
            elseif ( is_tag() )       { esc_html_e( 'Tag', 'computerjy2' ); }
            elseif ( is_author() )    { esc_html_e( 'Author', 'computerjy2' ); }
            elseif ( is_date() )      { esc_html_e( 'Archive', 'computerjy2' ); }
            else                      { esc_html_e( 'Archive', 'computerjy2' ); }
            ?>
        </span>
        <h1 class="archive-title"><?php echo esc_html( wp_strip_all_tags( get_the_archive_title() ) ); ?></h1>
        <?php
        $cjy_desc = get_the_archive_description();
        if ( $cjy_desc ) {
            echo '<div class="archive-description">' . wp_kses_post( $cjy_desc ) . '</div>';
        }
        ?>
        <p class="entry-meta-mono">
            <?php
            global $wp_query;
            /* translators: %d: post count */
            printf( esc_html( _n( '%d POST', '%d POSTS', (int) $wp_query->found_posts, 'computerjy2' ) ), (int) $wp_query->found_posts );
            ?>
        </p>
    </header>

    <?php if ( have_posts() ) : ?>
        <div class="section-header-bar section-header-bar--spaced">
            <h2 class="section-heading"><?php esc_html_e( 'Posts', 'computerjy2' ); ?></h2>
            <div class="section-rule"></div>
        </div>

        <?php get_template_part( 'template-parts/feed', 'grid' ); ?>
    <?php else : ?>
        <?php get_template_part( 'template-parts/content', 'none' ); ?>
    <?php endif; ?>

</main>

<?php
get_footer();
