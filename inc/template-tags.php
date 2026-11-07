<?php
/**
 * Template tags: meta, chips, breadcrumbs, pagination, cards.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Word count that sees Arabic and other non-Latin text — str_word_count()
 * only counts Latin letters.
 *
 * @param string $text HTML or plain text.
 * @return int
 */
function computerjy2_word_count( $text ) {
    $n = preg_match_all( '/\S+/u', wp_strip_all_tags( $text ) );
    return false === $n ? 0 : $n;
}

/**
 * Reading time string.
 */
function computerjy2_reading_time( $post_id = null ) {
    $post_id = $post_id ? $post_id : get_the_ID();
    $words   = computerjy2_word_count( get_post_field( 'post_content', $post_id ) );
    $minutes = max( 1, (int) ceil( $words / 200 ) );
    /* translators: %d: minutes */
    return sprintf( _n( '%d MIN', '%d MIN', $minutes, 'computerjy2' ), $minutes );
}

/**
 * Primary category object for a post.
 */
function computerjy2_primary_category( $post_id = null ) {
    // Respect Yoast / Rank Math primary-term selection when present.
    $post_id = $post_id ? $post_id : get_the_ID();
    $primary = get_post_meta( $post_id, '_yoast_wpseo_primary_category', true );
    if ( ! $primary ) {
        $primary = get_post_meta( $post_id, 'rank_math_primary_category', true );
    }
    if ( $primary ) {
        $term = get_term( (int) $primary, 'category' );
        if ( $term && ! is_wp_error( $term ) ) { return $term; }
    }
    $cats = get_the_category( $post_id );
    return ! empty( $cats ) ? $cats[0] : null;
}

/**
 * Category chip markup. $style: 'solid' (default) or 'text'.
 */
function computerjy2_category_chip( $post_id = null ) {
    $term = computerjy2_primary_category( $post_id );
    if ( ! $term ) { return ''; }

    $modifier = '';
    $slug     = strtolower( $term->slug );
    if ( in_array( $slug, array( 'entertainment', 'fun', 'humor' ), true ) ) {
        $modifier = ' badge-entertainment';
    } elseif ( in_array( $slug, array( 'education', 'science', 'software', 'reviews' ), true ) ) {
        $modifier = ' badge-education';
    } elseif ( in_array( $slug, array( 'news', 'seo' ), true ) ) {
        $modifier = ' badge-news';
    }

    return sprintf(
        '<a href="%1$s" class="category-badge%2$s">%3$s</a>',
        esc_url( get_category_link( $term->term_id ) ),
        esc_attr( $modifier ),
        esc_html( $term->name )
    );
}

/**
 * Breadcrumbs. Defers to Yoast / Rank Math when either is active.
 */
function computerjy2_breadcrumbs() {
    if ( is_front_page() ) { return; }

    if ( function_exists( 'yoast_breadcrumb' ) ) {
        yoast_breadcrumb( '<nav class="breadcrumbs-trail yoast-breadcrumb" aria-label="' . esc_attr__( 'Breadcrumbs', 'computerjy2' ) . '">', '</nav>' );
        return;
    }
    if ( function_exists( 'rank_math_the_breadcrumbs' ) ) {
        echo '<nav class="breadcrumbs-trail rank-math-breadcrumb" aria-label="' . esc_attr__( 'Breadcrumbs', 'computerjy2' ) . '">';
        rank_math_the_breadcrumbs();
        echo '</nav>';
        return;
    }

    echo '<nav class="breadcrumbs-trail" aria-label="' . esc_attr__( 'Breadcrumbs', 'computerjy2' ) . '">';
    echo '<a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'Home', 'computerjy2' ) . '</a>';

    if ( is_singular( 'post' ) ) {
        $term = computerjy2_primary_category();
        if ( $term ) {
            echo '<span class="sep">/</span><a href="' . esc_url( get_category_link( $term->term_id ) ) . '">' . esc_html( $term->name ) . '</a>';
        }
        echo '<span class="sep">/</span><span>' . esc_html( wp_trim_words( get_the_title(), 7, '' ) ) . '</span>';
    } elseif ( is_category() || is_tag() || is_tax() ) {
        echo '<span class="sep">/</span><span>' . esc_html( single_term_title( '', false ) ) . '</span>';
    } elseif ( is_author() ) {
        echo '<span class="sep">/</span><span>' . esc_html( get_the_author() ) . '</span>';
    } elseif ( is_date() ) {
        echo '<span class="sep">/</span><span>' . esc_html( get_the_archive_title() ) . '</span>';
    } elseif ( is_search() ) {
        /* translators: %s: search term */
        echo '<span class="sep">/</span><span>' . esc_html( sprintf( __( 'Search: %s', 'computerjy2' ), get_search_query() ) ) . '</span>';
    } elseif ( is_404() ) {
        echo '<span class="sep">/</span><span>' . esc_html__( 'Error 404', 'computerjy2' ) . '</span>';
    } elseif ( is_page() ) {
        echo '<span class="sep">/</span><span>' . esc_html( get_the_title() ) . '</span>';
    }

    echo '</nav>';
}

/**
 * Numeric pagination.
 */
function computerjy2_pagination() {
    the_posts_pagination( array(
        'mid_size'           => 2,
        'prev_text'          => esc_html__( '← PREV', 'computerjy2' ),
        'next_text'          => esc_html__( 'NEXT →', 'computerjy2' ),
        'screen_reader_text' => esc_html__( 'Posts navigation', 'computerjy2' ),
        'class'              => 'pagination-wrapper',
    ) );
}

/**
 * The slim eyebrow strip that replaces the old hero.
 */
function computerjy2_eyebrow_strip() {
    $tagline = get_theme_mod( 'computerjy2_tagline', get_bloginfo( 'description' ) );
    ?>
    <div class="eyebrow-strip">
        <span class="sparkle" aria-hidden="true">✨</span>
        <span class="eyebrow-tagline"><?php echo esc_html( $tagline ); ?></span>
        <span class="eyebrow-date"><?php echo esc_html( date_i18n( 'Y-m-d' ) ); ?></span>
    </div>
    <?php
}

/**
 * Byline links row. $position: 'top' | 'bottom'.
 */
function computerjy2_byline_links( $position = 'top' ) {
    $bottom = 'bottom' === $position;
    ?>
    <div class="<?php echo esc_attr( $bottom ? 'byline-links post-links-group' : 'byline-links' ); ?>">
        <?php if ( $bottom ) : ?>
            <span class="post-links-label"><?php esc_html_e( 'Share this article', 'computerjy2' ); ?></span>
        <?php endif; ?>
        <?php foreach ( computerjy2_post_link_targets( get_permalink(), get_the_title() ) as $cjy_net => $cjy_target ) : ?>
            <a class="net-link net-<?php echo esc_attr( $cjy_net ); ?>" href="<?php echo esc_url( $cjy_target['href'] ); ?>" aria-label="<?php echo esc_attr( $cjy_target['label'] ); ?>" title="<?php echo esc_attr( $cjy_target['label'] ); ?>"<?php echo 'email' === $cjy_net ? '' : ' target="_blank" rel="noopener noreferrer"'; ?>>
                <?php echo computerjy2_icon( $cjy_net ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
            </a>
        <?php endforeach; ?>
        <button class="net-link" type="button" data-copy-link="<?php echo esc_url( get_permalink() ); ?>" aria-label="<?php esc_attr_e( 'Copy link', 'computerjy2' ); ?>" title="<?php esc_attr_e( 'Copy link', 'computerjy2' ); ?>">
            <?php echo computerjy2_icon( 'link' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
        </button>
    </div>
    <?php
}

/**
 * Where a reader can send an article, in display order.
 *
 * Plain links, not the networks' own widgets: those load third-party scripts
 * on every article. Labels stay untranslated brand names so this runs from
 * the CLI tests.
 *
 * @param string $permalink Article address.
 * @param string $title     Article title.
 * @return array<string, array{label: string, href: string}>
 */
function computerjy2_post_link_targets( $permalink, $title ) {
    $url  = rawurlencode( $permalink );
    $text = rawurlencode( $title );

    return array(
        'x'        => array( 'label' => 'Share on X', 'href' => "https://twitter.com/intent/tweet?url={$url}&text={$text}" ),
        'facebook' => array( 'label' => 'Share on Facebook', 'href' => "https://www.facebook.com/sharer/sharer.php?u={$url}" ),
        'linkedin' => array( 'label' => 'Share on LinkedIn', 'href' => "https://www.linkedin.com/sharing/share-offsite/?url={$url}" ),
        'reddit'   => array( 'label' => 'Share on Reddit', 'href' => "https://www.reddit.com/submit?url={$url}&title={$text}" ),
        'whatsapp' => array( 'label' => 'Share on WhatsApp', 'href' => "https://wa.me/?text={$text}%20{$url}" ),
        'telegram' => array( 'label' => 'Share on Telegram', 'href' => "https://t.me/share/url?url={$url}&text={$text}" ),
        'email'    => array( 'label' => 'Share by email', 'href' => "mailto:?subject={$text}&body={$url}" ),
    );
}

/**
 * The tags a card shows: the rarest first, because broad ones like Computers
 * sit on most posts and say nothing about this one.
 *
 * @param array $tags Term objects.
 * @return array At most three terms.
 */
function computerjy2_pick_card_tags( $tags ) {
    usort( $tags, fn( $a, $b ) => $a->count <=> $b->count );
    return array_slice( $tags, 0, 3 );
}

/**
 * Card tags row. theme.css hides whichever tags don't fit on one line.
 */
function computerjy2_card_tags() {
    $tags = get_the_tags();
    if ( ! $tags || is_wp_error( $tags ) ) {
        return;
    }

    echo '<div class="card-tags">';
    foreach ( computerjy2_pick_card_tags( $tags ) as $tag ) {
        printf( '<a href="%1$s">%2$s</a>', esc_url( get_tag_link( $tag ) ), esc_html( $tag->name ) );
    }
    echo '</div>';
}

/**
 * Publish date under a card title. The archive reaches back to 2008, so an
 * undated card would pass old advice off as current.
 */
function computerjy2_card_date() {
    printf( '<time class="card-date" datetime="%1$s">%2$s</time>', esc_attr( get_the_date( 'c' ) ), esc_html( get_the_date( 'Y-m-d' ) ) );
}

/**
 * Newsletter signup. Empty when Jetpack Subscriptions is off, so callers can
 * drop the surrounding copy too.
 *
 * @return string Markup rendered by Jetpack.
 */
function computerjy2_newsletter_form() {
    if ( ! shortcode_exists( 'jetpack_subscription_form' ) ) {
        return '';
    }
    return do_shortcode( '[jetpack_subscription_form show_only_email_and_button="true" show_subscribers_total="false" submit_button_text="Join" subscribe_placeholder="you@email.com"]' );
}

/**
 * Fallback image for posts without a featured image: the Customizer upload
 * if one is set, else the branded placeholder shipped with the theme.
 *
 * @param string $size Registered image size for the uploaded fallback.
 * @return string URL.
 */
function computerjy2_fallback_image_url( $size = 'computerjy2-card' ) {
    $id = absint( get_theme_mod( 'computerjy2_fallback_image', 0 ) );
    if ( $id ) {
        $url = wp_get_attachment_image_url( $id, $size );
        if ( $url ) {
            return $url;
        }
    }
    return get_template_directory_uri() . '/assets/images/post-placeholder.svg';
}

/**
 * Featured image, or the fallback image for posts that have none.
 *
 * Core picks loading / fetchpriority / decoding and the media-library alt;
 * pass $attr to override (the lead card sets fetchpriority=high).
 *
 * @param string $size Image size.
 * @param array  $attr Extra <img> attributes.
 */
function computerjy2_thumb( $size = 'computerjy2-card', $attr = array() ) {
    echo '<div class="post-thumb">';
    if ( has_post_thumbnail() ) {
        the_post_thumbnail( $size, $attr );
    } else {
        printf(
            '<img class="post-thumb-fallback" src="%s" alt="" loading="lazy" decoding="async">',
            esc_url( computerjy2_fallback_image_url( $size ) )
        );
    }
    echo '</div>';
}

/**
 * Site name with the brand accent in cyan ("Computer" + "Jy" + " World").
 * The accent is filterable for other site names.
 */
function computerjy2_brand_mark() {
    $name   = get_bloginfo( 'name' );
    $accent = (string) apply_filters( 'computerjy2_brand_accent', 'Jy' );
    $at     = '' === $accent ? false : mb_strpos( $name, $accent );

    if ( false === $at ) {
        return esc_html( $name );
    }

    return esc_html( mb_substr( $name, 0, $at ) )
        . '<span class="brand-accent">' . esc_html( $accent ) . '</span>'
        . esc_html( mb_substr( $name, $at + mb_strlen( $accent ) ) );
}
