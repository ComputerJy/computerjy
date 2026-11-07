<?php
/**
 * Feed card: image, tags, title, date.
 *
 * @package ComputerJy2
 */
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-card' ); ?>>
    <a href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true"><?php computerjy2_thumb( 'computerjy2-card' ); ?></a>
    <div class="card-body">
        <?php computerjy2_card_tags(); ?>
        <h3 class="entry-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
        <?php computerjy2_card_date(); ?>
    </div>
</article>
