<?php
/**
 * Block patterns matching the theme's visual language.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

function computerjy2_register_patterns() {
    if ( ! function_exists( 'register_block_pattern_category' ) ) { return; }

    register_block_pattern_category( 'computerjy2', array( 'label' => __( 'ComputerJy', 'computerjy2' ) ) );

    register_block_pattern( 'computerjy2/callout', array(
        'title'      => __( 'Terminal callout', 'computerjy2' ),
        'categories' => array( 'computerjy2' ),
        'content'    => '<!-- wp:group {"style":{"border":{"left":{"color":"#00D2FF","width":"3px"}},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"18px","right":"18px"}}},"backgroundColor":"surface"} -->
<div class="wp-block-group has-surface-background-color has-background" style="border-left-color:#00D2FF;border-left-width:3px;padding:14px 18px"><!-- wp:paragraph -->
<p>' . esc_html__( 'A short aside, set apart with the brand rule.', 'computerjy2' ) . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->',
    ) );

    register_block_pattern( 'computerjy2/spec-table', array(
        'title'      => __( 'Spec table', 'computerjy2' ),
        'categories' => array( 'computerjy2' ),
        'content'    => '<!-- wp:table {"className":"is-style-stripes"} -->
<figure class="wp-block-table is-style-stripes"><table><thead><tr><th>' . esc_html__( 'Spec', 'computerjy2' ) . '</th><th>' . esc_html__( 'Value', 'computerjy2' ) . '</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table></figure>
<!-- /wp:table -->',
    ) );
}
add_action( 'init', 'computerjy2_register_patterns' );
