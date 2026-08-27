<?php
/**
 * Plugin Name: ComputerJy Headless Rebuild Webhook
 * Description: Automatically triggers a build hook on Cloudflare Pages, Vercel, Netlify, or GitHub Actions when content is published, updated, or deleted.
 * Version: 1.0.0
 * Author: Eyad Salah
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Enter your deploy webhook URL below (or configure via Settings -> General -> Headless Deploy Webhook)
function computerjy_trigger_rebuild( $post_id ) {
    // Prevent execution during autosaves or revisions
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    if ( wp_is_post_revision( $post_id ) ) {
        return;
    }

    $webhook_url = get_option( 'computerjy_deploy_webhook_url', '' );

    if ( ! empty( $webhook_url ) ) {
        wp_remote_post( $webhook_url, array(
            'blocking' => false,
            'headers'  => array(
                'Content-Type' => 'application/json',
            ),
            'body'     => wp_json_encode( array(
                'event'     => 'post_updated',
                'post_id'   => $post_id,
                'timestamp' => time(),
            ) ),
        ) );
    }
}

add_action( 'save_post', 'computerjy_trigger_rebuild' );
add_action( 'deleted_post', 'computerjy_trigger_rebuild' );

// Add settings field to Settings -> General
function computerjy_register_webhook_setting() {
    register_setting( 'general', 'computerjy_deploy_webhook_url', array(
        'type'              => 'string',
        'sanitize_callback' => 'esc_url_raw',
        'default'           => '',
    ) );

    add_settings_field(
        'computerjy_deploy_webhook_url',
        'Headless Deploy Webhook URL',
        'computerjy_webhook_field_html',
        'general'
    );
}
add_action( 'admin_init', 'computerjy_register_webhook_setting' );

function computerjy_webhook_field_html() {
    $url = get_option( 'computerjy_deploy_webhook_url', '' );
    echo '<input type="url" name="computerjy_deploy_webhook_url" value="' . esc_attr( $url ) . '" class="regular-text" placeholder="https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/..." />';
    echo '<p class="description">Paste your Cloudflare Pages, Vercel, or Netlify Build Hook URL to trigger automatic instant rebuilds upon post updates.</p>';
}
