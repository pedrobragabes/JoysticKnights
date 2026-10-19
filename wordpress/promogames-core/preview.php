<?php
if (!defined('ABSPATH')) exit;

/** Administrators authenticate with WordPress; the frontend never gets a broad WP account. */
function promogames_core_preview_permission(WP_REST_Request $request): bool
{
    $expected = promogames_core_config()['preview_secret'];
    $supplied = (string) $request->get_header('X-PromoGames-Preview');
    return strlen($expected) >= 32 && $supplied !== '' && hash_equals($expected, $supplied);
}
function promogames_core_authorized_preview_link(string $preview_link, WP_Post $post): string
{
    $config = promogames_core_config();
    if ($post->post_type !== 'post' || !$config['frontend'] || strlen($config['preview_secret']) < 32 || !current_user_can('manage_options') || !current_user_can('edit_post', $post->ID)) return promogames_core_cms_url($preview_link);
    return add_query_arg(['action' => 'promogames_preview', 'post_id' => $post->ID, '_wpnonce' => wp_create_nonce('promogames_preview_' . $post->ID)], admin_url('admin-post.php'));
}
// Gutenberg uses the edited post's `link` for drafts, bypassing
// preview_post_link. Restrict this override to authenticated edit responses;
// published/public REST links and canonical URLs remain untouched.
add_filter('rest_prepare_post', static function (WP_REST_Response $response, WP_Post $post, WP_REST_Request $request): WP_REST_Response {
    if ($request->get_param('context') !== 'edit' || !current_user_can('manage_options') || !current_user_can('edit_post', $post->ID)
        || !in_array($post->post_status, ['draft', 'auto-draft', 'pending', 'future', 'private'], true)) return $response;
    $data = $response->get_data();
    if (isset($data['link']) && is_string($data['link'])) {
        $data['link'] = promogames_core_authorized_preview_link($data['link'], $post);
        $response->set_data($data);
    }
    return $response;
}, 20, 3);
function promogames_core_render_preview_content(WP_Post $parent, WP_Post $source, array $meta): string
{
    // Dynamic blocks and shortcodes need the parent identity and the preview
    // values, not whichever global post happens to be set in admin-post.php.
    $keys = ['post', 'id', 'authordata', 'currentday', 'currentmonth', 'page', 'pages', 'multipage', 'more', 'numpages'];
    $previous = [];
    foreach ($keys as $key) $previous[$key] = ['exists' => array_key_exists($key, $GLOBALS), 'value' => $GLOBALS[$key] ?? null];
    $preview = clone $parent;
    foreach (['post_title', 'post_content', 'post_excerpt', 'post_modified', 'post_modified_gmt'] as $field) $preview->$field = $source->$field;
    $metadata = static function (mixed $value, int $id, string $key) use ($parent, $meta): mixed {
        return $id === $parent->ID && array_key_exists($key, $meta) ? [$meta[$key]] : $value;
    };
    add_filter('get_post_metadata', $metadata, 10, 3);
    try {
        $GLOBALS['post'] = $preview;
        setup_postdata($preview);
        return (string) apply_filters('the_content', $source->post_content);
    } finally {
        remove_filter('get_post_metadata', $metadata, 10);
        foreach ($previous as $key => $state) { if ($state['exists']) $GLOBALS[$key] = $state['value']; else unset($GLOBALS[$key]); }
    }
}
function promogames_core_preview_snapshot(WP_Post $parent, int $user_id): array
{
    $source = $parent;
    $autosave = wp_get_post_autosave($parent->ID, $user_id);
    if ($autosave instanceof WP_Post && strtotime($autosave->post_modified_gmt) >= strtotime($parent->post_modified_gmt)) $source = $autosave;
    $meta = [];
    $revision_keys = wp_post_revision_meta_keys($parent->post_type);
    $meta_sources = [];
    foreach (array_merge(['promogames_deck', 'promogames_editorial_type', 'promogames_platforms', 'promogames_review_score', 'promogames_review_display', 'promogames_featured'], array_map(static fn (string $field): string => 'promogames_review_' . $field, array_keys(promogames_core_review_fields()))) as $key) {
        // Follow WordPress preview semantics for revisioned metadata, including
        // an intentionally cleared value. Nonrevisioned fields remain saved.
        $meta_sources[$key] = $source !== $parent && in_array($key, $revision_keys, true) ? $source->ID : $parent->ID;
        $meta[$key] = get_post_meta($meta_sources[$key], $key, true);
    }
    $author = get_userdata((int) $parent->post_author);
    $terms = [];
    foreach (['category', 'post_tag'] as $taxonomy) {
        $items = wp_get_post_terms($parent->ID, $taxonomy);
        if (is_wp_error($items)) continue;
        $terms[] = array_map(static fn (WP_Term $term): array => ['id' => $term->term_id, 'name' => $term->name, 'slug' => $term->slug, 'taxonomy' => $term->taxonomy, 'link' => get_term_link($term)], $items);
    }
    $embedded = ['wp:term' => $terms];
    if ($author) $embedded['author'] = [['id' => $author->ID, 'name' => $author->display_name, 'slug' => $author->user_nicename, 'description' => get_the_author_meta('description', $author->ID), 'link' => get_author_posts_url($author->ID), 'avatar_urls' => ['96' => get_avatar_url($author->ID, ['size' => 96])]]];
    $media_id = get_post_thumbnail_id($parent->ID);
    if ($media_id) $embedded['wp:featuredmedia'] = [['source_url' => wp_get_attachment_url($media_id), 'alt_text' => get_post_meta($media_id, '_wp_attachment_image_alt', true), 'media_details' => wp_get_attachment_metadata($media_id) ?: []]];
    // Drafts can have a zero GMT publication date. Match the REST date shape
    // instead of sending raw MySQL/zero dates to the frontend formatter.
    $date = $parent->post_date;
    if (!$date || str_starts_with($date, '0000-00-00')) $date = $source->post_modified;
    $date_gmt = $parent->post_date_gmt;
    if (!$date_gmt || str_starts_with($date_gmt, '0000-00-00')) $date_gmt = get_gmt_from_date($date);
    return [
        'id' => $parent->ID, 'slug' => $parent->post_name, 'link' => get_permalink($parent),
        'date' => mysql_to_rfc3339($date), 'date_gmt' => mysql_to_rfc3339($date_gmt),
        'modified' => mysql_to_rfc3339($source->post_modified), 'modified_gmt' => mysql_to_rfc3339($source->post_modified_gmt),
        'title' => ['rendered' => esc_html($source->post_title)],
        'content' => ['rendered' => promogames_core_render_preview_content($parent, $source, $meta)],
        'excerpt' => ['rendered' => $source->post_excerpt ?: wp_trim_words(wp_strip_all_tags($source->post_content), 45)],
        'comment_status' => 'closed', 'meta' => $meta,
        'promogames_review_rating' => metadata_exists('post', $meta_sources['promogames_review_score'], 'promogames_review_score') ? (float) $meta['promogames_review_score'] : null,
        '_embedded' => $embedded,
    ];
}
function promogames_core_issue_preview(WP_Post $post, int $user_id): string
{
    if ($post->post_type !== 'post' || !user_can($user_id, 'manage_options') || !user_can($user_id, 'edit_post', $post->ID)) throw new RuntimeException('Prévia não autorizada.');
    $code = bin2hex(random_bytes(32));
    set_transient('pg_preview_code_' . hash('sha256', $code), [
        'id' => $post->ID, 'user_id' => $user_id, 'wp_session' => wp_get_session_token(),
        'expires' => time() + 120, 'snapshot' => promogames_core_preview_snapshot($post, $user_id),
    ], 120);
    return $code;
}
add_action('admin_post_promogames_preview', static function (): void {
    $id = absint($_GET['post_id'] ?? 0);
    check_admin_referer('promogames_preview_' . $id);
    $post = get_post($id);
    $config = promogames_core_config();
    if (!$post instanceof WP_Post || $post->post_type !== 'post' || !current_user_can('manage_options') || !current_user_can('edit_post', $id) || !$config['frontend'] || strlen($config['preview_secret']) < 32) wp_die('Prévia não disponível para esta matéria.', '', ['response' => 403]);
    $code = promogames_core_issue_preview($post, get_current_user_id());
    nocache_headers();
    header('Referrer-Policy: no-referrer');
    wp_redirect(add_query_arg('code', $code, $config['frontend'] . '/api/draft/'), 302, 'PromoGames Preview');
    exit;
});
function promogames_core_preview_session_valid(mixed $data): bool
{
    return is_array($data) && isset($data['id'], $data['user_id'], $data['expires'], $data['wp_session'], $data['snapshot'])
        && $data['expires'] > time() && user_can((int) $data['user_id'], 'manage_options') && user_can((int) $data['user_id'], 'edit_post', (int) $data['id'])
        && WP_Session_Tokens::get_instance((int) $data['user_id'])->verify((string) $data['wp_session']);
}
function promogames_core_exchange_preview(WP_REST_Request $request): WP_REST_Response|WP_Error
{
    $code = $request->get_param('code');
    if (!is_string($code) || !preg_match('/^[a-f0-9]{64}$/D', $code)) return new WP_Error('invalid_preview', 'Prévia inválida ou expirada.', ['status' => 401]);
    $key = 'pg_preview_code_' . hash('sha256', $code);
    $data = get_transient($key);
    // The transient deletion must succeed: a second request cannot claim the
    // same snapshot, even when both read the code before the first consumes it.
    if (!promogames_core_preview_session_valid($data) || delete_transient($key) !== true) return new WP_Error('invalid_preview', 'Prévia inválida ou expirada.', ['status' => 401]);
    $ticket = bin2hex(random_bytes(32));
    $data['expires'] = time() + 15 * MINUTE_IN_SECONDS;
    set_transient('pg_preview_session_' . hash('sha256', $ticket), $data, 15 * MINUTE_IN_SECONDS);
    return new WP_REST_Response(['postId' => (int) $data['id'], 'ticket' => $ticket, 'expiresAt' => $data['expires']], 200, ['Cache-Control' => 'private, no-store']);
}
function promogames_core_read_preview(WP_REST_Request $request): WP_REST_Response|WP_Error
{
    $ticket = $request->get_param('ticket');
    $id = $request->get_param('id');
    if (!is_string($ticket) || !preg_match('/^[a-f0-9]{64}$/D', $ticket) || !is_numeric($id)) return new WP_Error('invalid_preview', 'Prévia inválida ou expirada.', ['status' => 401]);
    $data = get_transient('pg_preview_session_' . hash('sha256', $ticket));
    if (!promogames_core_preview_session_valid($data) || (int) $data['id'] !== (int) $id) return new WP_Error('invalid_preview', 'Prévia inválida ou expirada.', ['status' => 401]);
    return new WP_REST_Response(['post' => $data['snapshot']], 200, ['Cache-Control' => 'private, no-store']);
}
add_action('rest_api_init', static function (): void {
    register_rest_route('promogames/v1', '/preview/exchange', ['methods' => 'POST', 'permission_callback' => 'promogames_core_preview_permission', 'callback' => 'promogames_core_exchange_preview']);
    register_rest_route('promogames/v1', '/preview/snapshot', ['methods' => 'POST', 'permission_callback' => 'promogames_core_preview_permission', 'callback' => 'promogames_core_read_preview']);
});
