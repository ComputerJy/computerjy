<?php
/**
 * Search form.
 *
 * @package ComputerJy2
 */
?>
<form role="search" method="get" class="search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>" style="display:flex;gap:1px">
    <label class="screen-reader-text" for="s-<?php echo esc_attr( uniqid() ); ?>"><?php esc_html_e( 'Search for:', 'computerjy2' ); ?></label>
    <input type="search" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'Search…', 'computerjy2' ); ?>">
    <button type="submit" class="btn-primary"><?php esc_html_e( 'GO', 'computerjy2' ); ?></button>
</form>
