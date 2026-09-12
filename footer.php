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
                    <h2 class="footer-col-title is-cyan"><?php esc_html_e( 'Newsletter', 'computerjy2' ); ?></h2>
                    <p><?php esc_html_e( 'One email when something worth reading goes up.', 'computerjy2' ); ?></p>
                    <?php $cjy_action = get_theme_mod( 'computerjy2_newsletter_action' ); ?>
                    <?php if ( $cjy_action ) : ?>
                        <form class="newsletter-form" action="<?php echo esc_url( $cjy_action ); ?>" method="post" target="_blank">
                            <label class="screen-reader-text" for="cjy-news"><?php esc_html_e( 'Email address', 'computerjy2' ); ?></label>
                            <input type="email" id="cjy-news" name="email" required placeholder="you@email.com">
                            <button type="submit"><?php esc_html_e( 'JOIN', 'computerjy2' ); ?></button>
                        </form>
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
                    <h4 class="footer-col-title"><?php esc_html_e( 'Elsewhere', 'computerjy2' ); ?></h4>
                    <?php computerjy2_profile_links(); ?>
                    <div class="footer-legal">
                        <?php
                        if ( has_nav_menu( 'footer' ) ) {
                            wp_nav_menu( array( 'theme_location' => 'footer', 'menu_class' => 'footer-links', 'container' => false, 'depth' => 1 ) );
                        } else {
                            echo '<a href="' . esc_url( home_url( '/privacy-policy-2/' ) ) . '">' . esc_html__( 'Privacy Policy', 'computerjy2' ) . '</a>';
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
