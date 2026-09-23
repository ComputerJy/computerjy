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
    $image = has_post_thumbnail( $post ) ? get_the_post_thumbnail_url( $post, 'full' ) : computerjy2_fallback_image_url( 'full' );
    $term  = computerjy2_primary_category( $post->ID );
    // A scheduled post can be modified before its publish date; Google
    // rejects dateModified earlier than datePublished.
    $published = get_post_timestamp( $post );
    $modified  = max( $published, (int) get_post_timestamp( $post, 'modified' ) );

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
            'description'      => computerjy2_plain( get_the_excerpt( $post ) ),
            'image'            => $image,
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
