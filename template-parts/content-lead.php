<?php
/**
 * Lead card: the only card in the feed that carries an excerpt.
 *
 * @package ComputerJy2
 */
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'lead-card' ); ?>>
    <a href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
        <?php computerjy2_thumb( 'computerjy2-lead', true ); ?>
    </a>
    <div class="card-body">
        <h2 class="entry-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
        <p class="entry-excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 28, '…' ) ); ?></p>
    </div>
</article>
