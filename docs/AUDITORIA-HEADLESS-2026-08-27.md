# Auditoria headless — JoystickNights

**Data:** 27 de agosto de 2026  
**Branch auditada:** `agent/repository-hardening`  
**Produção:** `https://joysticknights.com.br`  
**CMS:** `https://cms.joysticknights.com.br`

## Resumo executivo

A migração headless está funcional e o frontend Next.js já cobre publicação, arquivos, busca, páginas institucionais, preview, revalidação, comentários, consentimento, SEO técnico e fallback parcial. O bloqueador de lançamento não é uma reescrita do frontend: é concluir a implantação do adaptador WordPress 1.2 que já está neste repositório.

Em produção, o CMS ainda publica o tema legado em HTTP 200, usa canonical para o próprio host e anuncia sitemap próprio. O Google já descobriu esse conteúdo. A cópia local do PromoGames Core 1.2 contém redirects, `X-Robots-Tag`, `Disallow: /` e desativação de feeds/sitemaps, mas esse comportamento não está ativo no CMS observado.

A home também terminava após oito itens em “Acabou de sair”. O código buscava somente 24 matérias e as dividia em 8 do hero, 8 destaques e 8 do feed, sem uma consulta paginada. A correção desta rodada separa a seleção editorial do feed cronológico, exclui IDs já exibidos e adiciona paginação navegável.

## Arquitetura atual

| Camada | Implementação | Responsabilidade |
|---|---|---|
| Frontend | Next.js 16.3 App Router, React 19, TypeScript, Tailwind 4 | UI pública, metadata, sitemap, robots, JSON-LD, busca, arquivos e artigos |
| CMS | WordPress em `cms.joysticknights.com.br` | edição, usuários, taxonomias, mídia, comentários e REST |
| Adaptador | `wordpress/promogames-core` 1.2 | metacampos, SEO normalizado, curadoria, preview, comentários e webhooks |
| Dados | REST `/wp-json/wp/v2` com `_embed` | posts, páginas, autores, categorias, tags, mídia e comentários |
| Cache | `fetch` com revalidação de 300 s e tags | fallback temporal e invalidação por webhook |
| Deploy | Hostinger Node.js 22 + GitHub Actions | build, testes, plugin PHP, secret scan e uptime |

Rotas públicas aceitam o permalink legado do WordPress: raiz, `/{categoria}/{slug}/` e `/{pai}/{categoria}/{slug}/`. Categorias, tags e autores têm arquivos paginados. O mapper converte links absolutos do WordPress em caminhos locais; o gerador de metadata rejeita canonicals internos que apontem para uma rota diferente.

## Estado por requisito

| Área | Estado | Evidência / lacuna |
|---|---|---|
| CMS headless | Implementado no plugin local; não implantado em produção | CMS público ainda retorna tema, canonical próprio e sitemap |
| Canonical Next | Implementado | metadata de matérias/páginas normaliza host interno para a rota pública |
| Robots e sitemap Next | Implementado | rotas nativas do App Router; busca e preview ficam fora da indexação |
| Redirects legados | Parcial | aliases conhecidos e permalinks existentes funcionam; falta inventário de slugs removidos/alterados |
| `www` e HTTPS | Parcial | HTTP redireciona para HTTPS; `www` retorna 200 com canonical em vez de 301/308 |
| Home cronológica | Corrigido nesta rodada | seleção e feed agora usam consultas separadas e IDs excluídos |
| Paginação da home | Corrigido nesta rodada | `/?page=N`, canonical por página e 404 fora do intervalo |
| Paginação de arquivos | Implementado | categorias, tags, autores e busca usam links navegáveis |
| Plataformas | Melhorado nesta rodada | cards compactos mantidos; ícones passam a participar da identidade visual |
| Busca | Parcialmente melhorado | input, ícone, limites, instrução, empty state e skeleton; falta telemetria de erro dedicada |
| Artigo editorial | Implementado em boa base | hero, autoria, datas, leitura, TOC, compartilhamento, sanitização, relacionados e comentários |
| Review | Parcial | tipo, plataformas e nota existem; ficha técnica, positivos, negativos e veredito ainda não têm contrato |
| HTML WordPress | Implementado | sanitização, headings, imagens, captions, embeds, tabelas, links e galeria |
| Comentários | Parcial e desativável | fluxo assinado, honeypot, validação, limite em memória e moderação WP; falta rate limit distribuído/antispam operacional |
| Performance | Parcial | `next/image`, fontes, Server Components e cache existem; build ainda pressiona o CMS |
| CI | Funcional | lint, tipos, 40 testes e build passam; E2E e PHP estão no workflow |
| Estados 404/erro | Implementado | páginas próprias e `noindex`; falta inventário contínuo de 4xx do Search Console |

## Bugs e riscos reproduzidos

### P0 — CMS público concorre com o Next

- `GET https://cms.joysticknights.com.br/` retorna 200 com o tema legado.
- canonical observado: `https://cms.joysticknights.com.br/`.
- meta robots observado permite snippets/imagens e não declara `noindex`.
- `robots.txt` permite o site fora de `/wp-admin` e anuncia sitemap no host do CMS.
- páginas do CMS já aparecem em resultados de busca.

**Correção disponível:** implantar `wordpress/promogames-core` 1.2 e configurar `PROMOGAMES_FRONTEND_URL`. Depois, validar raiz/post/categoria como 301, sitemap/feed como 410, robots como `Disallow: /` e REST/admin/mídia como preservados.

### P0 — build verde apesar de 500 do WordPress

`npm run check` terminou com sucesso, mas a geração estática registrou vários HTTP 500 em `/posts` e `/comments`. Os `catch` retornam fallback ou listas vazias, portanto o build pode concluir com páginas incompletas.

**Mitigação desta rodada:** reduzir a concorrência da geração estática e habilitar retry. **Pendência:** distinguir indisponibilidade transitória de “conteúdo não existe” e adicionar um gate pós-build que falhe quando rotas canônicas críticas forem geradas com fallback.

### P1 — feed da home era finito e não paginado

`getHomepageStories(24)` era fatiado em 8 + 8 + 8. Não existia consulta para posts seguintes nem links de página. Corrigido com feed separado de 12 itens, exclusão dos 16 itens editoriais e `/?page=N`.

### P1 — curadoria e cronologia estavam misturadas

Posts marcados como destaque eram inseridos antes da lista recente. Isso é adequado para hero, mas não para um bloco chamado “Acabou de sair”. O feed agora consulta diretamente `/posts`, cuja ordem padrão é data decrescente, e remove somente os IDs já exibidos.

### P2 — host `www` não redireciona

`https://www.joysticknights.com.br/` retorna 200. O canonical reduz duplicidade, mas a política solicitada é ter um único host navegável. Configurar redirect permanente na Hostinger/edge; evitar Proxy apenas para compensar uma regra de domínio que o provedor pode executar antes do Node.

### P2 — contrato de review incompleto

O REST expõe `editorialType`, `platforms` e `reviewScore`. Não há campos para jogo, desenvolvedora, publisher, lançamento, plataforma analisada, positivos, negativos e veredito. O template atual é sempre `NewsArticle`.

### P3 — antispam e rate limit não são distribuídos

O endpoint do Next tem validação e proteção servidor-a-servidor, mas o rate limit em memória não é compartilhado entre instâncias e reinicia com o processo. A decisão recomendada é manter comentários em moderação prévia até existir armazenamento compartilhado e uma camada antispam validada.

## Milestones e issues

### M0 — fechar a superfície pública do CMS (P0)

- **JK-001:** implantar PromoGames Core 1.2 no CMS e configurar as cinco constantes; aceite: Saúde do Site sem itens críticos.
- **JK-002:** validar matriz de URLs do CMS; aceite: admin/REST/uploads 200, conteúdo público 301, feed/sitemap 410, robots restritivo e `X-Robots-Tag` presente.
- **JK-003:** remover/desativar sitemap do plugin SEO no CMS e reenviar somente o sitemap Next ao Search Console.
- **JK-004:** exportar URLs 4xx/canonical divergente do Search Console e criar mapa versionado de redirects/tombstones.
- **JK-005:** configurar `www` → apex em 301/308 no edge e validar HTTP → HTTPS.

### M1 — experiência editorial (P1)

- **JK-101:** feed cronológico paginado sem duplicatas — implementado nesta rodada.
- **JK-102:** adicionar testes E2E para página 2 e ausência de IDs duplicados — implementado nesta rodada; 404 fora do intervalo permanece como cenário adicional.
- **JK-103:** criar contrato Review v1 com campos estruturados e migração opcional dos nove reviews existentes.
- **JK-104:** criar `ReviewArticle`, `Review` JSON-LD, nota, prós/contras, veredito e ficha técnica, reutilizando corpo/autoria/relacionados.
- **JK-105:** definir navegação artigo anterior/próximo sem aumentar excessivamente chamadas ao CMS.

### M2 — qualidade, UX e desempenho (P2)

- **JK-201:** concluir busca com erro de origem distinguível de zero resultados e teste para 1/100/101 caracteres.
- **JK-202:** registrar Lighthouse mobile/desktop e orçamento para LCP, CLS e INP.
- **JK-203:** reduzir fan-out de artigo (detalhe + relacionados + comentários) durante build e criar gate pós-build.
- **JK-204:** testar breakpoints 360, 390, 768, 1024 e 1440 px com screenshots de regressão.
- **JK-205:** auditar imagens internas que ainda usam host do CMS; manter mídia no CMS é válido, mas links HTML navegáveis devem apontar ao domínio público.
- **JK-206:** alinhar documentação do CI: o workflow não executa `audit:wordpress` explicitamente, apesar do QA afirmar que executa.

### M3 — comentários e operação (P3)

- **JK-301:** decidir manter, pausar ou encerrar comentários; até a decisão, usar moderação prévia.
- **JK-302:** adotar rate limit compartilhado e proteção antispam; definir retenção de IP/e-mail e aviso de privacidade.
- **JK-303:** limpar spam apenas após backup e política de retenção aprovada.
- **JK-304:** inventariar plugins do CMS por função; remover somente após staging, backup e teste de rollback.

## Validação executada

- `npm ci`: 423 pacotes auditados, zero vulnerabilidades reportadas.
- `npm run check`: ESLint, typecheck, 42 testes Vitest e build aprovados; a execução após a mitigação não repetiu os 500 do baseline.
- `npm run test:e2e`: 25 cenários aprovados e 3 ignorados por condição de fixture/viewport.
- `npm run audit:wordpress`: 112 posts, 12 categorias e 7 autores; contrato Gutenberg/_embed válido.
- `npm run audit:cms -- https://cms.joysticknights.com.br`: auditor read-only adicionado; deve falhar antes do deploy do plugin 1.2 e passar após o fechamento do CMS.
- `node scripts/verify-production.mjs https://joysticknights.com.br`: 10 verificações aprovadas.
- Inspeção HTTP manual: confirmou CMS público/canonical/sitemap, HTTPS e comportamento de `www`.

O resultado “aprovado” do build não elimina os 500 transitórios observados. Esta auditoria trata esses erros como evidência operacional, não como ruído de log.

## Ordem de implantação recomendada

1. snapshot do banco e `wp-content`;
2. atualizar e ativar o plugin 1.2 no CMS;
3. preencher constantes no `wp-config.php` sem expor segredos;
4. executar `npm run audit:cms -- https://cms.joysticknights.com.br` e validar a matriz JK-002 antes de tocar em DNS;
5. publicar as mudanças Next desta rodada;
6. configurar redirect de `www` no edge;
7. executar `npm run check`, E2E e verificação de produção;
8. enviar apenas `https://joysticknights.com.br/sitemap.xml` ao Search Console;
9. observar 4xx, 5xx, canonical e revalidação por pelo menos 24 horas.
