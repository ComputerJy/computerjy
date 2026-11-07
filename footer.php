<?php
/**
 * Footer: newsletter, categories, social, legal.
 *
 * @package ComputerJy2
 */
?>
<footer class="site-footer" role="contentinfo">
    <div class="container">
        <div class="footer-cols">
            <div class="footer-widget">
                <?php if ( is_active_sidebar( 'footer-1' ) ) : ?>
                    <?php dynamic_sidebar( 'footer-1' ); ?>
                <?php else : ?>
                    <?php $cjy_signup = computerjy2_newsletter_form(); ?>
                    <?php if ( $cjy_signup ) : ?>
                        <h2 class="footer-col-title is-cyan"><?php esc_html_e( 'Newsletter', 'computerjy2' ); ?></h2>
                        <p><?php esc_html_e( 'One email when something worth reading goes up.', 'computerjy2' ); ?></p>
                        <div class="newsletter-box"><?php echo $cjy_signup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
                    <?php endif; ?>
                <?php endif; ?>
            </div>

            <div class="footer-widget">
                <?php if ( is_active_sidebar( 'footer-2' ) ) : ?>
                    <?php dynamic_sidebar( 'footer-2' ); ?>
                <?php else : ?>
                    <h2 class="footer-col-title"><?php esc_html_e( 'Categories', 'computerjy2' ); ?></h2>
                    <ul class="footer-links">
                        <?php wp_list_categories( array( 'title_li' => '', 'number' => 6, 'show_count' => false ) ); ?>
                    </ul>
                <?php endif; ?>
            </div>

            <div class="footer-widget">
                <?php if ( is_active_sidebar( 'footer-3' ) ) : ?>
                    <?php dynamic_sidebar( 'footer-3' ); ?>
                <?php else : ?>
                    <h2 class="footer-col-title"><?php esc_html_e( 'Elsewhere', 'computerjy2' ); ?></h2>
                    <?php computerjy2_profile_links(); ?>
                    <div class="footer-legal">
                        <?php
                        if ( has_nav_menu( 'footer' ) ) {
                            wp_nav_menu( array( 'theme_location' => 'footer', 'menu_class' => 'footer-links', 'container' => false, 'depth' => 1 ) );
                        } elseif ( get_privacy_policy_url() ) {
                            echo '<a href="' . esc_url( get_privacy_policy_url() ) . '">' . esc_html__( 'Privacy Policy', 'computerjy2' ) . '</a>';
                        }
                        ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    <div class="site-credit">
        <?php
        /* translators: %1$s: year, %2$s: site name */
        printf( esc_html__( '© %1$s %2$s', 'computerjy2' ), esc_html( date_i18n( 'Y' ) ), esc_html( strtoupper( get_bloginfo( 'name' ) ) ) );
        ?>
    </div>
</footer>

<button class="back-to-top" type="button" aria-label="<?php esc_attr_e( 'Back to top', 'computerjy2' ); ?>">&uarr;</button>

<?php wp_footer(); ?>
</body>
</html>
