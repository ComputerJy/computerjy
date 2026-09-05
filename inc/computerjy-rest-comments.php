<?php
/**
 * Plugin Name: ComputerJy REST Comments
 * Description: Lets the static front end post visitor comments through the REST API.
 * Version: 1.0.0
 * Author: Eyad Salah
 * Requires PHP: 8.0
 *
 * The public site is a static Astro build; its comment form (src/components/Comments.astro)
 * POSTs JSON straight to /wp-json/wp/v2/comments. WordPress core refuses that by default:
 * WP_REST_Comments_Controller::create_item_permissions_check() rejects every unauthenticated
 * create with `rest_comment_login_required` / 401 unless the `rest_allow_anonymous_comments`
 * filter opts in. The visitor sees "Sorry, you must be logged in to comment." even though the
 * form asks for a name and email, because that message is core's, not the form's.
 *
 * Nothing here weakens spam handling. The REST controller runs wp_allow_comment() before
 * inserting, so duplicate detection, flood control, the disallowed-comment-keys list, Akismet
 * and the moderation queue all apply exactly as they do for the classic form. It does not go
 * through wp_new_comment(), which is why computerjy-rebuild-webhook.php has to watch
 * `wp_insert_comment` rather than `comment_post` to notice a visitor's comment.
 *
 * The other branch of that same core check is the `comment_registration` option, which returns
 * the identical message before this filter ever runs. It must be off as well:
 *
 *   sudo -u www-data wp option get comment_registration --path=/var/www/wordpress
 *
 * Empty output or 0 is the wanted state; both are falsy. A 1 there re-breaks the form.
 *
 * @package computerjy
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Allows unauthenticated visitors to create comments over the REST API.
 *
 * Scope is narrow by construction: core applies this filter only from the comments
 * controller's create permission check, and only when no user is logged in. Every later
 * check in that method still runs, so a closed, trashed, password-protected or nonexistent
 * post is still refused, and `require_name_email` still rejects a missing name or email.
 *
 * @return bool True, allowing the static site's comment form to submit.
 */
function computerjy_allow_anonymous_rest_comments() {
    return true;
}
add_filter( 'rest_allow_anonymous_comments', 'computerjy_allow_anonymous_rest_comments' );
