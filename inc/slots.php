<?php
/**
 * Reserved layout slots.
 *
 * Height is reserved in CSS so a sponsor unit (AdSense, Jetpack, any plugin)
 * can fill the slot without shifting layout. Each slot fires an action hook and
 * renders the matching Customizer code block; when neither produces output the
 * slot stays as a labelled reserve in the admin preview only.
 *
 * The code blocks live in theme_mods_*, so anything that can write options
 * gets site-wide stored HTML. Inherent to the feature and acceptable for a
 * single-admin site, but it is the theme's one privileged sink.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Render a reserved slot.
 *
 * @param string $id    Slot id: leaderboard | infeed | inarticle | sidebar.
 * @param string $label Placeholder label.
 */
function computerjy2_slot( $id, $label = '' ) {
    $enabled = get_theme_mod( 'computerjy2_slot_' . $id . '_enabled', true );
    if ( ! $enabled ) { return; }

    $code = get_theme_mod( 'computerjy2_slot_' . $id . '_code', '' );

    ob_start();
    /**
     * Fires inside a reserved slot. Plugins can hook here.
     *
     * @param string $id Slot id.
     */
    do_action( 'computerjy2_slot_' . $id );
    do_action( 'computerjy2_slot', $id );
    $hooked = ob_get_clean();

    $has_content = ( '' !== trim( $code ) ) || ( '' !== trim( $hooked ) );

    printf(
        '<div class="reserved-unit unit-%1$s%2$s" data-slot="%1$s">',
        esc_attr( $id ),
        $has_content ? ' is-filled' : ''
    );

    if ( '' !== trim( $code ) ) {
        // Customizer code is stored raw on purpose: it is sponsor script markup
        // entered by an administrator with unfiltered_html.
        echo do_shortcode( $code ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }
    echo $hooked; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

    if ( ! $has_content && ( current_user_can( 'edit_theme_options' ) && is_customize_preview() ) ) {
        echo esc_html( $label ? $label : $id );
    }

    echo '</div>';
}

/**
 * Insert $slot after the Nth closing </p> in $content, leaving everything
 * else byte-for-byte intact. Pure so it can be tested from the CLI.
 *
 * @param string $content HTML.
 * @param int    $after   1-based paragraph index.
 * @param string $slot    Markup to insert.
 * @return string
 */
function computerjy2_insert_after_paragraph( $content, $after, $slot ) {
    $after = max( 1, (int) $after );
    if ( substr_count( strtolower( $content ), '</p>' ) <= $after ) {
        return $content;
    }
    $n = 0;
    return preg_replace_callback(
        '#</p>#i',
        function ( $m ) use ( &$n, $after, $slot ) {
            return ( ++$n === $after ) ? $m[0] . $slot : $m[0];
        },
        $content
    );
}

/**
 * Insert the in-article slot after paragraph N of post content.
 */
function computerjy2_inject_inarticle_slot( $content ) {
    if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
        return $content;
    }
    if ( ! get_theme_mod( 'computerjy2_slot_inarticle_enabled', true ) ) {
        return $content;
    }

    $after = (int) apply_filters( 'computerjy2_inarticle_after_paragraph', get_theme_mod( 'computerjy2_inarticle_paragraph', 3 ) );
    if ( substr_count( strtolower( $content ), '</p>' ) <= $after ) {
        return $content;
    }

    ob_start();
    computerjy2_slot( 'inarticle', __( 'In-article unit', 'computerjy2' ) );
    $slot = ob_get_clean();

    return computerjy2_insert_after_paragraph( $content, $after, $slot );
}
add_filter( 'the_content', 'computerjy2_inject_inarticle_slot', 20 );

/**
 * How often the in-feed slot appears in the archive loop.
 */
function computerjy2_infeed_interval() {
    return max( 1, (int) apply_filters( 'computerjy2_infeed_interval', get_theme_mod( 'computerjy2_infeed_interval', 6 ) ) );
}
