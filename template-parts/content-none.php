<?php
/**
 * Template part for displaying a message that posts cannot be found
 *
 * @package ComputerJy
 */
?>

<div class="sidebar-widget" style="text-align: center; padding: 3rem 2rem;">
    <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
    <h2 style="font-size: 1.5rem; margin-bottom: 0.75rem;"><?php esc_html_e( 'Nothing Found', 'computerjy' ); ?></h2>
    
    <?php if ( is_search() ) : ?>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
            <?php esc_html_e( 'Sorry, but nothing matched your search terms. Please try again with some different keywords.', 'computerjy' ); ?>
        </p>
        <div style="max-width: 400px; margin: 0 auto;">
            <?php get_search_form(); ?>
        </div>
    <?php else : ?>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
            <?php esc_html_e( 'It seems we can&rsquo;t find what you&rsquo;re looking for. Perhaps searching can help.', 'computerjy' ); ?>
        </p>
        <div style="max-width: 400px; margin: 0 auto;">
            <?php get_search_form(); ?>
        </div>
    <?php endif; ?>
</div>
