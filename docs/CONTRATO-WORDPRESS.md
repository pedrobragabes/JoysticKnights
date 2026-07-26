# Contrato de conteúdo WordPress

**Origem auditada:** `https://promogamesbr.com/wp-json/wp/v2`

**Snapshot:** 15 de julho de 2026

## Resumo

- 508 posts públicos distribuídos em 43 páginas de 12 itens no momento da auditoria.
- Artigos recentes usam HTML semântico do Gutenberg (`wp-block-*`).
- Autor, mídia destacada e termos podem ser incorporados com `_embed`.
- Para `_embed` continuar funcionando junto de `_fields`, a consulta deve incluir `_links` e `_embedded`.
- A home atual é Elementor Canvas, mas não faz parte do contrato de dados do novo front.

O contrato pode ser verificado a qualquer momento com:

```bash
cd web
npm run audit:wordpress
```

## Endpoints consumidos

| Recurso | Endpoint | Uso |
|---|---|---|
| Matérias | `/posts` | home, busca, categorias, autores e relacionados |
| Categorias | `/categories` | navegação e arquivos editoriais |
| Autores | `/users` | autoria e páginas de autor |
| Mídia | incorporada em `/posts?_embed=wp:featuredmedia` | capas e dimensões |

## Regras de URL

- O slug do WordPress é a fonte de verdade.
- Matérias continuam em `/{slug}/`.
- Categorias públicas usam `/categoria/{slug}/` no novo front.
- Autores usam `/autor/{slug}/`.
- O Next.js está configurado com `trailingSlash: true`.
- Qualquer mudança futura de slug exige redirect 301 explícito.

## Campos mínimos de uma matéria

```text
id, date, modified, slug, link, title, excerpt, content,
author, featured_media, categories, tags, meta, _links, _embedded
```

A interface nunca consome o formato REST cru diretamente. `src/lib/wordpress/mappers.ts` converte a resposta para os tipos internos `Story`, `WordPressAuthor`, `WordPressImage` e `WordPressTerm`.

## Cache e indisponibilidade

- Revalidação temporal padrão: cinco minutos.
- Tags de cache: `wordpress`, `stories`, `story:{slug}`, `categories` e `authors`.
- A home possui uma coleção mínima de fallback para não ficar vazia se a origem falhar.
- Arquivos específicos retornam estados vazios controlados quando o WordPress estiver indisponível.
- O PromoGames Core dispara webhook assinado para `/api/revalidate/`; o Next invalida tags e rotas imediatamente.
- A revalidação temporal de cinco minutos permanece como fallback se o webhook falhar.

## Conteúdo Gutenberg

O corpo é recebido em `content.rendered`. Na apresentação:

- imagens devem ser fluidas e preservar proporção;
- embeds precisam de wrappers responsivos;
- tabelas podem rolar horizontalmente em telas estreitas;
- scripts não são executados pelo front;
- blocos especiais do PromoGames serão registrados pelo plugin PromoGames Core.

## Extensão do PromoGames Core

Os seguintes metacampos serão expostos no REST:

- `promogames_deck`;
- `promogames_editorial_type`;
- `promogames_platforms`;
- `promogames_review_score`;
- `promogames_featured`;
- `promogames_featured_order`.

Todos são opcionais; o front continua funcionando antes da instalação do plugin. A curadoria fica disponível em `/wp-json/promogames/v1/home` e o código instalável está em `wordpress/promogames-core/`.
