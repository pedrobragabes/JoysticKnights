<?php
// Small isolated contract checks; no database, network or production mutations.
define('ABSPATH', __DIR__);
function add_action(...$args): void {}
function add_filter(...$args): void {}
function sanitize_key(string $value): string { return preg_replace('/[^a-z0-9_\-]/', '', strtolower($value)); }
function home_url(): string { return 'https://cms.joysticknights.com.br'; }
function wp_parse_url(string $url, int $component): mixed { return parse_url($url, $component); }
require __DIR__ . '/promogames-core.php';
function check(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
check(count(promogames_core_review_fields()) === 9, 'Review fields incomplete');
check(promogames_core_sanitize_score(-1) === 0.0, 'Negative score');
check(promogames_core_sanitize_score(11) === 10.0, 'Score above ten');
check(promogames_core_sanitize_platforms(['pc', 'pc', 'unknown']) === ['pc'], 'Platform validation');
foreach (['/wp-admin/', '/wp-json/wp/v2/posts', '/wp-content/uploads/image.jpg', '/wp-login.php'] as $path) {
    check(promogames_core_is_preserved_cms_path($path), 'Required CMS path blocked: ' . $path);
}
check(!promogames_core_is_preserved_cms_path('/wp-admin-fake/'), 'Prefix bypass');
check(promogames_core_is_cms_sitemap_path('/post-sitemap.xml'), 'SEO sitemap not disabled');
check(promogames_core_frontend_url('/noticias/example/?page=2') === 'https://joysticknights.com.br/noticias/example/?page=2', 'Frontend URL mapping');
check(promogames_core_config()['revalidate_url'] === 'https://joysticknights.com.br/api/revalidate', 'Cutover URL not preserved');
echo "WordPress contract checks passed.\n";
