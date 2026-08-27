<?php
/**
 * ComputerJy World - Footer Template
 *
 * @package ComputerJy
 */
?>

<footer class="site-footer" id="colophon">
    <div class="container">
        <div class="footer-grid">
            <!-- Brand Info Column -->
            <div class="footer-brand-info">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-brand">
                    <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/logo.svg' ); ?>" 
                         alt="<?php bloginfo( 'name' ); ?>" 
                         style="height: 38px; width: auto;">
                </a>
                <p>
                    <?php echo esc_html( get_theme_mod( 'computerjy_hero_tagline', 'Entertainment, Tech tips & Occasional software reviews. Exploring the modern web, software wonders, and digital culture.' ) ); ?>
                </p>
                <!-- Social Profiles -->
                <div class="social-icons-list" style="justify-content: flex-start;">
                    <a href="https://x.com/ComputerJy" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="Twitter / X">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </a>
                    <a href="https://www.facebook.com/computerjy" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="Facebook">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </a>
                    <a href="https://www.linkedin.com/in/computerjy" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="LinkedIn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 1.45-1.45 1.45 1.45 0 0 0-1.45-1.45 1.45 1.45 0 0 0-1.45 1.45 1.45 1.45 0 0 0 1.45 1.45m1.37 9.74v-8.37H5.09v8.37h2.74z"/>
                        </svg>
                    </a>
                    <a href="https://www.instagram.com/computerjy/" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="Instagram">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                    </a>
                    <a href="<?php bloginfo( 'rss2_url' ); ?>" class="social-icon-btn" aria-label="RSS Feed">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 11a9 9 0 0 1 9 9"></path>
                            <path d="M4 4a16 16 0 0 1 16 16"></path>
                            <circle cx="5" cy="19" r="1"></circle>
                        </svg>
                    </a>
                </div>
            </div>

            <!-- Categories Column -->
            <div>
                <h4 class="footer-col-title"><?php esc_html_e( 'Categories', 'computerjy' ); ?></h4>
                <ul class="footer-links-list">
                    <li><a href="<?php echo esc_url( home_url( '/tag/computers/' ) ); ?>" class="footer-link">💻 Computers &amp; Tech</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/tag/entertainment/' ) ); ?>" class="footer-link">🎉 Entertainment &amp; Fun</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/tag/freeware/' ) ); ?>" class="footer-link">⚡ Freeware &amp; Software</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/tag/internet/' ) ); ?>" class="footer-link">🌐 Internet &amp; Web Tips</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/tag/education/' ) ); ?>" class="footer-link">📚 Science &amp; Education</a></li>
                </ul>
            </div>

            <!-- Quick Links Column -->
            <div>
                <h4 class="footer-col-title"><?php esc_html_e( 'Quick Links', 'computerjy' ); ?></h4>
                <ul class="footer-links-list">
                    <li><a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="footer-link">🏠 Home</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/contact-me/' ) ); ?>" class="footer-link">✉️ Contact Me</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/privacy-policy-2/' ) ); ?>" class="footer-link">🔒 Privacy Policy</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/2015/07/' ) ); ?>" class="footer-link">📅 Monthly Archives</a></li>
                </ul>
            </div>

            <!-- Stay Connected Column -->
            <div>
                <h4 class="footer-col-title"><?php esc_html_e( 'Stay Updated', 'computerjy' ); ?></h4>
                <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem;">
                    <?php esc_html_e( 'Get the latest tech tips, reviews, and insights delivered straight to your inbox.', 'computerjy' ); ?>
                </p>
                <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Thank you for subscribing to ComputerJy World updates!');">
                    <input type="email" class="newsletter-input" placeholder="<?php esc_attr_e( 'Enter your email...', 'computerjy' ); ?>" required />
                    <button type="submit" class="btn-primary" style="width: 100%;">
                        <?php esc_html_e( 'Subscribe', 'computerjy' ); ?> 🚀
                    </button>
                </form>
            </div>
        </div>

        <!-- Footer Bottom Bar -->
        <div class="footer-bottom-bar">
            <div>
                &copy; <?php echo esc_html( date( 'Y' ) ); ?> <strong>ComputerJy World</strong> &bull; Crafted with passion by <a href="<?php echo esc_url( home_url( '/contact-me/' ) ); ?>" style="color: var(--brand-blue); font-weight: 700;">Eyad Salah</a>. All rights reserved.
            </div>
            <button type="button" class="back-to-top-btn" aria-label="<?php esc_attr_e( 'Back to top', 'computerjy' ); ?>">
                <span><?php esc_html_e( 'Back to top', 'computerjy' ); ?></span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
            </button>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
