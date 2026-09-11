<?php
/**
 * Standard feed tile: image, text chip, title. Category chip is the only meta.
 *
 * @package ComputerJy2
 */
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-card' ); ?>>
    <a href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true"><?php computerjy2_thumb( 'computerjy2-card' ); ?></a>
    <div class="card-body">
        <?php echo wp_kses_post( computerjy2_category_chip( null, 'text' ) ); ?>
        <h3 class="entry-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
    </div>
</article>
