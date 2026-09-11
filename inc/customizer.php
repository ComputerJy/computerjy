<?php
/**
 * Customizer: brand, social, reserved slots, layout options.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

function computerjy2_customize_register( $wp_customize ) {

    /* ---- Brand & social ---- */
    $wp_customize->add_section( 'computerjy2_brand', array(
        'title'    => __( 'ComputerJy: Brand & Social', 'computerjy2' ),
        'priority' => 30,
    ) );

    $wp_customize->add_setting( 'computerjy2_tagline', array(
        'default'           => 'entertainment, tech tips & occasional software reviews',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'refresh',
    ) );
    $wp_customize->add_control( 'computerjy2_tagline', array(
        'label'       => __( 'Eyebrow tagline', 'computerjy2' ),
        'description' => __( 'Shown in the slim strip above the feed.', 'computerjy2' ),
        'section'     => 'computerjy2_brand',
        'type'        => 'text',
    ) );

    $socials = array(
        'twitter' => 'X / Twitter URL', 'facebook' => 'Facebook URL', 'instagram' => 'Instagram URL',
        'linkedin' => 'LinkedIn URL', 'youtube' => 'YouTube URL', 'github' => 'GitHub URL', 'rss' => 'RSS URL',
    );
    foreach ( $socials as $key => $label ) {
        $wp_customize->add_setting( 'computerjy2_social_' . $key, array( 'default' => '', 'sanitize_callback' => 'esc_url_raw' ) );
        $wp_customize->add_control( 'computerjy2_social_' . $key, array( 'label' => $label, 'section' => 'computerjy2_brand', 'type' => 'url' ) );
    }

    $wp_customize->add_setting( 'computerjy2_ga4_id', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'computerjy2_ga4_id', array(
        'label'       => __( 'Google Analytics 4 measurement ID', 'computerjy2' ),
        'description' => __( 'e.g. G-XXXXXXXXXX. Leave blank to load no analytics.', 'computerjy2' ),
        'section'     => 'computerjy2_brand',
        'type'        => 'text',
    ) );

    /* ---- Layout ---- */
    $wp_customize->add_section( 'computerjy2_layout', array(
        'title'    => __( 'ComputerJy: Layout', 'computerjy2' ),
        'priority' => 31,
    ) );

    $wp_customize->add_setting( 'computerjy2_single_hero', array( 'default' => true, 'sanitize_callback' => 'wp_validate_boolean' ) );
    $wp_customize->add_control( 'computerjy2_single_hero', array(
        'label'   => __( 'Full-bleed header image on posts', 'computerjy2' ),
        'section' => 'computerjy2_layout',
        'type'    => 'checkbox',
    ) );

    $wp_customize->add_setting( 'computerjy2_use_theme_related', array( 'default' => true, 'sanitize_callback' => 'wp_validate_boolean' ) );
    $wp_customize->add_control( 'computerjy2_use_theme_related', array(
        'label'       => __( 'Use theme related posts', 'computerjy2' ),
        'description' => __( 'Uncheck to let Jetpack render related posts instead.', 'computerjy2' ),
        'section'     => 'computerjy2_layout',
        'type'        => 'checkbox',
    ) );

    $wp_customize->add_setting( 'computerjy2_newsletter_action', array( 'default' => '', 'sanitize_callback' => 'esc_url_raw' ) );
    $wp_customize->add_control( 'computerjy2_newsletter_action', array(
        'label'       => __( 'Newsletter form action URL', 'computerjy2' ),
        'description' => __( 'Mailchimp / Buttondown endpoint. Leave blank to hide the footer signup.', 'computerjy2' ),
        'section'     => 'computerjy2_layout',
        'type'        => 'url',
    ) );

    /* ---- Reserved slots ---- */
    $wp_customize->add_section( 'computerjy2_slots', array(
        'title'       => __( 'ComputerJy: Sponsor Slots', 'computerjy2' ),
        'description' => __( 'Paste AdSense or sponsor markup. Each slot reserves its height in CSS so filling it never shifts the layout.', 'computerjy2' ),
        'priority'    => 32,
    ) );

    $slots = array(
        'leaderboard' => __( 'Header leaderboard (below nav)', 'computerjy2' ),
        'infeed'      => __( 'In-feed unit', 'computerjy2' ),
        'inarticle'   => __( 'In-article unit', 'computerjy2' ),
        'sidebar'     => __( 'Sidebar sticky unit', 'computerjy2' ),
    );

    foreach ( $slots as $id => $label ) {
        $wp_customize->add_setting( 'computerjy2_slot_' . $id . '_enabled', array( 'default' => true, 'sanitize_callback' => 'wp_validate_boolean' ) );
        $wp_customize->add_control( 'computerjy2_slot_' . $id . '_enabled', array(
            'label' => $label, 'section' => 'computerjy2_slots', 'type' => 'checkbox',
        ) );

        $wp_customize->add_setting( 'computerjy2_slot_' . $id . '_code', array( 'default' => '', 'sanitize_callback' => 'computerjy2_sanitize_slot_code' ) );
        $wp_customize->add_control( 'computerjy2_slot_' . $id . '_code', array(
            /* translators: %s: slot label */
            'label'   => sprintf( __( '%s code', 'computerjy2' ), $label ),
            'section' => 'computerjy2_slots',
            'type'    => 'textarea',
        ) );
    }

    $wp_customize->add_setting( 'computerjy2_infeed_interval', array( 'default' => 6, 'sanitize_callback' => 'absint' ) );
    $wp_customize->add_control( 'computerjy2_infeed_interval', array(
        'label'       => __( 'In-feed unit after every N posts', 'computerjy2' ),
        'section'     => 'computerjy2_slots',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 2, 'max' => 20, 'step' => 1 ),
    ) );

    $wp_customize->add_setting( 'computerjy2_inarticle_paragraph', array( 'default' => 3, 'sanitize_callback' => 'absint' ) );
    $wp_customize->add_control( 'computerjy2_inarticle_paragraph', array(
        'label'       => __( 'In-article unit after paragraph', 'computerjy2' ),
        'section'     => 'computerjy2_slots',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 1, 'max' => 12, 'step' => 1 ),
    ) );
}
add_action( 'customize_register', 'computerjy2_customize_register' );

/**
 * Slot markup is admin-entered script/HTML; only unfiltered_html users may save it.
 */
function computerjy2_sanitize_slot_code( $value ) {
    if ( current_user_can( 'unfiltered_html' ) ) {
        return $value;
    }
    return wp_kses_post( $value );
}

/**
 * Output social links from the Customizer.
 */
function computerjy2_profile_links() {
    $map = array(
        'twitter' => 'X', 'facebook' => 'FB', 'instagram' => 'IG',
        'linkedin' => 'IN', 'youtube' => 'YT', 'github' => 'GH', 'rss' => 'RSS',
    );
    $out = '';
    foreach ( $map as $key => $abbr ) {
        $url = get_theme_mod( 'computerjy2_social_' . $key );
        if ( $url ) {
            $out .= sprintf(
                '<a href="%1$s" target="_blank" rel="noopener noreferrer" aria-label="%2$s"><span aria-hidden="true">%3$s</span></a>',
                esc_url( $url ), esc_attr( ucfirst( $key ) ), esc_html( $abbr )
            );
        }
    }
    if ( $out ) {
        echo '<div class="profile-links">' . $out . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }
}
