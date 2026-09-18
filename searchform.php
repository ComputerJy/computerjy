<?php
/**
 * Search form.
 *
 * @package ComputerJy2
 */
$cjy_search_id = wp_unique_id( 'cjy-search-' );
?>
<form role="search" method="get" class="search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
    <label class="screen-reader-text" for="<?php echo esc_attr( $cjy_search_id ); ?>"><?php esc_html_e( 'Search for:', 'computerjy2' ); ?></label>
    <input type="search" id="<?php echo esc_attr( $cjy_search_id ); ?>" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'Search…', 'computerjy2' ); ?>">
    <button type="submit" class="btn-primary"><?php esc_html_e( 'GO', 'computerjy2' ); ?></button>
</form>
