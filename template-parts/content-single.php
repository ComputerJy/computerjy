<?php
/**
 * Template part for displaying single post content
 *
 * @package ComputerJy
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class( 'single-post-article' ); ?>>
    
    <!-- Post Header -->
    <header class="single-post-header">
        <?php computerjy_breadcrumbs(); ?>

        <div style="margin-bottom: 0.85rem;">
            <?php echo wp_kses_post( computerjy_get_category_badge( get_the_ID() ) ); ?>
        </div>

        <h1 class="single-post-title"><?php the_title(); ?></h1>

        <div class="single-post-meta">
            <div class="meta-author-wrap">
                <?php echo get_avatar( get_the_author_meta( 'ID' ), 42, '', '', array( 'class' => 'author-avatar-img', 'style' => 'width: 42px; height: 42px;' ) ); ?>
                <div>
                    <div style="font-weight: 700; font-size: 0.95rem;"><?php the_author(); ?></div>
                    <div style="font-size: 0.82rem; color: var(--text-muted);">
                        <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
                        &bull; <?php echo esc_html( computerjy_reading_time() ); ?>
                    </div>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
                <a href="#comments" class="badge-glow" style="font-size: 0.8rem; text-decoration: none;">
                    💬 <?php comments_number( '0 Comments', '1 Comment', '% Comments' ); ?>
                </a>
            </div>
        </div>
    </header>

    <!-- Featured Image -->
    <?php if ( has_post_thumbnail() ) : ?>
        <div class="single-featured-media">
            <?php the_post_thumbnail( 'computerjy-featured-large', array( 'alt' => the_title_attribute( array( 'echo' => false ) ) ) ); ?>
        </div>
    <?php endif; ?>

    <!-- Article Content -->
    <div class="article-content">
        <?php
        the_content();

        wp_link_pages( array(
            'before' => '<div class="page-links"><span class="page-links-title">' . esc_html__( 'Pages:', 'computerjy' ) . '</span>',
            'after'  => '</div>',
        ) );
        ?>
    </div>

    <!-- Tags Cloud -->
    <?php
    $tags = get_the_tags();
    if ( ! empty( $tags ) ) :
        ?>
        <div style="margin-top: 2rem; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-muted);"><?php esc_html_e( 'Tagged with:', 'computerjy' ); ?></span>
            <?php foreach ( $tags as $tag ) : ?>
                <a href="<?php echo esc_url( get_tag_link( $tag->term_id ) ); ?>" class="tag-badge">#<?php echo esc_html( $tag->name ); ?></a>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <!-- Social Share Bar -->
    <div class="post-share-bar">
        <div style="font-weight: 700; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
            <span>🚀 <?php esc_html_e( 'Share this article:', 'computerjy' ); ?></span>
        </div>
        <div class="share-buttons-group">
            <a href="https://twitter.com/intent/tweet?text=<?php echo urlencode( get_the_title() ); ?>&url=<?php echo urlencode( get_permalink() ); ?>" target="_blank" rel="noopener noreferrer" class="share-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>X / Twitter</span>
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode( get_permalink() ); ?>" target="_blank" rel="noopener noreferrer" class="share-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
            </a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=<?php echo urlencode( get_permalink() ); ?>" target="_blank" rel="noopener noreferrer" class="share-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 1.45-1.45 1.45 1.45 0 0 0-1.45-1.45 1.45 1.45 0 0 0-1.45 1.45 1.45 1.45 0 0 0 1.45 1.45m1.37 9.74v-8.37H5.09v8.37h2.74z"/>
                </svg>
                <span>LinkedIn</span>
            </a>
            <button type="button" class="share-btn share-btn-copy">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Link</span>
            </button>
        </div>
    </div>

    <!-- Author Box -->
    <div class="post-author-box">
        <?php echo get_avatar( get_the_author_meta( 'ID' ), 80, '', '', array( 'class' => 'author-box-avatar' ) ); ?>
        <div>
            <h4 style="font-size: 1.15rem; margin-bottom: 4px;">Written by <?php the_author(); ?></h4>
            <div style="font-size: 0.85rem; color: var(--brand-blue); font-weight: 600; margin-bottom: 0.5rem;">Founder &amp; Creator of ComputerJy World</div>
            <p style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.6;">
                <?php 
                $author_desc = get_the_author_meta( 'description' );
                echo esc_html( $author_desc ? $author_desc : 'Sharing thoughts on tech, computer insights, software tools, internet culture, and entertainment since 2007.' );
                ?>
            </p>
        </div>
    </div>

    <!-- Post Navigation Cards -->
    <div class="post-navigation-cards">
        <?php
        $prev_post = get_previous_post();
        if ( ! empty( $prev_post ) ) :
            ?>
            <a href="<?php echo esc_url( get_permalink( $prev_post->ID ) ); ?>" class="nav-card">
                <div class="nav-card-label">&larr; Previous Article</div>
                <div class="nav-card-title"><?php echo esc_html( get_the_title( $prev_post->ID ) ); ?></div>
            </a>
        <?php else : ?>
            <div></div>
        <?php endif; ?>

        <?php
        $next_post = get_next_post();
        if ( ! empty( $next_post ) ) :
            ?>
            <a href="<?php echo esc_url( get_permalink( $next_post->ID ) ); ?>" class="nav-card" style="text-align: right;">
                <div class="nav-card-label">Next Article &rarr;</div>
                <div class="nav-card-title"><?php echo esc_html( get_the_title( $next_post->ID ) ); ?></div>
            </a>
        <?php endif; ?>
    </div>

</article>
