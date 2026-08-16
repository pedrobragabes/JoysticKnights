<?php
/**
 * Plugin Name: PromoGames Core
 * Description: Integração editorial headless: metacampos, SEO, curadoria, preview e revalidação.
 * Version: 1.2.0
 * Author: PromoGames
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Text Domain: promogames-core
 */

if (!defined('ABSPATH')) {
    exit;
}

const PROMOGAMES_CORE_VERSION = '1.2.0';

/**
 * Registra os metacampos que formam o contrato editorial do front headless.
 */
function promogames_core_register_meta(): void
{
    $common = [
        'object_subtype' => 'post',
        'single' => true,
        'auth_callback' => static fn (): bool => current_user_can('edit_posts'),
    ];

    register_post_meta('post', 'promogames_deck', $common + [
        'type' => 'string',
        'sanitize_callback' => 'sanitize_textarea_field',
        'show_in_rest' => ['schema' => ['type' => 'string']],
    ]);
    register_post_meta('post', 'promogames_editorial_type', $common + [
        'type' => 'string',
        'sanitize_callback' => 'promogames_core_sanitize_editorial_type',
        'show_in_rest' => ['schema' => ['type' => 'string', 'enum' => ['noticia', 'analise', 'guia', 'promocao']]],
    ]);
    register_post_meta('post', 'promogames_platforms', $common + [
        'type' => 'array',
        'default' => [],
        'sanitize_callback' => 'promogames_core_sanitize_platforms',
        'show_in_rest' => ['schema' => ['type' => 'array', 'items' => ['type' => 'string']]],
    ]);
    register_post_meta('post', 'promogames_review_score', $common + [
        'type' => 'number',
        'sanitize_callback' => 'promogames_core_sanitize_score',
        'show_in_rest' => ['schema' => ['type' => 'number', 'minimum' => 0, 'maximum' => 10]],
    ]);
    register_post_meta('post', 'promogames_featured', $common + [
        'type' => 'boolean',
        'default' => false,
        'sanitize_callback' => 'rest_sanitize_boolean',
        'show_in_rest' => ['schema' => ['type' => 'boolean']],
    ]);
    register_post_meta('post', 'promogames_featured_order', $common + [
        'type' => 'integer',
        'default' => 0,
        'sanitize_callback' => 'absint',
        'show_in_rest' => ['schema' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 99]],
    ]);
}
add_action('init', 'promogames_core_register_meta');

function promogames_core_sanitize_editorial_type(mixed $value): string
{
    $value = sanitize_key((string) $value);
    return in_array($value, ['noticia', 'analise', 'guia', 'promocao'], true) ? $value : 'noticia';
}

/** @return array<int, string> */
function promogames_core_sanitize_platforms(mixed $value): array
{
    $allowed = ['playstation', 'xbox', 'nintendo', 'pc', 'mobile', 'vr'];
    $values = is_array($value) ? $value : explode(',', (string) $value);
    return array_values(array_intersect($allowed, array_unique(array_map('sanitize_key', $values))));
}

function promogames_core_sanitize_score(mixed $value): float
{
    return max(0, min(10, (float) $value));
}

function promogames_core_add_meta_box(): void
{
    add_meta_box(
        'promogames-editorial',
        sprintf('%s — dados editoriais', esc_html(promogames_core_site_name())),
        'promogames_core_render_meta_box',
        'post',
        'side',
        'high'
    );
}
add_action('add_meta_boxes', 'promogames_core_add_meta_box');

function promogames_core_site_name(): string
{
    $name = defined('PROMOGAMES_SITE_NAME') ? (string) PROMOGAMES_SITE_NAME : (string) get_bloginfo('name');
    return sanitize_text_field($name ?: 'PromoGames');
}

function promogames_core_render_meta_box(WP_Post $post): void
{
    wp_nonce_field('promogames_core_save_meta', 'promogames_core_nonce');
    $deck = (string) get_post_meta($post->ID, 'promogames_deck', true);
    $type = (string) get_post_meta($post->ID, 'promogames_editorial_type', true) ?: 'noticia';
    $platforms = (array) get_post_meta($post->ID, 'promogames_platforms', true);
    $score = get_post_meta($post->ID, 'promogames_review_score', true);
    $featured = (bool) get_post_meta($post->ID, 'promogames_featured', true);
    $order = (int) get_post_meta($post->ID, 'promogames_featured_order', true);
    ?>
    <p><label for="promogames_deck"><strong>Deck / linha fina</strong></label></p>
    <textarea class="widefat" rows="4" id="promogames_deck" name="promogames_deck"><?php echo esc_textarea($deck); ?></textarea>
    <p><label for="promogames_editorial_type"><strong>Tipo editorial</strong></label></p>
    <select class="widefat" id="promogames_editorial_type" name="promogames_editorial_type">
        <?php foreach (['noticia' => 'Notícia', 'analise' => 'Análise', 'guia' => 'Guia', 'promocao' => 'Promoção'] as $value => $label) : ?>
            <option value="<?php echo esc_attr($value); ?>" <?php selected($type, $value); ?>><?php echo esc_html($label); ?></option>
        <?php endforeach; ?>
    </select>
    <p><strong>Plataformas</strong></p>
    <?php foreach (['playstation' => 'PlayStation', 'xbox' => 'Xbox', 'nintendo' => 'Nintendo', 'pc' => 'PC', 'mobile' => 'Mobile', 'vr' => 'VR'] as $value => $label) : ?>
        <label style="display:block;margin:.35rem 0"><input type="checkbox" name="promogames_platforms[]" value="<?php echo esc_attr($value); ?>" <?php checked(in_array($value, $platforms, true)); ?>> <?php echo esc_html($label); ?></label>
    <?php endforeach; ?>
    <p><label for="promogames_review_score"><strong>Nota (0–10)</strong></label><input class="widefat" type="number" min="0" max="10" step="0.1" id="promogames_review_score" name="promogames_review_score" value="<?php echo esc_attr((string) $score); ?>"></p>
    <p><label><input type="checkbox" name="promogames_featured" value="1" <?php checked($featured); ?>> Destacar na home</label></p>
    <p><label for="promogames_featured_order"><strong>Ordem do destaque</strong></label><input class="small-text" type="number" min="0" max="99" id="promogames_featured_order" name="promogames_featured_order" value="<?php echo esc_attr((string) $order); ?>"></p>
    <?php
}

function promogames_core_save_meta(int $post_id): void
{
    if (!isset($_POST['promogames_core_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['promogames_core_nonce'])), 'promogames_core_save_meta')) {
        return;
    }
    if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($post_id) || !current_user_can('edit_post', $post_id)) {
        return;
    }

    $deck = isset($_POST['promogames_deck']) ? sanitize_textarea_field(wp_unslash($_POST['promogames_deck'])) : '';
    $type = promogames_core_sanitize_editorial_type(isset($_POST['promogames_editorial_type']) ? wp_unslash($_POST['promogames_editorial_type']) : 'noticia');
    $platforms = promogames_core_sanitize_platforms(isset($_POST['promogames_platforms']) ? (array) wp_unslash($_POST['promogames_platforms']) : []);
    $score = isset($_POST['promogames_review_score']) && $_POST['promogames_review_score'] !== '' ? promogames_core_sanitize_score(wp_unslash($_POST['promogames_review_score'])) : null;
    $featured = isset($_POST['promogames_featured']);
    $order = isset($_POST['promogames_featured_order']) ? min(99, absint($_POST['promogames_featured_order'])) : 0;

    $deck === '' ? delete_post_meta($post_id, 'promogames_deck') : update_post_meta($post_id, 'promogames_deck', $deck);
    update_post_meta($post_id, 'promogames_editorial_type', $type);
    update_post_meta($post_id, 'promogames_platforms', $platforms);
    $score === null ? delete_post_meta($post_id, 'promogames_review_score') : update_post_meta($post_id, 'promogames_review_score', $score);
    update_post_meta($post_id, 'promogames_featured', $featured);
    update_post_meta($post_id, 'promogames_featured_order', $order);
}
add_action('save_post_post', 'promogames_core_save_meta');

function promogames_core_register_rest_routes(): void
{
    register_rest_route('promogames/v1', '/home', [
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => '__return_true',
        'args' => [
            'per_page' => ['default' => 4, 'sanitize_callback' => 'absint', 'validate_callback' => static fn ($value): bool => (int) $value >= 1 && (int) $value <= 12],
        ],
        'callback' => 'promogames_core_home_endpoint',
    ]);
    register_rest_route('promogames/v1', '/comments', [
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => 'promogames_core_comments_permission',
        'args' => [
            'post' => ['required' => true, 'sanitize_callback' => 'absint'],
            'author_name' => ['required' => true, 'sanitize_callback' => 'sanitize_text_field'],
            'author_email' => ['required' => true, 'sanitize_callback' => 'sanitize_email'],
            'content' => ['required' => true, 'sanitize_callback' => 'wp_kses_post'],
        ],
        'callback' => 'promogames_core_create_comment',
    ]);
}
add_action('rest_api_init', 'promogames_core_register_rest_routes');

function promogames_core_comments_permission(WP_REST_Request $request): bool
{
    $config = promogames_core_config();
    $supplied = (string) $request->get_header('x-promogames-comments-secret');
    return $config['comments_secret'] !== ''
        && $supplied !== ''
        && strlen($supplied) <= 256
        && hash_equals($config['comments_secret'], $supplied);
}

function promogames_core_create_comment(WP_REST_Request $request): WP_REST_Response|WP_Error
{
    $post_id = absint($request->get_param('post'));
    $post = get_post($post_id);
    if (!$post instanceof WP_Post || $post->post_type !== 'post' || $post->post_status !== 'publish' || $post->post_password !== '') {
        return new WP_Error('promogames_invalid_post', 'Matéria indisponível para comentários.', ['status' => 404]);
    }
    if (!comments_open($post_id)) {
        return new WP_Error('promogames_comments_closed', 'Os comentários desta matéria estão fechados.', ['status' => 403]);
    }

    $author_name = trim((string) $request->get_param('author_name'));
    $author_email = trim((string) $request->get_param('author_email'));
    $content = trim((string) $request->get_param('content'));
    if (
        promogames_core_string_length($author_name) < 2
        || promogames_core_string_length($author_name) > 80
        || !is_email($author_email)
        || promogames_core_string_length($author_email) > 254
        || promogames_core_string_length(wp_strip_all_tags($content)) < 3
        || promogames_core_string_length($content) > 5000
    ) {
        return new WP_Error('promogames_invalid_comment', 'Dados do comentário inválidos.', ['status' => 400]);
    }

    $comment_id = wp_new_comment([
        'comment_post_ID' => $post_id,
        'comment_author' => $author_name,
        'comment_author_email' => $author_email,
        'comment_author_url' => '',
        'comment_content' => $content,
        'comment_type' => 'comment',
        'comment_parent' => 0,
        'user_id' => 0,
        'comment_agent' => 'PromoGames Headless',
    ], true);

    if (is_wp_error($comment_id)) {
        $status = $comment_id->get_error_code() === 'comment_duplicate' ? 409 : 400;
        return new WP_Error('promogames_comment_rejected', 'O WordPress recusou o comentário.', ['status' => $status]);
    }
    if (!$comment_id) {
        return new WP_Error('promogames_comment_insert_failed', 'Não foi possível salvar o comentário.', ['status' => 500]);
    }

    $status = wp_get_comment_status((int) $comment_id) === 'approved' ? 'approved' : 'pending';
    return new WP_REST_Response(['id' => (int) $comment_id, 'status' => $status], 201);
}

function promogames_core_string_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
}

function promogames_core_register_rest_fields(): void
{
    register_rest_field(['post', 'page'], 'promogames_seo', [
        'get_callback' => 'promogames_core_get_seo_field',
        'schema' => [
            'description' => 'Metadados SEO normalizados para o frontend headless.',
            'type' => 'object',
            'context' => ['view', 'edit', 'embed'],
            'readonly' => true,
            'properties' => [
                'title' => ['type' => 'string'],
                'description' => ['type' => 'string'],
                'canonical' => ['type' => 'string', 'format' => 'uri'],
                'social_image' => ['type' => 'string', 'format' => 'uri'],
            ],
        ],
    ]);
}
add_action('rest_api_init', 'promogames_core_register_rest_fields');

/** @param array<string, mixed> $object */
function promogames_core_get_seo_field(array $object): array
{
    $post_id = isset($object['id']) ? absint($object['id']) : 0;
    if ($post_id < 1) {
        return [];
    }

    // Preserve a single REST contract independently of the SEO plugin used by each publication.
    // The Genesis-prefixed keys below are the compatibility keys used by The SEO Framework.
    $title = promogames_core_first_meta($post_id, [
        '_genesis_title',
        '_seopress_titles_title',
        '_yoast_wpseo_title',
        'rank_math_title',
    ]);
    $description = promogames_core_first_meta($post_id, [
        '_genesis_description',
        '_seopress_titles_desc',
        '_yoast_wpseo_metadesc',
        'rank_math_description',
    ]);
    $canonical = promogames_core_first_meta($post_id, [
        '_genesis_canonical_uri',
        '_seopress_robots_canonical',
        '_yoast_wpseo_canonical',
        'rank_math_canonical_url',
    ]);
    $social_image = promogames_core_first_meta($post_id, [
        '_social_image_url',
        '_seopress_social_fb_img',
        '_seopress_social_twitter_img',
        '_yoast_wpseo_opengraph-image',
        '_yoast_wpseo_twitter-image',
        'rank_math_facebook_image',
        'rank_math_twitter_image',
    ]);
    if ($social_image === '') {
        $social_image = promogames_core_first_attachment_url($post_id, [
            '_social_image_id',
            '_seopress_social_fb_img_attachment_id',
            '_seopress_social_twitter_img_attachment_id',
            '_yoast_wpseo_opengraph-image-id',
            '_yoast_wpseo_twitter-image-id',
            'rank_math_facebook_image_id',
            'rank_math_twitter_image_id',
        ]);
    }

    return array_filter([
        'title' => sanitize_text_field($title),
        'description' => sanitize_textarea_field($description),
        'canonical' => esc_url_raw($canonical),
        'social_image' => esc_url_raw($social_image),
    ], static fn (string $value): bool => $value !== '');
}

/** @param array<int, string> $keys */
function promogames_core_first_attachment_url(int $post_id, array $keys): string
{
    foreach ($keys as $key) {
        $attachment_id = absint(get_post_meta($post_id, $key, true));
        if ($attachment_id < 1) {
            continue;
        }

        $url = wp_get_attachment_image_url($attachment_id, 'full');
        if (is_string($url) && $url !== '') {
            return $url;
        }
    }

    return '';
}

/** @param array<int, string> $keys */
function promogames_core_first_meta(int $post_id, array $keys): string
{
    foreach ($keys as $key) {
        $value = trim((string) get_post_meta($post_id, $key, true));
        if ($value !== '') {
            return $value;
        }
    }
    return '';
}

function promogames_core_home_endpoint(WP_REST_Request $request): WP_REST_Response
{
    $query = new WP_Query([
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => (int) $request->get_param('per_page'),
        'meta_query' => [['key' => 'promogames_featured', 'value' => '1', 'compare' => '=']],
        'meta_key' => 'promogames_featured_order',
        'orderby' => ['meta_value_num' => 'ASC', 'date' => 'DESC'],
        'no_found_rows' => true,
    ]);

    $items = array_map(static function (WP_Post $post): array {
        $image = wp_get_attachment_image_src(get_post_thumbnail_id($post), 'large');
        return [
            'id' => $post->ID,
            'slug' => $post->post_name,
            'link' => get_permalink($post),
            'title' => ['rendered' => get_the_title($post)],
            'excerpt' => ['rendered' => apply_filters('the_excerpt', get_the_excerpt($post))],
            'date' => get_post_time('c', true, $post),
            'modified' => get_post_modified_time('c', true, $post),
            'author' => (int) $post->post_author,
            'featured_media' => (int) get_post_thumbnail_id($post),
            'image' => $image ? ['url' => $image[0], 'width' => $image[1], 'height' => $image[2]] : null,
            'categories' => wp_get_post_categories($post->ID),
            'meta' => [
                'promogames_deck' => (string) get_post_meta($post->ID, 'promogames_deck', true),
                'promogames_editorial_type' => (string) get_post_meta($post->ID, 'promogames_editorial_type', true),
                'promogames_platforms' => (array) get_post_meta($post->ID, 'promogames_platforms', true),
                'promogames_review_score' => get_post_meta($post->ID, 'promogames_review_score', true),
                'promogames_featured' => true,
                'promogames_featured_order' => (int) get_post_meta($post->ID, 'promogames_featured_order', true),
            ],
        ];
    }, $query->posts);

    return rest_ensure_response(['items' => $items, 'generated_at' => gmdate('c')]);
}

/** @return array{frontend:string,preview_secret:string,revalidate_url:string,revalidate_secret:string,comments_secret:string} */
function promogames_core_config(): array
{
    return [
        'frontend' => defined('PROMOGAMES_FRONTEND_URL') ? untrailingslashit(PROMOGAMES_FRONTEND_URL) : '',
        'preview_secret' => defined('PROMOGAMES_PREVIEW_SECRET') ? (string) PROMOGAMES_PREVIEW_SECRET : '',
        'revalidate_url' => defined('PROMOGAMES_REVALIDATE_URL') ? (string) PROMOGAMES_REVALIDATE_URL : '',
        'revalidate_secret' => defined('PROMOGAMES_REVALIDATE_SECRET') ? (string) PROMOGAMES_REVALIDATE_SECRET : '',
        'comments_secret' => defined('PROMOGAMES_COMMENTS_SECRET') ? (string) PROMOGAMES_COMMENTS_SECRET : '',
    ];
}

function promogames_core_frontend_url(string $source_url): string
{
    $frontend = promogames_core_config()['frontend'];
    if ($frontend === '') {
        return $source_url;
    }

    $path = (string) wp_parse_url($source_url, PHP_URL_PATH);
    $query = (string) wp_parse_url($source_url, PHP_URL_QUERY);
    $fragment = (string) wp_parse_url($source_url, PHP_URL_FRAGMENT);
    $path = $path === '' ? '/' : '/' . ltrim($path, '/');
    return $frontend . $path . ($query !== '' ? '?' . $query : '') . ($fragment !== '' ? '#' . $fragment : '');
}

function promogames_core_cms_url(string $source_url): string
{
    $path = (string) wp_parse_url($source_url, PHP_URL_PATH);
    $query = (string) wp_parse_url($source_url, PHP_URL_QUERY);
    $fragment = (string) wp_parse_url($source_url, PHP_URL_FRAGMENT);
    $path = $path === '' ? '/' : '/' . ltrim($path, '/');
    return untrailingslashit(home_url()) . $path . ($query !== '' ? '?' . $query : '') . ($fragment !== '' ? '#' . $fragment : '');
}

function promogames_core_post_link(string $permalink, WP_Post $post, bool $leavename): string
{
    unset($post, $leavename);
    return promogames_core_frontend_url($permalink);
}
add_filter('post_link', 'promogames_core_post_link', 10, 3);

function promogames_core_page_link(string $permalink, int $post_id, bool $sample): string
{
    unset($post_id, $sample);
    return promogames_core_frontend_url($permalink);
}
add_filter('page_link', 'promogames_core_page_link', 10, 3);

function promogames_core_post_type_link(string $permalink, WP_Post $post, bool $leavename, bool $sample): string
{
    unset($leavename, $sample);
    return is_post_type_viewable($post->post_type) ? promogames_core_frontend_url($permalink) : $permalink;
}
add_filter('post_type_link', 'promogames_core_post_type_link', 10, 4);

function promogames_core_is_preserved_cms_path(string $path): bool
{
    $path = '/' . ltrim($path, '/');
    foreach (['/wp-admin', '/wp-login.php', '/wp-cron.php', '/wp-json', '/wp-content', '/wp-includes'] as $prefix) {
        if ($path === $prefix || str_starts_with($path, $prefix . '/')) {
            return true;
        }
    }

    return false;
}

function promogames_core_is_cms_sitemap_path(string $path): bool
{
    $filename = strtolower(basename($path));
    return str_contains($filename, 'sitemap')
        && (str_ends_with($filename, '.xml') || str_ends_with($filename, '.xml.gz'));
}

function promogames_core_serve_gone(string $message): void
{
    status_header(410);
    nocache_headers();
    header('Content-Type: text/plain; charset=' . get_option('blog_charset'));
    echo $message;
    exit;
}

/**
 * O WordPress é apenas CMS: mantém wp-admin, REST e mídia, mas nunca expõe o tema legado.
 */
function promogames_core_redirect_public_frontend(): void
{
    if (
        is_admin()
        || wp_doing_ajax()
        || wp_doing_cron()
        || (defined('REST_REQUEST') && REST_REQUEST)
        || (defined('WP_CLI') && WP_CLI)
    ) {
        return;
    }

    $request_uri = isset($_SERVER['REQUEST_URI']) ? (string) wp_unslash($_SERVER['REQUEST_URI']) : '/';
    $path = (string) wp_parse_url($request_uri, PHP_URL_PATH);
    $path = $path === '' ? '/' : '/' . ltrim($path, '/');

    if (
        promogames_core_is_preserved_cms_path($path)
        || $path === '/robots.txt'
        || isset($_GET['rest_route'])
    ) {
        return;
    }

    // Only posts have a Draft Mode route. Keep other authenticated previews native to the CMS.
    if (is_user_logged_in() && is_preview()) {
        $previewed_post = get_queried_object();
        if ($previewed_post instanceof WP_Post && $previewed_post->post_type !== 'post') {
            return;
        }
    }

    if (is_feed() || promogames_core_is_cms_sitemap_path($path)) {
        promogames_core_serve_gone('Este endpoint editorial foi desativado no CMS headless.');
    }

    if ($path === '/' && is_user_logged_in()) {
        wp_safe_redirect(admin_url(), 302, 'PromoGames Core');
        exit;
    }

    $frontend = promogames_core_config()['frontend'];
    if ($frontend === '') {
        return;
    }

    wp_redirect(promogames_core_frontend_url($request_uri), 301, 'PromoGames Core');
    exit;
}
add_action('template_redirect', 'promogames_core_redirect_public_frontend', 0);

function promogames_core_cms_robots(string $output, bool $public): string
{
    unset($output, $public);
    return "User-agent: *\nDisallow: /\n";
}
add_filter('robots_txt', 'promogames_core_cms_robots', PHP_INT_MAX, 2);
add_filter('wp_sitemaps_enabled', '__return_false');
add_filter('wpseo_enable_xml_sitemap', '__return_false');

function promogames_core_cms_noindex_headers(): void
{
    if (!headers_sent()) {
        header('X-Robots-Tag: noindex, nofollow, noarchive', true);
    }
}
add_action('send_headers', 'promogames_core_cms_noindex_headers');

function promogames_core_preview_link(string $preview_link, WP_Post $post): string
{
    if ($post->post_type !== 'post') {
        return promogames_core_cms_url($preview_link);
    }

    $config = promogames_core_config();
    if ($config['frontend'] === '' || $config['preview_secret'] === '') {
        return $preview_link;
    }
    return add_query_arg(['id' => $post->ID, 'secret' => $config['preview_secret']], $config['frontend'] . '/api/draft/');
}
add_filter('preview_post_link', 'promogames_core_preview_link', 10, 2);

function promogames_core_path_from_url(string $url): string
{
    $path = (string) wp_parse_url($url, PHP_URL_PATH);
    return $path === '' ? '/' : trailingslashit('/' . ltrim($path, '/'));
}

/** @param array<string, mixed> $payload */
function promogames_core_request_revalidation(array $payload): bool
{
    $config = promogames_core_config();
    if ($config['revalidate_url'] === '' || $config['revalidate_secret'] === '') {
        return false;
    }

    $body = wp_json_encode($payload);
    if (!is_string($body)) {
        promogames_core_record_revalidation_result(false, 'json_encode');
        return false;
    }

    $response = wp_remote_post($config['revalidate_url'], [
        'timeout' => 3,
        'blocking' => true,
        'redirection' => 0,
        'headers' => ['Content-Type' => 'application/json', 'X-PromoGames-Secret' => $config['revalidate_secret']],
        'body' => $body,
        'data_format' => 'body',
    ]);

    if (is_wp_error($response)) {
        promogames_core_record_revalidation_result(false, 'wp_error:' . sanitize_key($response->get_error_code()));
        return false;
    }

    $status = wp_remote_retrieve_response_code($response);
    if ($status < 200 || $status >= 300) {
        promogames_core_record_revalidation_result(false, 'http:' . $status);
        return false;
    }

    promogames_core_record_revalidation_result(true, 'http:' . $status);
    return true;
}

function promogames_core_record_revalidation_result(bool $success, string $result): void
{
    $safe_result = sanitize_text_field($result);
    update_option('promogames_core_last_revalidation', [
        'success' => $success,
        'result' => $safe_result,
        'timestamp' => time(),
    ], false);

    if (!$success) {
        error_log(sprintf('[PromoGames Core] Falha na revalidação (%s).', $safe_result));
    }
}

function promogames_core_send_revalidation(int $post_id, bool $comments_only = false, ?WP_Post $previous_post = null): void
{
    $post = get_post($post_id);
    if (!$post instanceof WP_Post || !in_array($post->post_type, ['post', 'page'], true) || wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }

    if (
        !$comments_only
        && !in_array($post->post_status, ['publish', 'trash'], true)
        && (!$previous_post instanceof WP_Post || $previous_post->post_status !== 'publish')
    ) {
        return;
    }

    $permalink = get_permalink($post);
    $paths = is_string($permalink) && $permalink !== '' ? [promogames_core_path_from_url($permalink)] : [];
    $tags = $comments_only
        ? ['comments', 'comments:' . $post_id]
        : ($post->post_type === 'page'
            ? ['wordpress', 'pages', 'page:' . $post->post_name]
            : ['wordpress', 'stories', 'home', 'story:' . $post->post_name]);

    if (
        !$comments_only
        && $previous_post instanceof WP_Post
        && $previous_post->post_type === $post->post_type
        && $previous_post->post_name !== ''
        && $previous_post->post_name !== $post->post_name
    ) {
        $previous_permalink = get_permalink($previous_post);
        if (is_string($previous_permalink) && $previous_permalink !== '') {
            $paths[] = promogames_core_path_from_url($previous_permalink);
        }
        $tags[] = ($post->post_type === 'page' ? 'page:' : 'story:') . $previous_post->post_name;
    }

    if (!$comments_only && $post->post_type === 'post') {
        $tags[] = 'categories';
        $tags[] = 'authors';
        foreach (get_the_category($post_id) as $category) {
            $category_link = get_category_link($category);
            if (!is_wp_error($category_link)) {
                $paths[] = promogames_core_path_from_url($category_link);
            }
        }
        $author = get_userdata((int) $post->post_author);
        if ($author instanceof WP_User) {
            $paths[] = promogames_core_path_from_url(get_author_posts_url($author->ID));
        }

        if ($previous_post instanceof WP_Post && $previous_post->post_author !== $post->post_author) {
            $paths[] = promogames_core_path_from_url(get_author_posts_url((int) $previous_post->post_author));
        }
    }

    promogames_core_request_revalidation([
        'id' => $post_id,
        'slug' => $post->post_name,
        'status' => $post->post_status,
        'post_type' => $post->post_type,
        'tags' => array_values(array_unique($tags)),
        'paths' => array_values(array_unique($paths)),
    ]);
}

function promogames_core_after_insert(int $post_id, WP_Post $post, bool $update, ?WP_Post $post_before): void
{
    unset($update);
    if (in_array($post->post_type, ['post', 'page'], true)) {
        promogames_core_send_revalidation($post_id, false, $post_before);
    }
}
add_action('wp_after_insert_post', 'promogames_core_after_insert', 10, 4);
add_action('before_delete_post', 'promogames_core_send_revalidation');

function promogames_core_revalidate_term(int $term_id, int $term_taxonomy_id, string $taxonomy): void
{
    unset($term_taxonomy_id);
    if (!in_array($taxonomy, ['category', 'post_tag'], true)) {
        return;
    }

    $paths = [];
    $term_link = get_term_link($term_id, $taxonomy);
    if (!is_wp_error($term_link)) {
        $paths[] = promogames_core_path_from_url($term_link);
    }

    $tags = ['wordpress', 'stories', 'home'];
    if ($taxonomy === 'category') {
        $tags[] = 'categories';
    }

    promogames_core_request_revalidation([
        'tags' => $tags,
        'paths' => $paths,
    ]);
}
add_action('edited_term', 'promogames_core_revalidate_term', 10, 3);

function promogames_core_revalidate_deleted_term(int $term_id, int $term_taxonomy_id, string $taxonomy): void
{
    unset($term_id, $term_taxonomy_id);
    if (!in_array($taxonomy, ['category', 'post_tag'], true)) {
        return;
    }

    $tags = ['wordpress', 'stories', 'home'];
    if ($taxonomy === 'category') {
        $tags[] = 'categories';
    }
    promogames_core_request_revalidation(['tags' => $tags, 'paths' => []]);
}
add_action('delete_term', 'promogames_core_revalidate_deleted_term', 10, 3);

function promogames_core_revalidate_author(int $user_id, WP_User $old_user_data): void
{
    $paths = [promogames_core_path_from_url(get_author_posts_url($user_id))];
    if ($old_user_data->user_nicename !== '') {
        $paths[] = promogames_core_path_from_url(get_author_posts_url($user_id, $old_user_data->user_nicename));
    }

    promogames_core_request_revalidation([
        'tags' => ['wordpress', 'stories', 'authors', 'home'],
        'paths' => array_values(array_unique($paths)),
    ]);
}
add_action('profile_update', 'promogames_core_revalidate_author', 10, 2);

function promogames_core_revalidate_deleted_author(int $user_id, ?int $reassigned_user_id, WP_User $deleted_user): void
{
    unset($reassigned_user_id);
    $paths = [];
    if ($deleted_user->user_nicename !== '') {
        $paths[] = promogames_core_path_from_url(get_author_posts_url($user_id, $deleted_user->user_nicename));
    }

    promogames_core_request_revalidation([
        'tags' => ['wordpress', 'stories', 'authors', 'home'],
        'paths' => $paths,
    ]);
}
add_action('deleted_user', 'promogames_core_revalidate_deleted_author', 10, 3);

function promogames_core_revalidate_new_comment(int $comment_id, string|int $approved, array $comment_data): void
{
    unset($comment_id);
    $post_id = isset($comment_data['comment_post_ID']) ? absint($comment_data['comment_post_ID']) : 0;
    if ($post_id > 0 && (string) $approved === '1') {
        promogames_core_send_revalidation($post_id, true);
    }
}
add_action('comment_post', 'promogames_core_revalidate_new_comment', 10, 3);

function promogames_core_revalidate_comment_status(string $new_status, string $old_status, WP_Comment $comment): void
{
    if ($new_status !== $old_status && ($new_status === 'approved' || $old_status === 'approved')) {
        promogames_core_send_revalidation((int) $comment->comment_post_ID, true);
    }
}
add_action('transition_comment_status', 'promogames_core_revalidate_comment_status', 10, 3);

function promogames_core_admin_notice(): void
{
    if (!current_user_can('manage_options')) {
        return;
    }
    $config = promogames_core_config();
    if ($config['frontend'] && $config['preview_secret'] && $config['revalidate_url'] && $config['revalidate_secret'] && $config['comments_secret']) {
        return;
    }
    echo '<div class="notice notice-warning"><p><strong>PromoGames Core:</strong> configure as constantes de integração no <code>wp-config.php</code> para habilitar preview e revalidação.</p></div>';
}
add_action('admin_notices', 'promogames_core_admin_notice');

/** @param array<string, mixed> $tests */
function promogames_core_register_site_health_test(array $tests): array
{
    $tests['direct']['promogames_core_configuration'] = [
        'label' => 'Integração headless do PromoGames Core',
        'test' => 'promogames_core_site_health_test',
    ];
    return $tests;
}
add_filter('site_status_tests', 'promogames_core_register_site_health_test');

/** @return array<string, mixed> */
function promogames_core_site_health_test(): array
{
    $config = promogames_core_config();
    $required = [
        'PROMOGAMES_FRONTEND_URL' => $config['frontend'],
        'PROMOGAMES_PREVIEW_SECRET' => $config['preview_secret'],
        'PROMOGAMES_REVALIDATE_URL' => $config['revalidate_url'],
        'PROMOGAMES_REVALIDATE_SECRET' => $config['revalidate_secret'],
        'PROMOGAMES_COMMENTS_SECRET' => $config['comments_secret'],
    ];
    $missing = array_keys(array_filter($required, static fn (string $value): bool => $value === ''));

    $status = 'good';
    $label = 'A integração headless está configurada';
    $description = 'Todas as constantes obrigatórias estão presentes. Nenhum valor secreto é exibido por este diagnóstico.';

    if ($missing !== []) {
        $status = 'critical';
        $label = 'A integração headless está incompleta';
        $description = 'Constantes ausentes: ' . implode(', ', $missing) . '. Os valores devem ser definidos somente no wp-config.php.';
    } else {
        $invalid_urls = [];
        foreach (['PROMOGAMES_FRONTEND_URL' => $config['frontend'], 'PROMOGAMES_REVALIDATE_URL' => $config['revalidate_url']] as $name => $url) {
            $scheme = wp_parse_url($url, PHP_URL_SCHEME);
            $host = wp_parse_url($url, PHP_URL_HOST);
            if (!is_string($scheme) || strtolower($scheme) !== 'https' || !is_string($host) || $host === '') {
                $invalid_urls[] = $name;
            }
        }

        $secrets = [$config['preview_secret'], $config['revalidate_secret'], $config['comments_secret']];
        $weak_or_reused = count(array_unique($secrets)) !== count($secrets)
            || array_filter($secrets, static fn (string $secret): bool => strlen($secret) < 32) !== [];

        if ($invalid_urls !== []) {
            $status = 'critical';
            $label = 'Os destinos da integração são inválidos';
            $description = 'Revise HTTPS e host em: ' . implode(', ', $invalid_urls) . '. Os endereços configurados não são exibidos.';
        } elseif ($weak_or_reused) {
            $status = 'recommended';
            $label = 'Os segredos da integração precisam ser reforçados';
            $description = 'Use três valores diferentes, aleatórios e com pelo menos 32 caracteres. Nenhum valor ou tamanho exato é exibido.';
        } else {
            $last_result = get_option('promogames_core_last_revalidation');
            if (is_array($last_result) && isset($last_result['success'], $last_result['result'], $last_result['timestamp'])) {
                $last_time = wp_date('d/m/Y H:i:s', absint($last_result['timestamp']));
                if ($last_result['success'] !== true) {
                    $status = 'recommended';
                    $label = 'A última revalidação do frontend falhou';
                    $description = sprintf(
                        'Resultado técnico seguro: %s, em %s. Consulte os logs do frontend e confirme o par de segredos.',
                        sanitize_text_field((string) $last_result['result']),
                        $last_time
                    );
                } else {
                    $description .= sprintf(' Última entrega confirmada em %s.', $last_time);
                }
            }
        }
    }

    return [
        'label' => $label,
        'status' => $status,
        'badge' => ['label' => 'PromoGames Core', 'color' => 'blue'],
        'description' => '<p>' . esc_html($description) . '</p>',
        'actions' => '',
        'test' => 'promogames_core_configuration',
    ];
}
