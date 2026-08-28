<?php
/**
 * Template part for displaying posts in a card grid
 *
 * @package ComputerJy
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-card' ); ?>>
    <!-- Card Media / Thumbnail -->
    <a href="<?php the_permalink(); ?>" class="card-media-wrapper" aria-label="<?php the_title_attribute(); ?>">
        <?php echo wp_kses_post( computerjy_get_category_badge( get_the_ID() ) ); ?>
        <?php if ( has_post_thumbnail() ) : ?>
            <?php the_post_thumbnail( 'computerjy-card', array( 'class' => 'card-media-img', 'alt' => the_title_attribute( array( 'echo' => false ) ) ) ); ?>
        <?php else : ?>
            <div style="width: 100%; height: 100%; min-height: 200px; background: linear-gradient(135deg, rgba(0, 210, 255, 0.15) 0%, rgba(114, 9, 183, 0.15) 100%); display: flex; align-items: center; justify-content: center;">
                <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/logo-icon.svg' ); ?>" alt="ComputerJy" style="width: 64px; height: 64px; opacity: 0.8;">
            </div>
        <?php endif; ?>
    </a>

    <!-- Card Content -->
    <div class="card-body">
        <div class="card-meta">
            <span class="card-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
            </span>
            <span class="meta-dot"></span>
            <span class="card-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <?php echo esc_html( computerjy_reading_time() ); ?>
            </span>
        </div>

        <h3 class="card-title">
            <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
        </h3>

        <div class="card-excerpt">
            <?php the_excerpt(); ?>
        </div>

        <?php
        $tags = get_the_tags();
        if ( ! empty( $tags ) ) :
            ?>
            <div class="card-tags">
                <?php 
                $count = 0;
                foreach ( $tags as $tag ) : 
                    if ( $count >= 3 ) break;
                    $count++;
                    ?>
                    <a href="<?php echo esc_url( get_tag_link( $tag->term_id ) ); ?>" class="tag-badge">#<?php echo esc_html( $tag->name ); ?></a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <div class="card-footer">
            <div class="author-pill">
                <?php echo get_avatar( get_the_author_meta( 'ID' ), 28, '', '', array( 'class' => 'author-avatar-img' ) ); ?>
                <span><?php the_author(); ?></span>
            </div>
            <a href="<?php the_permalink(); ?>" class="read-more-link">
                <?php esc_html_e( 'Read More', 'computerjy' ); ?> &rarr;
            </a>
        </div>
    </div>
</article>
