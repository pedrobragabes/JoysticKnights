<?php
if (!defined('ABSPATH')) exit;

/** Point the dashboard's public-site shortcuts at the headless frontend. */
function promogames_core_admin_bar_site_links(WP_Admin_Bar $admin_bar): void
{
    $frontend = promogames_core_config()['frontend'];
    if ($frontend === '' || !is_admin()) return;
    foreach (['site-name', 'view-site'] as $id) {
        $node = $admin_bar->get_node($id);
        if (!$node) continue;
        $node->href = trailingslashit($frontend);
        $admin_bar->add_node((array) $node);
    }
}
add_action('admin_bar_menu', 'promogames_core_admin_bar_site_links', 999);

/** Read-only, session-authenticated controls. Never cache links containing nonces. */
function promogames_core_editor_toolbar(): void
{
    nocache_headers();
    header('Cache-Control: private, no-store');
    header('Vary: Origin');
    $frontend = promogames_core_config()['frontend'];
    $parts = wp_parse_url($frontend);
    $expected = isset($parts['scheme'], $parts['host']) ? $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '') : '';
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($expected === '' || $origin !== $expected || ($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
        wp_send_json_error(null, 403);
    }
    header('Access-Control-Allow-Origin: ' . $expected);
    header('Access-Control-Allow-Credentials: true');
    if (!is_user_logged_in() || !current_user_can('manage_options')) wp_send_json_error(null, 401);
    $id = absint($_GET['post_id'] ?? 0);
    $links = [
        'dashboard' => admin_url('index.php'),
        'home' => admin_url('admin.php?page=joysticknights-home'),
    ];
    if ($id) {
        $post = get_post($id);
        if (!$post instanceof WP_Post || $post->post_type !== 'post' || !current_user_can('edit_post', $id)) wp_send_json_error(null, 403);
        $links['edit'] = admin_url('post.php?post=' . $id . '&action=edit');
        if (strlen(promogames_core_config()['preview_secret']) >= 32) {
            $links['preview'] = promogames_core_authorized_preview_link('', $post);
        }
    }
    wp_send_json_success($links);
}
add_action('wp_ajax_promogames_editor_toolbar', 'promogames_core_editor_toolbar');
add_action('wp_ajax_nopriv_promogames_editor_toolbar', 'promogames_core_editor_toolbar');
