<?php
/**
 * Plugin Name: PromoGames Core
 * Description: Integração editorial headless: metacampos, SEO, curadoria, preview e revalidação.
 * Version: 1.1.0
 * Author: PromoGames
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Text Domain: promogames-core
 */

if (!defined('ABSPATH')) {
    exit;
}

const PROMOGAMES_CORE_VERSION = '1.1.0';

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

    // The SEO Framework is active on JoystickNights; SEOPress is active on PromoGames.
    // Normalize both so the frontend contract remains stable when the same stack is replicated.
    $title = promogames_core_first_meta($post_id, ['_genesis_title', '_seopress_titles_title']);
    $description = promogames_core_first_meta($post_id, ['_genesis_description', '_seopress_titles_desc']);
    $canonical = promogames_core_first_meta($post_id, ['_genesis_canonical_uri', '_seopress_robots_canonical']);
    $social_image = promogames_core_first_meta($post_id, [
        '_social_image_url',
        '_seopress_social_fb_img',
        '_seopress_social_twitter_img',
    ]);
    if ($social_image === '') {
        $social_image_id = absint(get_post_meta($post_id, '_social_image_id', true));
        $social_image = $social_image_id > 0 ? (string) wp_get_attachment_image_url($social_image_id, 'full') : '';
    }

    return array_filter([
        'title' => sanitize_text_field($title),
        'description' => sanitize_textarea_field($description),
        'canonical' => esc_url_raw($canonical),
        'social_image' => esc_url_raw($social_image),
    ], static fn (string $value): bool => $value !== '');
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

function promogames_core_preview_link(string $preview_link, WP_Post $post): string
{
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

function promogames_core_send_revalidation(int $post_id, bool $comments_only = false): void
{
    $post = get_post($post_id);
    if (!$post instanceof WP_Post || !in_array($post->post_type, ['post', 'page'], true) || wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }
    $config = promogames_core_config();
    if ($config['revalidate_url'] === '' || $config['revalidate_secret'] === '') {
        return;
    }

    $paths = [promogames_core_path_from_url(get_permalink($post))];
    $tags = $comments_only
        ? ['comments', 'comments:' . $post_id]
        : ($post->post_type === 'page' ? ['pages', 'page:' . $post->post_name] : ['stories', 'story:' . $post->post_name]);

    if (!$comments_only && $post->post_type === 'post') {
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
    }

    wp_remote_post($config['revalidate_url'], [
        'timeout' => 3,
        'blocking' => true,
        'headers' => ['Content-Type' => 'application/json', 'X-PromoGames-Secret' => $config['revalidate_secret']],
        'body' => wp_json_encode([
            'id' => $post_id,
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'post_type' => $post->post_type,
            'tags' => $tags,
            'paths' => array_values(array_unique($paths)),
        ]),
        'data_format' => 'body',
    ]);
}

function promogames_core_after_insert(int $post_id, WP_Post $post, bool $update, ?WP_Post $post_before): void
{
    unset($update, $post_before);
    if (in_array($post->post_type, ['post', 'page'], true)) {
        promogames_core_send_revalidation($post_id);
    }
}
add_action('wp_after_insert_post', 'promogames_core_after_insert', 10, 4);
add_action('trashed_post', 'promogames_core_send_revalidation');
add_action('untrashed_post', 'promogames_core_send_revalidation');
add_action('before_delete_post', 'promogames_core_send_revalidation');

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
