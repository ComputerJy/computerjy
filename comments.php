<?php
/**
 * Comments: chat-style bubbles with one level of reply nesting.
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

if ( post_password_required() ) {
    return;
}
?>

<div id="comments" class="comments-area">

    <?php if ( have_comments() ) : ?>
        <h2 class="comments-title">
            <?php
            $cjy_count = (int) get_comments_number();
            /* translators: %d: comment count */
            printf( esc_html( _n( 'COMMENTS [%d]', 'COMMENTS [%d]', $cjy_count, 'computerjy2' ) ), $cjy_count );
            ?>
        </h2>

        <ol class="comment-list">
            <?php
            wp_list_comments( array(
                'style'    => 'ol',
                'callback' => 'computerjy2_comment',
                'max_depth' => 2,
            ) );
            ?>
        </ol>

        <?php
        the_comments_navigation( array(
            'prev_text' => esc_html__( '← OLDER', 'computerjy2' ),
            'next_text' => esc_html__( 'NEWER →', 'computerjy2' ),
        ) );
        ?>

        <?php if ( ! comments_open() ) : ?>
            <p class="entry-meta-mono"><?php esc_html_e( 'COMMENTS ARE CLOSED.', 'computerjy2' ); ?></p>
        <?php endif; ?>
    <?php endif; ?>

    <?php
    comment_form( array(
        'class_form'           => 'comment-form',
        'title_reply'          => esc_html__( 'Leave a comment', 'computerjy2' ),
        'title_reply_before'   => '<h3 class="comments-title">',
        'title_reply_after'    => '</h3>',
        'comment_notes_before' => '<p class="entry-meta-mono">' . esc_html__( 'YOUR EMAIL IS NOT PUBLISHED.', 'computerjy2' ) . '</p>',
        'label_submit'         => esc_html__( 'Post comment', 'computerjy2' ),
        'comment_field'        => '<p class="comment-form-comment"><label for="comment">' . esc_html__( 'Comment', 'computerjy2' ) . '</label><textarea id="comment" name="comment" rows="5" required></textarea></p>',
    ) );
    ?>
</div>
