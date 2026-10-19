<?php
if (!defined('ABSPATH')) exit;
function promogames_core_site_fields(): array
{
    return ['homeTitle' => 'Título da home para buscadores', 'description' => 'Descrição para buscadores', 'footerDescription' => 'Descrição no rodapé', 'contactEmail' => 'E-mail público de contato', 'x' => 'Perfil no X', 'instagram' => 'Perfil no Instagram'];
}
function promogames_core_sanitize_site_settings(mixed $input): array
{
    $previous = get_option('promogames_site_settings', []);
    $previous = is_array($previous) ? $previous : [];
    if (!is_array($input)) return $previous;
    $result = [];
    foreach (['homeTitle', 'description', 'footerDescription'] as $key) $result[$key] = mb_substr(sanitize_textarea_field((string) ($input[$key] ?? '')), 0, $key === 'homeTitle' ? 120 : 500);
    $email = sanitize_email((string) ($input['contactEmail'] ?? ''));
    if ($email === '' || is_email($email)) $result['contactEmail'] = $email;
    else { $result['contactEmail'] = $previous['contactEmail'] ?? ''; add_settings_error('promogames_site_settings', 'email', 'Informe um e-mail válido.'); }
    foreach (['x' => ['x.com', 'twitter.com', 'www.x.com', 'www.twitter.com'], 'instagram' => ['instagram.com', 'www.instagram.com']] as $key => $hosts) {
        $value = trim((string) ($input[$key] ?? ''));
        $url = parse_url($value);
        if ($value === '' || ($url && ($url['scheme'] ?? '') === 'https' && in_array(strtolower($url['host'] ?? ''), $hosts, true) && !isset($url['user']) && !isset($url['pass']) && !isset($url['port']))) $result[$key] = esc_url_raw($value, ['https']);
        else { $result[$key] = $previous[$key] ?? ''; add_settings_error('promogames_site_settings', $key, 'Use o endereço HTTPS do perfil na rede correspondente.'); }
    }
    foreach (['logoId', 'socialImageId'] as $key) {
        $id = absint($input[$key] ?? 0);
        $result[$key] = !$id || wp_attachment_is_image($id) ? $id : ($previous[$key] ?? 0);
    }
    return $result;
}
add_action('admin_init', static function (): void {
    register_setting('promogames_site', 'promogames_site_settings', ['type' => 'array', 'sanitize_callback' => 'promogames_core_sanitize_site_settings', 'default' => []]);
});
add_action('admin_menu', static function (): void {
    add_submenu_page('index.php', 'Configurações do site', 'Configurações do site', 'manage_options', 'promogames-site-settings', 'promogames_core_render_site_settings');
});
function promogames_core_site_public_payload(): array
{
    $saved = get_option('promogames_site_settings', []);
    $saved = is_array($saved) ? $saved : [];
    $public = array_intersect_key($saved, promogames_core_site_fields());
    foreach (['logoId' => 'logo', 'socialImageId' => 'socialImage'] as $key => $field) {
        $image = promogames_core_home_image(absint($saved[$key] ?? 0));
        if ($image) $public[$field] = $image;
    }
    return $public;
}
add_action('rest_api_init', static function (): void {
    register_rest_route('promogames/v1', '/site-settings', ['methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => 'promogames_core_site_public_payload']);
});
function promogames_core_render_site_settings(): void
{
    if (!current_user_can('manage_options')) return;
    $saved = get_option('promogames_site_settings', []);
    ?><div class="wrap pg-admin"><h1>Configurações do site</h1><p>Campos de texto em branco mantêm o conteúdo padrão. Perfis de redes sociais em branco ficam ocultos. O e-mail público não altera caixas postais nem o destinatário das notificações do formulário.</p><?php settings_errors(''); ?><form action="options.php" method="post"><?php settings_fields('promogames_site'); ?><table class="form-table"><?php foreach (promogames_core_site_fields() as $key => $label) { ?><tr><th><label for="pg-site-<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></label></th><td><input class="large-text" id="pg-site-<?php echo esc_attr($key); ?>" type="<?php echo $key === 'contactEmail' ? 'email' : (in_array($key, ['x', 'instagram'], true) ? 'url' : 'text'); ?>" name="promogames_site_settings[<?php echo esc_attr($key); ?>]" value="<?php echo esc_attr($saved[$key] ?? ''); ?>"></td></tr><?php } ?>
    <?php foreach (['logoId' => 'Logo do site', 'socialImageId' => 'Imagem de compartilhamento da home'] as $key => $label) { ?><tr><th><?php echo esc_html($label); ?></th><td><input id="pg-site-<?php echo esc_attr($key); ?>" name="promogames_site_settings[<?php echo esc_attr($key); ?>]" type="hidden" value="<?php echo absint($saved[$key] ?? 0); ?>"> <button class="button" type="button" data-media-target="pg-site-<?php echo esc_attr($key); ?>">Escolher imagem</button> <button class="button" type="button" data-media-clear="pg-site-<?php echo esc_attr($key); ?>">Usar padrão do site</button></td></tr><?php } ?></table><?php submit_button('Salvar configurações do site'); ?></form></div><?php
}
add_action('admin_enqueue_scripts', static function (string $hook): void {
    if (!str_contains($hook, 'promogames-site-settings')) return;
    wp_enqueue_media();
    wp_enqueue_script('promogames-site-editor', plugins_url('site-editor.js', __FILE__), [], PROMOGAMES_CORE_VERSION, true);
});


function promogames_core_home_image(int $id): ?array {
    if (!$id || !wp_attachment_is_image($id)) return null;
    $image = wp_get_attachment_image_src($id, 'full');
    if (!$image) return null;
    return ['src' => $image[0], 'width' => $image[1], 'height' => $image[2], 'alt' => (string) get_post_meta($id, '_wp_attachment_image_alt', true)];
}
