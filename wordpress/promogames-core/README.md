# PromoGames Core 1.3

Plugin editorial para WordPress headless. Apesar do nome histórico e do namespace `promogames/v1`, a versão 1.3 também é o adaptador usado pelo piloto JoystickNights. O frontend público fica no Next.js; WordPress permanece responsável por redação, revisão, usuários, mídia, comentários e metadados editoriais.

O código exige WordPress 6.5 ou posterior, PHP 8.1 ou posterior, HTTPS e permalinks habilitados. Ele não apaga o tema legado e não substitui a interface do plugin de SEO, consentimento, analytics, anúncios, formulários ou cache do frontend.

## O que a versão 1.3 entrega

- seis metacampos editoriais de posts expostos no REST;
- curadoria pública em `GET /wp-json/promogames/v1/home?per_page=4`;
- campo REST somente leitura `promogames_seo` em posts e páginas, normalizado a partir de The SEO Framework, SEOPress, Yoast SEO ou Rank Math;
- criação de comentários por `POST /wp-json/promogames/v1/comments`, protegida por segredo servidor-a-servidor;
- preview de rascunhos no Draft Mode do frontend;
- webhook assinado ao publicar, editar, enviar à lixeira ou excluir posts e páginas;
- revalidação depois da criação de comentário e da mudança de seu status;
- links públicos de posts, páginas e tipos públicos apontando para o frontend, inclusive **Ver post** no painel;
- redirecionamento permanente do tema público legado para a rota equivalente do frontend, sem bloquear painel, login, cron, REST ou mídia;
- CMS protegido contra indexação, com `X-Robots-Tag`, `robots.txt` restritivo e feeds/sitemaps públicos desativados;
- diagnóstico em **Ferramentas → Saúde do site**, incluindo o último resultado do webhook sem revelar URLs ou segredos;
- nome editorial configurável por `PROMOGAMES_SITE_NAME`.

Os metacampos editoriais são:

- `promogames_deck`;
- `promogames_editorial_type` (`noticia`, `analise`, `guia` ou `promocao`);
- `promogames_platforms` (`playstation`, `xbox`, `nintendo`, `pc`, `mobile` ou `vr`);
- `promogames_review_score` (0 a 10);
- `promogames_featured`;
- `promogames_featured_order` (0 a 99).

O objeto `promogames_seo` pode conter `title`, `description`, `canonical` e `social_image`. Campos vazios são omitidos. O adaptador consulta os metadados compatíveis de The SEO Framework (`_genesis_*` e imagem social), SEOPress (`_seopress_*`), Yoast SEO (`_yoast_wpseo_*`) e Rank Math (`rank_math_*`). Imagens sociais salvas como URL ou ID de anexo são aceitas. O frontend já solicita o campo, mapeia seu valor e substitui canonical interno do host `cms` pela rota pública correspondente.

Quando usar `_fields` no REST, o consumidor precisa solicitar `promogames_seo` explicitamente; caso contrário, o WordPress o remove da resposta.

## Instalação no JoystickNights

1. Faça snapshot do banco e de `wp-content`. Não use a única cópia disponível como área de trabalho.
2. Copie esta pasta para `wp-content/plugins/promogames-core` na origem WordPress.
3. Ative **PromoGames Core** pelo painel ou, dentro da instalação WordPress, execute:

```bash
wp plugin activate promogames-core
wp plugin status promogames-core
```

4. Confirme que `https://cms.joysticknights.com.br/wp-json/` responde e que o servidor encaminha o header `Authorization` ao PHP.
5. Crie um usuário técnico dedicado, sem papel de administrador, capaz de ler os rascunhos que serão visualizados. Gere uma Application Password exclusiva para o frontend.
6. Armazene o login e a Application Password somente no gerenciador de segredos do provedor, como `WORDPRESS_USERNAME` e `WORDPRESS_APPLICATION_PASSWORD`.
7. Adicione as constantes abaixo ao `wp-config.php`, antes de `/* That's all, stop editing! */`.

Durante o beta:

```php
define('PROMOGAMES_SITE_NAME', 'JoystickNights');
define('PROMOGAMES_FRONTEND_URL', 'https://beta.joysticknights.com.br');
define('PROMOGAMES_PREVIEW_SECRET', 'valor-do-DRAFT_MODE_SECRET-no-provedor');
define('PROMOGAMES_REVALIDATE_URL', 'https://beta.joysticknights.com.br/api/revalidate/');
define('PROMOGAMES_REVALIDATE_SECRET', 'valor-do-REVALIDATE_SECRET-no-provedor');
define('PROMOGAMES_COMMENTS_SECRET', 'valor-do-WORDPRESS_COMMENTS_SECRET-no-provedor');
```

No cutover, altere apenas os destinos para o domínio público:

```php
define('PROMOGAMES_SITE_NAME', 'JoystickNights');
define('PROMOGAMES_FRONTEND_URL', 'https://joysticknights.com.br');
define('PROMOGAMES_PREVIEW_SECRET', 'valor-do-DRAFT_MODE_SECRET-no-provedor');
define('PROMOGAMES_REVALIDATE_URL', 'https://joysticknights.com.br/api/revalidate/');
define('PROMOGAMES_REVALIDATE_SECRET', 'valor-do-REVALIDATE_SECRET-no-provedor');
define('PROMOGAMES_COMMENTS_SECRET', 'valor-do-WORDPRESS_COMMENTS_SECRET-no-provedor');
```

Os textos acima são placeholders, não valores para reutilizar. Os pares precisam coincidir exatamente:

- `PROMOGAMES_PREVIEW_SECRET` ↔ `DRAFT_MODE_SECRET`;
- `PROMOGAMES_REVALIDATE_SECRET` ↔ `REVALIDATE_SECRET`;
- `PROMOGAMES_COMMENTS_SECRET` ↔ `WORDPRESS_COMMENTS_SECRET`.

Use três valores longos, aleatórios e diferentes. Nunca versione, fotografe ou cole os valores reais em logs, tickets ou chats.

Com `PROMOGAMES_FRONTEND_URL` definido, `get_permalink()` e os links **Ver post/Ver página** preservam caminho e query string, mas usam o domínio público. Requisições públicas ao domínio `cms` recebem `301` para a mesma rota no frontend. As exceções são:

- `/wp-admin/*`, `/wp-login.php`, AJAX, cron, REST e WP-CLI;
- `/wp-content/*` e `/wp-includes/*`, necessários para mídia e recursos do painel;
- preview autenticado de páginas, mantido temporariamente no tema legado;
- `/robots.txt`, que responde com rastreamento dos redirects permitido, sem sitemap próprio;
- feeds e sitemaps do CMS, que respondem `410 Gone` para evitar conteúdo duplicado.

Ao abrir somente a raiz do CMS enquanto autenticado, o plugin envia o usuário ao painel. Toda resposta dinâmica do WordPress inclui `X-Robots-Tag: noindex, nofollow, noarchive`.

No frontend JoystickNights, o conjunto mínimo é:

```dotenv
NEXT_PUBLIC_SITE_PROFILE=joysticknights
NEXT_PUBLIC_SITE_URL=https://beta.joysticknights.com.br
NEXT_PUBLIC_INDEXING_ENABLED=false
WORDPRESS_API_URL=https://cms.joysticknights.com.br/wp-json/wp/v2
WORDPRESS_USERNAME=<usuario-tecnico>
WORDPRESS_APPLICATION_PASSWORD=<segredo-do-provedor>
WORDPRESS_COMMENTS_SECRET=<segredo-exclusivo-de-comentarios>
DRAFT_MODE_SECRET=<segredo-do-provedor>
REVALIDATE_SECRET=<outro-segredo-do-provedor>
```

Mantenha `NEXT_PUBLIC_INDEXING_ENABLED=false` em todo deployment de beta ou preview. No corte, publique uma nova build com `NEXT_PUBLIC_SITE_URL=https://joysticknights.com.br` e só então altere `NEXT_PUBLIC_INDEXING_ENABLED=true`.

`WORDPRESS_API_URL` precisa terminar em `/wp-json/wp/v2`. Quando sua origem é diferente de `NEXT_PUBLIC_SITE_URL`, o Next deriva `https://cms.joysticknights.com.br` dessa variável e configura automaticamente:

- rewrite de `/wp-content/*`, `/wp-includes/*` e `/wp-json/*` para o CMS;
- redirect temporário de `/wp-admin`, `/wp-admin/*` e `/wp-login.php` para o CMS;
- hosts de mídia e políticas de conexão necessários ao origin.

Como essas regras são geradas por `next.config.ts`, qualquer alteração da origem exige uma nova build/deploy.

## Preview

Ao clicar em **Visualizar** no editor, o filtro `preview_post_link` abre:

```text
https://frontend/api/draft/?id=<post-id>&secret=<segredo>
```

O frontend valida o segredo, usa a Application Password no servidor para buscar `/wp-json/wp/v2/posts/<id>?context=edit` e ativa o Draft Mode. A Application Password nunca pode ser enviada ao navegador.

Na versão 1.3, o Draft Mode externo cobre apenas posts. Páginas continuam usando preview nativo, restrito a usuário autenticado no CMS, até existir uma rota de preview de páginas no frontend. Assim, o link de preview de página não é enviado para uma tela inexistente no Next.js.

Teste o preview clicando pelo painel; não monte manualmente uma URL com segredo em terminal, histórico do navegador compartilhado ou documentação. Se o WordPress retornar 401:

- confirme usuário e Application Password no provedor;
- confirme o encaminhamento de `Authorization` no servidor;
- verifique se algum plugin de hospedagem desabilitou Application Passwords;
- gere uma credencial nova em vez de reutilizar uma potencialmente exposta.

No backup atual do JoystickNights não foi detectado bloqueio ativo. No PromoGames, o Hostinger Tools estava configurado para desabilitar Application Passwords; esse toggle precisa ser desligado antes da futura replicação.

## Revalidação

O plugin envia `POST` assinado para `PROMOGAMES_REVALIDATE_URL`. O segredo vai no header `X-PromoGames-Secret`; o corpo contém ID, slug, status, tipo, tags e caminhos afetados.

- Posts invalidam `wordpress`, `stories`, `story:<slug>`, `home`, categorias e autores.
- Páginas invalidam `pages`, `page:<slug>` e o caminho da página.
- Comentários aprovados ou cuja aprovação mudou revalidam somente a matéria relacionada e suas tags de comentários; pendentes e spam invisíveis não limpam o cache público.
- Mudanças de slug também invalidam a rota anterior; edições de categorias, tags e perfis de autor limpam os caches editoriais relacionados.
- O frontend mantém revalidação temporal de cinco minutos como fallback.

O webhook envia uma requisição bloqueante com timeout curto de três segundos e não segue redirects. `WP_Error` e qualquer resposta fora de `2xx` são registrados sem corpo, URL ou segredo. O resultado seguro mais recente aparece em **Saúde do site**. Assim, o WordPress confirma a entrega sem deixar o editor preso indefinidamente; falhas continuam cobertas pela revalidação temporal do frontend.

Para testar sem colocar segredo no comando, injete-o por uma variável de ambiente temporária do terminal:

```powershell
$headers = @{ 'X-PromoGames-Secret' = $env:JOYSTICK_REVALIDATE_SECRET }
$body = @{ slug = 'post-de-teste'; tags = @('stories'); paths = @('/') } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'https://beta.joysticknights.com.br/api/revalidate/' -Headers $headers -ContentType 'application/json' -Body $body
```

Depois, publique ou edite uma matéria no WordPress e confirme nos logs do frontend que o webhook real também chegou. Não considere um teste manual suficiente.

## Paridade de SEO, páginas e comentários

### SEO

O plugin de SEO instalado continua sendo a interface editorial. `promogames_seo` transporta os principais campos de The SEO Framework, SEOPress, Yoast SEO ou Rank Math no mesmo contrato. O cliente solicita o campo em `_fields`, os mappers o incorporam em posts e páginas e o gerador de metadata aplica title, description, canonical e imagem social. O Next.js continua responsável por Open Graph, JSON-LD, sitemap e robots; a saída de `wp_head` não é executada no headless.

Antes do corte, verifique uma matéria com SEO customizado, outra sem customização e uma página. Nenhuma delas pode publicar canonical para `cms.joysticknights.com.br` ou `beta.joysticknights.com.br` em produção.

### Páginas

Páginas são consultadas pelo endpoint nativo `/wp-json/wp/v2/pages` e entram na revalidação da versão 1.3. Elementor permanece ativo para edição e rollback de páginas legadas, mas o frontend externo não recebe automaticamente CSS, widgets ou scripts Elementor. Cada página necessária precisa de rota equivalente, renderização compatível ou redirect explícito.

### Comentários

Leitura e moderação permanecem no endpoint nativo `/wp-json/wp/v2/comments`. A criação usa um fluxo separado e assinado:

1. O navegador envia o formulário somente para `/api/comments/` no próprio frontend.
2. O Next valida mesma origem, `Content-Type`, tamanho, honeypot, campos e rate limit.
3. O servidor Next envia `POST` a `/wp-json/promogames/v1/comments` com `X-PromoGames-Comments-Secret: <WORDPRESS_COMMENTS_SECRET>`.
4. O plugin compara o header com `PROMOGAMES_COMMENTS_SECRET` usando `hash_equals`, recusa segredo vazio ou excessivamente longo e nunca libera o endpoint nativo anônimo.
5. O plugin aceita apenas post publicado, sem senha e com comentários abertos; valida nome, e-mail e conteúdo e chama `wp_new_comment`, preservando moderação, antispam e detecção de duplicidade do WordPress.
6. O frontend responde `201` para aprovado ou `202` para pendente e revalida a lista quando necessário.

A Application Password de preview não participa desse fluxo e nunca é enviada ao navegador. Teste segredo ausente/incorreto, comentário aprovado, pendente, duplicado e matéria fechada. Desativar comentários no WordPress também deve fechar o formulário no frontend.

## Validação rápida

As chamadas abaixo não usam credenciais:

```powershell
Invoke-RestMethod -Uri 'https://cms.joysticknights.com.br/wp-json/' | Select-Object -ExpandProperty name
Invoke-RestMethod -Uri 'https://cms.joysticknights.com.br/wp-json/wp/v2/posts?per_page=1&_fields=id,slug,promogames_seo'
Invoke-RestMethod -Uri 'https://cms.joysticknights.com.br/wp-json/wp/v2/pages?per_page=1&_fields=id,slug,promogames_seo'
Invoke-RestMethod -Uri 'https://cms.joysticknights.com.br/wp-json/promogames/v1/home?per_page=4'
```

Dentro de `web`, valide a aplicação:

```powershell
npm ci
npm run check
npm run test:e2e
npm run audit:wordpress
npm run verify:production -- https://beta.joysticknights.com.br
```

## Rollback seguro

Desativar o plugin é reversível:

```bash
wp plugin deactivate promogames-core
```

Isso restaura o link de preview nativo e interrompe novos webhooks. Os metacampos já gravados permanecem no banco e não precisam ser apagados. Se apenas a integração falhar, desative o plugin, mantenha WordPress e conteúdo intactos e deixe o frontend operar com revalidação temporal.

No rollback completo, roteie o domínio público de volta ao frontend WordPress que usa o mesmo banco atual. Não restaure um dump antigo sobre conteúdo publicado depois do corte. Só remova as constantes de integração depois que o plugin estiver inativo e o rollback validado.

O runbook completo do piloto está em [`docs/joysticknights-headless.md`](../../docs/joysticknights-headless.md).

## Replicação posterior no PromoGames

Não reutilize credenciais ou segredos do JoystickNights. Gere backup fresco, um novo usuário técnico e três novos segredos, incluindo o par exclusivo de comentários. O perfil público passa a `promogames`, os hosts passam a `cms.promogamesbr.com` e ao staging escolhido, e `PROMOGAMES_SITE_NAME` volta a `PromoGames`.

O adaptador SEO 1.3 normaliza The SEO Framework, SEOPress, Yoast SEO e Rank Math no mesmo campo `promogames_seo`. A replicação ainda exige QA com valores reais do plugin escolhido e tratamento separado dos campos ACF de autor; não presuma paridade apenas porque o plugin foi aprovado no JoystickNights.


## Review e filtros (1.3)

A ficha editorial inclui jogo, desenvolvedora, publisher, lançamento, plataforma analisada, transparência, veredito, prós e contras (um por linha). Campos vazios não geram fatos ou notas. `promogames_review_rating` distingue nota zero de ausência de nota.

`GET /wp-json/promogames/v1/capabilities` anuncia suporte aos filtros `platform` e `editorial_type` de `/posts`; filtros são aplicados antes da paginação. Ao acessar o admin, lotes de 100 posts recebem apenas metadados ausentes de tipo/plataforma, derivados das categorias existentes. Notas, textos e metadados já preenchidos são preservados.

No host `cms.joysticknights.com.br`, os destinos padrão preservam a migração para o frontend público. As constantes do `wp-config.php` têm prioridade; nenhum segredo é armazenado no código do plugin.
