<?php
if (!defined('ABSPATH')) exit;
function joysticknights_home_defaults(): array {
    return ['title' => 'Notícias', 'highlightsTitle' => 'Destaques', 'platformsTitle' => 'Plataformas', 'feedTitle' => 'Últimas publicações', 'showRadar' => true, 'showHighlights' => true, 'showPlatforms' => true, 'sections' => ['highlights', 'platforms']];
}
function joysticknights_sanitize_home(mixed $input): array {
    $defaults = joysticknights_home_defaults();
    $previous = get_option('joysticknights_editorial_home', $defaults);
    if (!is_array($input)) return is_array($previous) ? $previous : $defaults;
    $result = $defaults;
    foreach (['title', 'highlightsTitle', 'platformsTitle', 'feedTitle'] as $key) $result[$key] = mb_substr(sanitize_text_field((string) ($input[$key] ?? '')), 0, 100) ?: $defaults[$key];
    foreach (['showRadar', 'showHighlights', 'showPlatforms'] as $key) $result[$key] = !empty($input[$key]);
    if (($input['firstSection'] ?? '') === 'platforms') $result['sections'] = ['platforms', 'highlights'];
    return $result;
}
add_action('admin_init', static function (): void { register_setting('joysticknights_home', 'joysticknights_editorial_home', ['type' => 'array', 'sanitize_callback' => 'joysticknights_sanitize_home', 'default' => joysticknights_home_defaults()]); });
add_action('admin_menu', static function (): void { add_submenu_page('index.php', 'Página inicial JoysticKnights', 'Página inicial', 'manage_options', 'joysticknights-home', 'joysticknights_render_home'); });
function joysticknights_home_payload(): array {
    $saved = get_option('joysticknights_editorial_home', []);
    return array_merge(joysticknights_home_defaults(), is_array($saved) ? array_intersect_key($saved, joysticknights_home_defaults()) : []);
}
add_action('rest_api_init', static function (): void { register_rest_route('promogames/v1', '/editorial-settings', ['methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => 'joysticknights_home_payload']); });
function joysticknights_render_home(): void {
    if (!current_user_can('manage_options')) return;
    $settings = joysticknights_home_payload();
    ?><div class="wrap"><h1>Página inicial — JoysticKnights</h1><p>Personalize a capa editorial. As matérias continuam no editor de posts.</p><?php settings_errors(''); ?><form action="options.php" method="post"><?php settings_fields('joysticknights_home'); ?><table class="form-table">
    <?php foreach (['title' => 'Título principal', 'highlightsTitle' => 'Título dos destaques', 'platformsTitle' => 'Título das plataformas', 'feedTitle' => 'Título das últimas publicações'] as $key => $label) { ?><tr><th><label for="jk-<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></label></th><td><input class="regular-text" maxlength="100" id="jk-<?php echo esc_attr($key); ?>" name="joysticknights_editorial_home[<?php echo esc_attr($key); ?>]" value="<?php echo esc_attr($settings[$key]); ?>"></td></tr><?php } ?>
    <?php foreach (['showRadar' => 'Exibir radar', 'showHighlights' => 'Exibir destaques', 'showPlatforms' => 'Exibir plataformas'] as $key => $label) { ?><tr><th><?php echo esc_html($label); ?></th><td><label><input type="checkbox" value="1" name="joysticknights_editorial_home[<?php echo esc_attr($key); ?>]" <?php checked($settings[$key]); ?>> Ativo</label></td></tr><?php } ?>
    <tr><th><label for="jk-order">Primeira seção</label></th><td><select id="jk-order" name="joysticknights_editorial_home[firstSection]"><option value="highlights" <?php selected($settings['sections'][0], 'highlights'); ?>>Destaques</option><option value="platforms" <?php selected($settings['sections'][0], 'platforms'); ?>>Plataformas</option></select></td></tr>
    </table><?php submit_button('Salvar página inicial'); ?></form></div><?php
}
