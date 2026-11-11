<?php
/**
 * SEO the theme owns on top of Jetpack SEO tools: legacy URL redirects,
 * JSON-LD, og:image:alt, and noindex on thin archives. Jetpack prints the
 * title, description, canonical and Open Graph / Twitter tags.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Where a legacy URL lives now. Permalinks were /posts/<slug> (Astro and the
 * first WordPress years) and are /YYYY/MM/<slug>/ now; a dated URL whose date
 * is wrong also resolves. Exact slug match only: core's prefix guess would
 * send /posts/1go to /…/1goal/.
 *
 * @param string $request Request path without slashes at either end ($wp->request).
 * @return string Absolute URL, or '' to leave the 404 alone.
 */
function computerjy2_legacy_target( $request ) {
    if ( preg_match( '#^(?:posts|\d{4}/\d{2}(?:/\d{2})?)/([^/]+)$#', $request, $m ) ) {
        $post = get_page_by_path( $m[1], OBJECT, 'post' );
        if ( $post && 'publish' === $post->post_status ) {
            return get_permalink( $post );
        }
    }
    // /posts/author/x, /posts/page/2 and friends lost the /posts front.
    if ( preg_match( '#^posts/(.+/.+)$#', $request, $m ) ) {
        return home_url( '/' . $m[1] . '/' );
    }
    return '';
}

/**
 * 301 legacy 404s. Priority 9 runs ahead of redirect_canonical().
 */
function computerjy2_legacy_redirect() {
    if ( ! is_404() ) {
        return;
    }
    $target = computerjy2_legacy_target( $GLOBALS['wp']->request );
    if ( $target ) {
        wp_safe_redirect( $target, 301 );
        exit;
    }
}
add_action( 'template_redirect', 'computerjy2_legacy_redirect', 9 );
add_filter( 'do_redirect_guess_404_permalink', '__return_false' );

/**
 * Date and author archives duplicate the category/tag listings on a
 * single-author site; keep them crawlable but out of the index.
 *
 * @param array $robots wp_robots directives.
 * @return array
 */
function computerjy2_robots( $robots ) {
    if ( is_date() || is_author() ) {
        $robots['noindex'] = true;
        $robots['follow']  = true;
    }
    return $robots;
}
add_filter( 'wp_robots', 'computerjy2_robots' );

/**
 * Jetpack leaves og:image:alt empty when the featured image has no alt text.
 *
 * @param array $tags Open Graph tags.
 * @return array
 */
function computerjy2_og_image_alt( $tags ) {
    if ( is_singular() && empty( $tags['og:image:alt'] ) ) {
        $alt                  = get_post_meta( (int) get_post_thumbnail_id(), '_wp_attachment_image_alt', true );
        $tags['og:image:alt'] = $alt ? $alt : computerjy2_plain( get_the_title() );
    }
    return $tags;
}
add_filter( 'jetpack_open_graph_tags', 'computerjy2_og_image_alt' );

/**
 * A scheduled post edited before it went live has a modified time earlier
 * than its publish time. Jetpack prints both as UTC 'c' dates, so they compare
 * as strings.
 *
 * @param array $tags Open Graph tags.
 * @return array
 */
function computerjy2_og_modified_time( $tags ) {
    if ( isset( $tags['article:published_time'], $tags['article:modified_time'] )
        && $tags['article:modified_time'] < $tags['article:published_time'] ) {
        $tags['article:modified_time'] = $tags['article:published_time'];
    }
    return $tags;
}
add_filter( 'jetpack_open_graph_tags', 'computerjy2_og_modified_time' );

/**
 * Description for image and video posts, which have no text to excerpt.
 *
 * @return string
 */
function computerjy2_fallback_description() {
    return sprintf(
        /* translators: 1: post title, 2: site name. */
        __( '%1$s: a post from %2$s', 'computerjy2' ),
        computerjy2_plain( get_the_title() ),
        computerjy2_plain( get_bloginfo( 'name' ) )
    );
}

/**
 * Replace Jetpack's "Visit the post for more." on posts with no text. Jetpack
 * then skips twitter:description too, and X reads og:description.
 *
 * @param string $description Jetpack's fallback.
 * @return string
 */
function computerjy2_og_fallback_description( $description ) {
    return is_singular() ? computerjy2_fallback_description() : $description;
}
add_filter( 'jetpack_open_graph_fallback_description', 'computerjy2_og_fallback_description' );

/**
 * Jetpack prints no meta description for a post with no text.
 *
 * @param array $meta Meta name and content pairs.
 * @return array
 */
function computerjy2_seo_meta_tags( $meta ) {
    if ( is_singular() && empty( $meta['description'] ) ) {
        $meta['description'] = computerjy2_fallback_description();
    }
    return $meta;
}
add_filter( 'jetpack_seo_meta_tags', 'computerjy2_seo_meta_tags' );

/**
 * Featured images with no media-library alt use the post title, like
 * og:image:alt above. Covers every the_post_thumbnail() caller.
 *
 * @param string $html    Thumbnail markup.
 * @param int    $post_id Post the thumbnail belongs to.
 * @return string
 */
function computerjy2_thumbnail_alt( $html, $post_id ) {
    return str_replace( ' alt=""', ' alt="' . esc_attr( computerjy2_plain( get_the_title( $post_id ) ) ) . '"', $html );
}
add_filter( 'post_thumbnail_html', 'computerjy2_thumbnail_alt', 10, 2 );

/**
 * Title / excerpt text without markup or HTML entities (&#8211; and friends).
 *
 * @param string $html Text.
 * @return string
 */
function computerjy2_plain( $html ) {
    return html_entity_decode( wp_strip_all_tags( $html ), ENT_QUOTES, 'UTF-8' );
}

/**
 * The site as a schema.org Organization.
 *
 * @return array
 */
function computerjy2_schema_org() {
    $same_as = array();
    foreach ( array( 'twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'github' ) as $key ) {
        $url = get_theme_mod( 'computerjy2_social_' . $key );
        if ( $url ) {
            $same_as[] = $url;
        }
    }
    $logo = get_site_icon_url( 512 );
    return array_filter( array(
        '@type'  => 'Organization',
        '@id'    => home_url( '/#organization' ),
        'name'   => get_bloginfo( 'name' ),
        'url'    => home_url( '/' ),
        'logo'   => $logo ? $logo : home_url( '/logo.svg' ),
        'sameAs' => $same_as,
    ) );
}

/**
 * True timestamp of a post date. get_post_timestamp() reads the local column
 * under today's zone rules, an hour off for dates stored under older ones.
 * Drafts have no GMT date yet.
 *
 * @param WP_Post $post  Post.
 * @param string  $field 'date' or 'modified'.
 * @return int
 */
function computerjy2_post_timestamp( $post, $field = 'date' ) {
    $date = get_post_datetime( $post, $field, 'gmt' );
    return $date ? $date->getTimestamp() : (int) get_post_timestamp( $post, $field );
}

/**
 * Featured image, else the body image Jetpack chose for og:image (at least
 * 200×200), else the fallback image. Jetpack's own last resort is the site
 * icon, which is the publisher logo and doesn't stand for the post.
 *
 * @param WP_Post $post Post.
 * @return string
 */
function computerjy2_schema_image( $post ) {
    if ( has_post_thumbnail( $post ) ) {
        return get_the_post_thumbnail_url( $post, 'full' );
    }
    $og = function_exists( 'jetpack_og_get_image' ) ? jetpack_og_get_image() : array();
    if ( ! empty( $og['src'] ) && get_site_icon_url( 512 ) !== $og['src'] ) {
        return $og['src'];
    }
    return computerjy2_fallback_image_url( 'full' );
}

/**
 * JSON-LD graph for the current page: WebSite + Organization on the front
 * page, BlogPosting + BreadcrumbList on posts.
 *
 * @return array Empty when the page gets none.
 */
function computerjy2_schema_graph() {
    if ( is_front_page() ) {
        return array(
            array(
                '@type'           => 'WebSite',
                '@id'             => home_url( '/#website' ),
                'url'             => home_url( '/' ),
                'name'            => get_bloginfo( 'name' ),
                'description'     => computerjy2_plain( get_bloginfo( 'description' ) ),
                'publisher'       => array( '@id' => home_url( '/#organization' ) ),
                'potentialAction' => array(
                    '@type'       => 'SearchAction',
                    'target'      => home_url( '/?s={search_term_string}' ),
                    'query-input' => 'required name=search_term_string',
                ),
            ),
            computerjy2_schema_org(),
        );
    }

    if ( ! is_singular( 'post' ) ) {
        return array();
    }

    $post  = get_post();
    $url   = get_permalink( $post );
    $title = computerjy2_plain( get_the_title( $post ) );
    $term  = computerjy2_primary_category( $post->ID );
    // A scheduled post can be modified before its publish date; Google
    // rejects dateModified earlier than datePublished.
    $published = computerjy2_post_timestamp( $post );
    $modified  = max( $published, computerjy2_post_timestamp( $post, 'modified' ) );
    $excerpt   = computerjy2_plain( get_the_excerpt( $post ) );

    $crumbs = array( array( get_bloginfo( 'name' ), home_url( '/' ) ) );
    if ( $term ) {
        $crumbs[] = array( $term->name, get_category_link( $term->term_id ) );
    }
    $crumbs[] = array( $title, $url );

    return array(
        array_filter( array(
            '@type'            => 'BlogPosting',
            '@id'              => $url . '#article',
            'mainEntityOfPage' => $url,
            'headline'         => $title,
            'description'      => $excerpt ? $excerpt : computerjy2_fallback_description(),
            'image'            => computerjy2_schema_image( $post ),
            'datePublished'    => wp_date( 'c', $published ),
            'dateModified'     => wp_date( 'c', $modified ),
            'author'           => array(
                '@type' => 'Person',
                'name'  => get_the_author_meta( 'display_name', $post->post_author ),
                'url'   => get_author_posts_url( $post->post_author ),
            ),
            'publisher'        => computerjy2_schema_org(),
            'articleSection'   => $term ? $term->name : '',
            'inLanguage'       => get_bloginfo( 'language' ),
        ) ),
        array(
            '@type'           => 'BreadcrumbList',
            'itemListElement' => array_map(
                function ( $crumb, $i ) {
                    return array(
                        '@type'    => 'ListItem',
                        'position' => $i + 1,
                        'name'     => $crumb[0],
                        'item'     => $crumb[1],
                    );
                },
                $crumbs,
                array_keys( $crumbs )
            ),
        ),
    );
}

/**
 * Print the JSON-LD. Skipped when Yoast or Rank Math is back, which print
 * their own graph.
 */
function computerjy2_schema() {
    if ( defined( 'WPSEO_VERSION' ) || class_exists( 'RankMath' ) ) {
        return;
    }
    $graph = computerjy2_schema_graph();
    if ( $graph ) {
        // Default flags escape "/", so a "</script>" in a title stays inert.
        echo '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => $graph ), JSON_UNESCAPED_UNICODE ) . "</script>\n";
    }
}
add_action( 'wp_head', 'computerjy2_schema' );

/**
 * Hide the REST users list from visitors who can't list users. It leaked the
 * Gravatar email hash and every account, not just the authors the bylines name.
 *
 * @param array $endpoints REST routes.
 * @return array
 */
function computerjy2_hide_rest_users( $endpoints ) {
    if ( ! current_user_can( 'list_users' ) ) {
        unset( $endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)'] );
    }
    return $endpoints;
}
add_filter( 'rest_endpoints', 'computerjy2_hide_rest_users' );
