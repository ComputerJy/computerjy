<?php
/**
 * ComputerJy World - Single Post Template
 *
 * @package ComputerJy
 */

get_header();
?>

<main id="primary-content" class="main-layout" role="main">
    <div class="container">
        
        <div class="layout-grid">
            <!-- Article Content Column -->
            <div class="content-area">
                <?php
                while ( have_posts() ) :
                    the_post();

                    get_template_part( 'template-parts/content', 'single' );

                    // Related Posts Section
                    $categories = get_the_category();
                    if ( ! empty( $categories ) ) {
                        $cat_ids = wp_list_pluck( $categories, 'term_id' );
                        $related_query = new WP_Query( array(
                            'category__in'        => $cat_ids,
                            'post__not_in'        => array( get_the_ID() ),
                            'posts_per_page'      => 3,
                            'ignore_sticky_posts' => 1,
                        ) );

                        if ( $related_query->have_posts() ) :
                            ?>
                            <section class="related-posts-section">
                                <div class="section-header-bar">
                                    <h3 class="section-heading" style="font-size: 1.25rem;">
                                        <span class="section-icon"></span>
                                        <?php esc_html_e( 'Related Articles', 'computerjy' ); ?>
                                    </h3>
                                </div>
                                <div class="related-posts-grid">
                                    <?php
                                    while ( $related_query->have_posts() ) :
                                        $related_query->the_post();
                                        ?>
                                        <article class="post-card" style="font-size: 0.9rem;">
                                            <a href="<?php the_permalink(); ?>" class="card-media-wrapper" style="aspect-ratio: 16/10;">
                                                <?php if ( has_post_thumbnail() ) : ?>
                                                    <?php the_post_thumbnail( 'computerjy-thumb-small', array( 'class' => 'card-media-img' ) ); ?>
                                                <?php else : ?>
                                                    <div style="width:100%; height:100%; min-height:120px; background:var(--bg-subtle); display:flex; align-items:center; justify-content:center;">
                                                        <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/logo-icon.svg' ); ?>" style="width:36px; height:36px; opacity:0.6;">
                                                    </div>
                                                <?php endif; ?>
                                            </a>
                                            <div class="card-body" style="padding: 1rem;">
                                                <div class="card-meta" style="font-size: 0.75rem; margin-bottom: 0.4rem;">
                                                    <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
                                                </div>
                                                <h4 class="card-title" style="font-size: 0.95rem; margin-bottom: 0.5rem; line-height: 1.35;">
                                                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                                                </h4>
                                            </div>
                                        </article>
                                        <?php
                                    endwhile;
                                    wp_reset_postdata();
                                    ?>
                                </div>
                            </section>
                            <?php
                        endif;
                    }

                    // Comments Section
                    if ( comments_open() || get_comments_number() ) :
                        comments_template();
                    endif;

                endwhile;
                ?>
            </div>

            <!-- Sidebar Column -->
            <aside class="sidebar-column">
                <?php get_sidebar(); ?>
            </aside>
        </div>

    </div>
</main>

<?php
get_footer();
