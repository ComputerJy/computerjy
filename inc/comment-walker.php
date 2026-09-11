<?php
/**
 * Comment rendering callback (chat bubbles).
 *
 * @package ComputerJy2
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

function computerjy2_comment( $comment, $args, $depth ) {
    ?>
    <li id="comment-<?php comment_ID(); ?>" <?php comment_class( 'comment-item' ); ?>>
        <div class="comment-row">
            <span class="comment-avatar"><?php echo get_avatar( $comment, 30 ); ?></span>
            <div class="comment-bubble">
                <div class="comment-header">
                    <?php echo get_comment_author_link(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                    <?php if ( user_can( (int) $comment->user_id, 'edit_posts' ) ) : ?>
                        <span class="comment-date">&middot; <?php esc_html_e( 'AUTHOR', 'computerjy2' ); ?></span>
                    <?php endif; ?>
                    <span class="comment-date">&middot; <?php echo esc_html( human_time_diff( get_comment_time( 'U' ), current_time( 'timestamp' ) ) ); ?></span>
                </div>

                <div class="comment-body">
                    <?php if ( '0' === $comment->comment_approved ) : ?>
                        <p class="entry-meta-mono"><?php esc_html_e( 'AWAITING MODERATION.', 'computerjy2' ); ?></p>
                    <?php endif; ?>
                    <?php comment_text(); ?>
                </div>

                <div class="comment-reply">
                    <?php
                    comment_reply_link( array_merge( $args, array(
                        'depth'     => $depth,
                        'max_depth' => $args['max_depth'],
                        'reply_text' => esc_html__( 'Reply ↵', 'computerjy2' ),
                    ) ) );
                    ?>
                </div>
            </div>
        </div>
    <?php
    // Closing </li> is emitted by wp_list_comments.
}
