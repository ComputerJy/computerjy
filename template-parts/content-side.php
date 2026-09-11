<?php
/**
 * Side card in the lead block: thumb left, chip + title right.
 *
 * @package ComputerJy2
 */
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'side-card post-card' ); ?>>
    <a href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true"><?php computerjy2_thumb( 'computerjy2-side' ); ?></a>
    <div>
        <?php echo wp_kses_post( computerjy2_category_chip() ); ?>
        <h3 class="entry-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
    </div>
</article>
