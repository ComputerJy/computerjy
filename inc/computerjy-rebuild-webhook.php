<?php
/**
 * Plugin Name: ComputerJy Rebuild Dispatch
 * Description: Triggers the GitHub Actions deploy workflow when content the static site is built from changes.
 * Version: 2.0.0
 * Author: Eyad Salah
 * Requires PHP: 8.0
 *
 * The public site is a static Astro build that fetches its content from this
 * install's REST API at build time. Nothing published here reaches visitors until
 * that build runs, so this plugin is the link between "Publish" and "live".
 *
 * It POSTs to GitHub's repository_dispatch endpoint, which starts
 * .github/workflows/deploy.yml. There is no Cloudflare Pages / Vercel / Netlify
 * build hook in this architecture; earlier versions of this file assumed one.
 *
 * @package computerjy
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Reads the GitHub token.
 *
 * Deliberately a wp-config.php constant rather than an option: this host keeps
 * WordPress database backups on disk, and an option would be copied into every
 * one of them. The token can start a production deploy, so it stays out of the
 * database entirely.
 *
 * define( 'COMPUTERJY_GITHUB_DISPATCH_TOKEN', 'github_pat_...' );
 *
 * @return string Token, or an empty string when unconfigured.
 */
function computerjy_dispatch_token() {
    if ( ! defined( 'COMPUTERJY_GITHUB_DISPATCH_TOKEN' ) ) {
        return '';
    }
    return trim( (string) constant( 'COMPUTERJY_GITHUB_DISPATCH_TOKEN' ) );
}

/**
 * Returns the owner/repo the dispatch is sent to.
 *
 * @return string
 */
function computerjy_dispatch_repo() {
    if ( defined( 'COMPUTERJY_GITHUB_DISPATCH_REPO' ) ) {
        return (string) constant( 'COMPUTERJY_GITHUB_DISPATCH_REPO' );
    }
    return 'ComputerJy/computerjy';
}

/**
 * Records that a rebuild is needed and arranges for exactly one dispatch per
 * request, sent at shutdown.
 *
 * Deferring to shutdown rather than firing on the first hook is what makes a bulk
 * change correct. WP-CLI runs an entire import inside a single request, so
 * dispatching immediately would start a deploy against the state at the *first*
 * post and never send another. At shutdown the final state is in the database.
 *
 * @param string $reason Short machine-generated description of what changed.
 */
function computerjy_queue_rebuild( $reason ) {
    if ( '' === computerjy_dispatch_token() ) {
        return;
    }
    $reasons = computerjy_rebuild_reasons( $reason );
    if ( 1 === count( $reasons ) ) {
        add_action( 'shutdown', 'computerjy_dispatch_pending_rebuild', 1 );
    }
}

/**
 * Accumulates the reasons recorded during this request.
 *
 * @param string|null $add Reason to record, or null to read the list.
 * @return string[]
 */
function computerjy_rebuild_reasons( $add = null ) {
    static $reasons = array();
    if ( null !== $add ) {
        $reasons[] = $add;
    }
    return $reasons;
}

/**
 * Sends the single dispatch for this request.
 */
function computerjy_dispatch_pending_rebuild() {
    $reasons = computerjy_rebuild_reasons();
    if ( empty( $reasons ) ) {
        return;
    }
    $count  = count( $reasons );
    $reason = $count > 1
        ? sprintf( '%s (+%d more)', $reasons[0], $count - 1 )
        : $reasons[0];
    computerjy_trigger_rebuild( $reason );
}

/**
 * POSTs one repository_dispatch to GitHub.
 *
 * No debouncing happens here beyond the per-request collapsing above. Bursts across
 * separate requests are handled by the workflow's concurrency group, because GitHub
 * already implements the right semantics: at most one run per group is pending, and
 * queueing another cancels the previous pending one. A bulk edit therefore collapses
 * to two deploys — the one already running, and one more that sees the final state.
 *
 * Doing it that way rather than with wp_schedule_single_event is not a style
 * preference: WP-Cron fires on page loads, and this install is headless, so a
 * scheduled event could sit unfired indefinitely.
 *
 * @param string $reason Short machine-generated description, shown in the Actions run name.
 */
function computerjy_trigger_rebuild( $reason ) {
    $response = wp_remote_post(
        'https://api.github.com/repos/' . computerjy_dispatch_repo() . '/dispatches',
        array(
            // Blocking, unlike a fire-and-forget POST, so a rejected token is
            // recorded and visible in Settings instead of failing silently. This
            // runs at shutdown, after the response has been sent.
            'timeout' => 5,
            'headers' => array(
                'Accept'               => 'application/vnd.github+json',
                'Authorization'        => 'Bearer ' . computerjy_dispatch_token(),
                'Content-Type'         => 'application/json',
                'X-GitHub-Api-Version' => '2022-11-28',
            ),
            'body'    => wp_json_encode(
                array(
                    'event_type'     => 'wp-content-updated',
                    'client_payload' => array( 'reason' => $reason ),
                )
            ),
        )
    );

    if ( is_wp_error( $response ) ) {
        $result = 'error: ' . $response->get_error_message();
    } else {
        $code = (int) wp_remote_retrieve_response_code( $response );
        // GitHub answers 204 No Content when the dispatch is accepted.
        $result = 204 === $code
            ? 'queued'
            : 'HTTP ' . $code . ' ' . substr( (string) wp_remote_retrieve_body( $response ), 0, 200 );
    }

    update_option(
        'computerjy_last_dispatch',
        array(
            'time'   => time(),
            'reason' => $reason,
            'result' => $result,
        ),
        false
    );
}

/*
 * The hooks below mirror exactly what src/lib/wp-loader.ts fetches: published
 * posts, terms and featured media only. Anything else in WordPress leaves the
 * built site unchanged and must not start a deploy. Pages are absent on purpose —
 * contact-me and privacy-policy are hand-authored Astro files, not WordPress
 * content.
 *
 * Comments are deliberately absent. They are fetched by the browser at view time
 * (see src/components/Comments.astro), so a comment changes nothing the build
 * produces and must not start a deploy. Rebuilding 490 pages to publish one
 * paragraph is what this removal exists to stop.
 */

/**
 * Fires on publish, unpublish, scheduled publication and edits of live posts.
 *
 * @param string  $new_status New post status.
 * @param string  $old_status Previous post status.
 * @param WP_Post $post       Post object.
 */
function computerjy_on_post_transition( $new_status, $old_status, $post ) {
    if ( 'post' !== $post->post_type ) {
        return;
    }
    // The loader fetches published posts only, so a transition that neither enters
    // nor leaves "publish" (draft to draft, pending to draft) changes nothing.
    if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
        return;
    }
    computerjy_queue_rebuild(
        sprintf( 'post %d: %s to %s', (int) $post->ID, $old_status, $new_status )
    );
}
add_action( 'transition_post_status', 'computerjy_on_post_transition', 10, 3 );

/**
 * Catches a permanent delete, which bypasses transition_post_status entirely.
 *
 * @param int          $post_id Deleted post ID.
 * @param WP_Post|null $post    Deleted post object, passed since WP 5.5.
 */
function computerjy_on_post_deleted( $post_id, $post = null ) {
    if ( ! $post instanceof WP_Post || 'post' !== $post->post_type ) {
        return;
    }
    // Emptying the trash deletes posts the site already excludes; the transition
    // into "trash" was the change worth deploying, and it already dispatched.
    if ( 'trash' === $post->post_status ) {
        return;
    }
    computerjy_queue_rebuild( sprintf( 'post %d deleted', (int) $post_id ) );
}
add_action( 'deleted_post', 'computerjy_on_post_deleted', 10, 2 );

/**
 * Handles category and tag creation, renaming, description edits and deletion.
 *
 * Term names and descriptions are rendered on the archive pages, so a rename that
 * touches no post still changes the built site.
 *
 * @param int    $term_id  Term ID.
 * @param int    $tt_id    Term taxonomy ID.
 * @param string $taxonomy Taxonomy slug.
 */
function computerjy_on_term_changed( $term_id, $tt_id, $taxonomy ) {
    if ( 'category' !== $taxonomy && 'post_tag' !== $taxonomy ) {
        return;
    }
    computerjy_queue_rebuild( sprintf( '%s term %d changed', $taxonomy, (int) $term_id ) );
}
add_action( 'created_term', 'computerjy_on_term_changed', 10, 3 );
add_action( 'edited_term', 'computerjy_on_term_changed', 10, 3 );
add_action( 'delete_term', 'computerjy_on_term_changed', 10, 3 );

/**
 * Handles a replaced media file.
 *
 * Editing a post that owns the featured image already dispatches; this covers
 * replacing the file itself, where the source URL changes and no post hook fires.
 *
 * @param int $post_id Attachment ID.
 */
function computerjy_on_attachment_updated( $post_id ) {
    computerjy_queue_rebuild( sprintf( 'attachment %d updated', (int) $post_id ) );
}
add_action( 'attachment_updated', 'computerjy_on_attachment_updated', 10, 1 );

/**
 * Handles a deleted attachment.
 *
 * @param int $post_id Attachment ID.
 */
function computerjy_on_attachment_deleted( $post_id ) {
    computerjy_queue_rebuild( sprintf( 'attachment %d deleted', (int) $post_id ) );
}
add_action( 'delete_attachment', 'computerjy_on_attachment_deleted', 10, 1 );

/**
 * Adds a read-only status row to Settings -> General.
 *
 * There is nothing to configure in the database — the token is a wp-config.php
 * constant — so this reports configuration and the outcome of the last dispatch
 * instead. Without it, a revoked or expired token would be invisible.
 */
function computerjy_register_rebuild_status() {
    add_settings_field(
        'computerjy_rebuild_status',
        __( 'Static site rebuild', 'computerjy' ),
        'computerjy_rebuild_status_html',
        'general'
    );
}
add_action( 'admin_init', 'computerjy_register_rebuild_status' );

/**
 * Renders the status row.
 */
function computerjy_rebuild_status_html() {
    if ( '' === computerjy_dispatch_token() ) {
        echo '<p><strong>' . esc_html__( 'Not configured.', 'computerjy' ) . '</strong> ';
        echo esc_html__(
            'Define COMPUTERJY_GITHUB_DISPATCH_TOKEN in wp-config.php. Until then, publishing does not update the live site.',
            'computerjy'
        );
        echo '</p>';
        return;
    }

    echo '<p>';
    printf(
        /* translators: %s: GitHub repository in owner/name form. */
        esc_html__( 'Publishing dispatches a deploy to %s.', 'computerjy' ),
        '<code>' . esc_html( computerjy_dispatch_repo() ) . '</code>'
    );
    echo '</p>';

    $last = get_option( 'computerjy_last_dispatch' );
    if ( ! is_array( $last ) ) {
        echo '<p class="description">' . esc_html__( 'No deploy has been triggered yet.', 'computerjy' ) . '</p>';
        return;
    }

    echo '<p class="description">';
    printf(
        /* translators: 1: date and time, 2: what changed, 3: result reported by GitHub. */
        esc_html__( 'Last trigger: %1$s — %2$s — %3$s', 'computerjy' ),
        esc_html( date_i18n( 'Y-m-d H:i', (int) $last['time'] ) ),
        esc_html( (string) $last['reason'] ),
        esc_html( (string) $last['result'] )
    );
    echo '</p>';
}
