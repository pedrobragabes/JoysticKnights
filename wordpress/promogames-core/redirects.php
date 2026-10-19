<?php
if (!defined('ABSPATH')) exit;
function promogames_core_redirect_path(mixed $value): ?string
{
    if (!is_string($value) || strlen($value) > 500 || !preg_match('~^/(?:[a-zA-Z0-9_%\-]+/)*[a-zA-Z0-9_%\-]*/?$~D', $value)) return null;
    $decoded = rawurldecode($value);
    if (str_contains($decoded, '..') || str_contains($decoded, '\\') || str_contains($decoded, '//') || str_contains($decoded, '?') || str_contains($decoded, '#') || preg_match('/[\x00-\x20]/', $decoded)) return null;
    if (preg_match('~^/(?:api|preview|entrar|wp-admin|wp-json|wp-content|wp-includes|_next)(?:/|$)~i', $decoded)) return null;
    return $value === '/' ? '/' : trailingslashit($value);
}
function promogames_core_sanitize_redirects(mixed $value): array
{
    $previous = get_option('promogames_redirects', []);
    if (is_array($value)) {
        $lines = [];
        foreach ($value as $source => $destination) {
            if (!is_string($source) || !is_string($destination)) return is_array($previous) ? $previous : [];
            $lines[] = $source . ' -> ' . $destination;
        }
        $value = implode("\n", $lines);
    }
    if (!is_string($value)) return is_array($previous) ? $previous : [];
    $result = [];
    foreach (array_slice(preg_split('/\r?\n/', $value), 0, 100) as $line) {
        if (trim($line) === '') continue;
        $parts = preg_split('/\s*->\s*/', trim($line));
        $source = promogames_core_redirect_path($parts[0] ?? '');
        $destination = promogames_core_redirect_path($parts[1] ?? '');
        if (count($parts) !== 2 || !$source || !$destination || $source === '/' || $source === $destination || isset($result[$source])) {
            add_settings_error('promogames_redirects', 'invalid_redirect', 'Use uma origem única e um destino interno diferente: /endereco-antigo/ -> /endereco-novo/. Os redirecionamentos anteriores foram mantidos.');
            return is_array($previous) ? $previous : [];
        }
        $result[$source] = $destination;
    }
    foreach ($result as $source => $destination) {
        $seen = [$source => true];
        while (isset($result[$destination])) {
            if (isset($seen[$destination])) { add_settings_error('promogames_redirects', 'redirect_cycle', 'Existe um ciclo nos redirecionamentos. A configuração anterior foi mantida.'); return is_array($previous) ? $previous : []; }
            $seen[$destination] = true; $destination = $result[$destination];
        }
        $result[$source] = $destination;
    }
    return $result;
}
function promogames_core_resolve_redirect(WP_REST_Request $request): array
{
    $path = promogames_core_redirect_path($request->get_param('path'));
    if (!$path) return ['destination' => null];
    $rules = get_option('promogames_redirects', []);
    if (is_array($rules) && isset($rules[$path])) return ['destination' => promogames_core_redirect_path($rules[$path])];
    $post_id = absint($request->get_param('postId') ?? 0);
    $post = $path === '/' && $post_id ? get_post($post_id) : null;
    if (!$post && preg_match('~^/([^/]+)/$~D', $path, $matches)) {
        $old_slug = sanitize_title(rawurldecode($matches[1]));
        $found = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 1, 'meta_key' => '_wp_old_slug', 'meta_value' => $old_slug]);
        $post = $found[0] ?? null;
    }
    if (!$post instanceof WP_Post || $post->post_status !== 'publish' || $post->post_type !== 'post') return ['destination' => null];
    $destination = promogames_core_redirect_path(wp_parse_url(get_permalink($post), PHP_URL_PATH));
    return ['destination' => $destination && $destination !== $path ? $destination : null];
}
add_action('admin_init', static function (): void { register_setting('promogames_redirects', 'promogames_redirects', ['type' => 'array', 'sanitize_callback' => 'promogames_core_sanitize_redirects', 'default' => []]); });
add_action('admin_menu', static function (): void { add_submenu_page('tools.php', 'Redirecionamentos', 'URLs e redirecionamentos', 'manage_options', 'promogames-redirects', 'promogames_core_render_redirects'); });
function promogames_core_render_redirects(): void
{
    if (!current_user_can('manage_options')) return;
    $rules = get_option('promogames_redirects', []);
    $lines = [];
    foreach ((array) $rules as $source => $destination) $lines[] = $source . ' -> ' . $destination;
    ?><div class="wrap"><h1>URLs e redirecionamentos</h1><p>Ao renomear uma matéria publicada, seu slug antigo é reconhecido automaticamente. Cadastre aqui outros endereços antigos. Use apenas caminhos internos, um por linha.</p><?php settings_errors(''); ?><form action="options.php" method="post"><?php settings_fields('promogames_redirects'); ?><textarea class="large-text code" rows="12" name="promogames_redirects" aria-label="Redirecionamentos" placeholder="/endereco-antigo/ -> /endereco-novo/"><?php echo esc_textarea(implode("\n", $lines)); ?></textarea><?php submit_button('Salvar redirecionamentos'); ?></form></div><?php
}
add_action('rest_api_init', static function (): void { register_rest_route('promogames/v1', '/resolve-redirect', ['methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => 'promogames_core_resolve_redirect']); });
