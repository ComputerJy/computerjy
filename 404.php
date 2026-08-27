<?php
/**
 * ComputerJy World - 404 Error Template
 *
 * @package ComputerJy
 */

get_header();
?>

<main id="primary-content" class="main-layout" role="main">
    <div class="container">
        
        <div class="error-404-hero">
            <div style="margin-bottom: 1.5rem; display: inline-block;">
                <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/logo-icon.svg' ); ?>" alt="ComputerJy Icon" style="width: 100px; height: 100px; margin: 0 auto; filter: drop-shadow(0 10px 20px rgba(0,210,255,0.3));">
            </div>

            <div class="error-404-badge">404</div>
            <h1 style="margin-bottom: 1rem; font-size: 2rem;"><?php esc_html_e( 'Oops! Page Not Found', 'computerjy' ); ?></h1>
            <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 2rem;">
                <?php esc_html_e( 'The page you were looking for might have been moved, renamed, or temporarily unplugged.', 'computerjy' ); ?>
            </p>

            <div style="max-width: 440px; margin: 0 auto 2.5rem;">
                <form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" style="display: flex; gap: 8px;">
                    <input type="search" class="form-input" placeholder="<?php esc_attr_e( 'Search ComputerJy...', 'computerjy' ); ?>" name="s" required />
                    <button type="submit" class="btn-primary"><?php esc_html_e( 'Search', 'computerjy' ); ?></button>
                </form>
            </div>

            <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="btn-primary btn-accent">
                    🏠 <?php esc_html_e( 'Back to Home', 'computerjy' ); ?>
                </a>
                <a href="<?php echo esc_url( home_url( '/contact-me/' ) ); ?>" class="btn-primary" style="background: var(--bg-subtle); color: var(--text-primary); border: 1px solid var(--border-color);">
                    ✉️ <?php esc_html_e( 'Contact Eyad', 'computerjy' ); ?>
                </a>
            </div>
        </div>

    </div>
</main>

<?php
get_footer();
