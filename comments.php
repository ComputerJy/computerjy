<?php
/**
 * ComputerJy World - Comments Template
 *
 * @package ComputerJy
 */

if ( post_password_required() ) {
    return;
}
?>

<div id="comments" class="comments-section">

    <?php if ( have_comments() ) : ?>
        <h3 class="comments-title">
            <span>💬 <?php comments_number( 'Discussion (0)', 'Discussion (1)', 'Discussion (%)' ); ?></span>
        </h3>

        <ol class="comment-list">
            <?php
            wp_list_comments( array(
                'style'       => 'ol',
                'short_ping'  => true,
                'avatar_size' => 48,
                'callback'    => 'computerjy_comment_callback',
            ) );
            ?>
        </ol>

        <?php
        the_comments_navigation( array(
            'prev_text' => '&larr; ' . esc_html__( 'Older Comments', 'computerjy' ),
            'next_text' => esc_html__( 'Newer Comments', 'computerjy' ) . ' &rarr;',
        ) );
        ?>

        <?php if ( ! comments_open() ) : ?>
            <p style="color: var(--text-muted); font-style: italic;"><?php esc_html_e( 'Comments are closed for this article.', 'computerjy' ); ?></p>
        <?php endif; ?>

    <?php endif; ?>

    <?php
    $commenter     = wp_get_current_commenter();
    $req           = get_option( 'require_name_email' );
    $aria_req      = ( $req ? " aria-required='true'" : '' );
    $html_req      = ( $req ? " required='required'" : '' );

    $fields = array(
        'author' => sprintf(
            '<div class="form-field"><label class="form-label" for="author">%s%s</label><input id="author" name="author" type="text" class="form-input" value="%s" size="30"%s%s /></div>',
            esc_html__( 'Name', 'computerjy' ),
            ( $req ? ' <span class="required">*</span>' : '' ),
            esc_attr( $commenter['comment_author'] ),
            $aria_req,
            $html_req
        ),
        'email'  => sprintf(
            '<div class="form-field"><label class="form-label" for="email">%s%s</label><input id="email" name="email" type="email" class="form-input" value="%s" size="30"%s%s /></div>',
            esc_html__( 'Email', 'computerjy' ),
            ( $req ? ' <span class="required">*</span>' : '' ),
            esc_attr( $commenter['comment_author_email'] ),
            $aria_req,
            $html_req
        ),
        'url'    => sprintf(
            '<div class="form-field"><label class="form-label" for="url">%s</label><input id="url" name="url" type="url" class="form-input" value="%s" size="30" /></div>',
            esc_html__( 'Website', 'computerjy' ),
            esc_attr( $commenter['comment_author_url'] )
        ),
    );

    comment_form( array(
        'fields'               => $fields,
        'comment_field'        => sprintf(
            '<div class="form-field" style="margin-bottom: 1.25rem;"><label class="form-label" for="comment">%s <span class="required">*</span></label><textarea id="comment" name="comment" class="form-textarea" cols="45" rows="5" required="required"></textarea></div>',
            esc_html__( 'Your Comment', 'computerjy' )
        ),
        'class_form'           => 'comment-form-wrap',
        'class_submit'         => 'btn-primary btn-accent',
        'title_reply'          => '✍️ ' . esc_html__( 'Leave a Thought', 'computerjy' ),
        'title_reply_before'   => '<h3 id="reply-title" class="widget-title" style="margin-bottom: 1.5rem;">',
        'title_reply_after'    => '</h3>',
        'submit_button'        => '<button name="%1$s" type="submit" id="%2$s" class="%3$s">%4$s 🚀</button>',
        'submit_field'         => '<div class="form-submit">%1$s %2$s</div>',
    ) );
    ?>

</div>
