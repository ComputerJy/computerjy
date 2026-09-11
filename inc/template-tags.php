<?php
/**
 * Template tags: meta, chips, breadcrumbs, pagination, cards.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Reading time string.
 */
function computerjy2_reading_time( $post_id = null ) {
    $post_id = $post_id ? $post_id : get_the_ID();
    $words   = str_word_count( wp_strip_all_tags( get_post_field( 'post_content', $post_id ) ) );
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
function computerjy2_category_chip( $post_id = null, $style = 'solid' ) {
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

    if ( 'text' === $style ) {
        return sprintf(
            '<a href="%1$s" class="card-cat">%2$s</a>',
            esc_url( get_category_link( $term->term_id ) ),
            esc_html( $term->name )
        );
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
        <span class="sparkle" aria-hidden="true">&#10022;</span>
        <span class="eyebrow-tagline"><?php echo esc_html( $tagline ); ?></span>
        <span class="eyebrow-date"><?php echo esc_html( date_i18n( 'Y-m-d' ) ); ?></span>
    </div>
    <?php
}

/**
 * Byline links row. $position: 'top' | 'bottom'.
 */
function computerjy2_byline_links( $position = 'top' ) {
    $url   = rawurlencode( get_permalink() );
    $title = rawurlencode( get_the_title() );
    $class = 'bottom' === $position ? 'byline-links post-links-group' : 'byline-links';
    ?>
    <div class="<?php echo esc_attr( $class ); ?>">
        <a class="<?php echo 'bottom' === $position ? 'link-primary' : ''; ?>" href="https://twitter.com/intent/tweet?url=<?php echo $url; ?>&text=<?php echo $title; ?>" target="_blank" rel="noopener noreferrer"><?php echo 'bottom' === $position ? esc_html__( 'Share X', 'computerjy2' ) : 'X'; ?></a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo $url; ?>" target="_blank" rel="noopener noreferrer">FB</a>
        <button type="button" data-copy-link="<?php echo esc_url( get_permalink() ); ?>"><?php esc_html_e( 'Copy link', 'computerjy2' ); ?></button>
    </div>
    <?php
}

/**
 * Featured image with the terminal tint, or a neutral placeholder block.
 */
function computerjy2_thumb( $size = 'computerjy2-card', $chip = false ) {
    echo '<div class="post-thumb">';
    if ( has_post_thumbnail() ) {
        the_post_thumbnail( $size, array( 'loading' => 'lazy', 'alt' => the_title_attribute( array( 'echo' => false ) ) ) );
    } else {
        echo '<div class="post-thumb-empty" aria-hidden="true"></div>';
    }
    if ( $chip ) {
        echo '<span class="thumb-chip">' . wp_kses_post( computerjy2_category_chip() ) . '</span>';
    }
    echo '</div>';
}

/**
 * Site name with the trailing accent syllable in brand cyan ("Computer" + "Jy").
 * The accent length is filterable for other site names.
 */
function computerjy2_brand_mark() {
    $name   = get_bloginfo( 'name' );
    $length = (int) apply_filters( 'computerjy2_brand_accent_length', 2 );

    if ( $length < 1 || mb_strlen( $name ) <= $length ) {
        return esc_html( $name );
    }

    return esc_html( mb_substr( $name, 0, -$length ) )
        . '<span class="brand-accent">' . esc_html( mb_substr( $name, -$length ) ) . '</span>';
}
