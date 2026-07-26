# QA e checklist de lançamento

**Baseline local:** 15 de julho de 2026<br>
**Release candidata:** v1.0.0

## Evidências automatizadas

| Verificação | Resultado |
|---|---|
| ESLint | aprovado |
| TypeScript / route types | aprovado |
| Testes unitários | 12 aprovados em 4 arquivos |
| Build Next.js 16 | aprovado; 44 páginas/handlers gerados |
| E2E Chromium desktop/mobile | 13 aprovados; 1 cenário desktop corretamente ignorado por ser exclusivo de mobile |
| Acessibilidade automatizada | nenhuma violação crítica do axe na home e matéria |
| Auditoria npm moderada+ | 0 vulnerabilidades após override compatível do PostCSS 8.5.10 |
| REST WordPress | 508 posts, 14 categorias e 9 autores auditados |
| SEO técnico | sitemap, robots e JSON-LD verificados por E2E |
| Segurança editorial | preview/revalidação sem segredo retornam 401; webhook válido coberto por E2E |
| GitHub Actions Linux / PHP 8.1 | aprovado na `main`, incluindo `php -l` do PromoGames Core |

O GitHub Actions repete build, testes, auditoria e `php -l` do plugin em cada push/PR.

## QA visual executado

- Desktop 1280×720: sidebar, quatro destaques verticais, grid, categoria e matéria.
- Mobile 390×844: header, deck horizontal, busca, matéria e menu por teclado.
- Contraste dos títulos sobre imagem corrigido e validado.
- Imagens possuem dimensões reservadas e fallback; slots publicitários reservam 90/180/250 px.
- Conteúdo Gutenberg foi conferido com listas, imagens, links, embeds, tabelas e citações responsivas.

## Checklist obrigatório em staging

### URLs e conteúdo

- [ ] `/`, categoria, busca, autor e três matérias retornam 200.
- [ ] Um slug inexistente mostra 404 e `noindex`.
- [ ] Slugs históricos não redirecionam para o WordPress antigo.
- [ ] Imagens antigas e novas carregam no host definitivo.
- [ ] Autoria, datas, categorias e relacionados correspondem ao WordPress.
- [ ] Busca com acentos, termo vazio e zero resultados funciona.

### Operação editorial

- [ ] Preview de rascunho abre com banner e não é indexável.
- [ ] “Sair do preview” limpa o cookie.
- [ ] Publicar, editar, agendar, enviar à lixeira e restaurar disparam revalidação.
- [ ] Sem webhook, o conteúdo converge pelo fallback de 5 minutos.
- [ ] O endpoint `/wp-json/promogames/v1/home` respeita curadoria e ordem.

### SEO e social

- [ ] Canonical usa o domínio público e trailing slash.
- [ ] Título, descrição, OG e imagem aparecem no HTML de uma matéria.
- [ ] JSON-LD passa no Rich Results Test/Schema Validator.
- [ ] `/sitemap.xml` usa o domínio público e contém o acervo.
- [ ] `/robots.txt` bloqueia `/api`, `/preview` e `/buscar`.
- [ ] Search Console recebe o sitemap após o cutover.

### Analytics, publicidade e performance

- [ ] GA não carrega sem variável; com variável, aparece no Realtime do ambiente correto.
- [ ] Nenhum segredo aparece no bundle ou nas respostas.
- [ ] Slots de anúncio não deslocam conteúdo ao preencher.
- [ ] Lighthouse mobile é registrado em janela anônima; investigar regressão relevante de LCP/CLS/INP.
- [ ] Console do navegador e logs do runtime não têm erro recorrente.

### Segurança e rollback

- [ ] HTTPS, CSP, HSTS, `nosniff`, referrer e permissions policy estão presentes.
- [ ] Segredos de staging e produção são distintos e armazenados no provedor.
- [ ] Backup do banco/uploads foi concluído.
- [ ] Deployment anterior está identificável e o rollback foi ensaiado.
- [ ] Responsável pelo cutover e canal de incidente estão definidos.

Itens deste bloco dependem do ambiente real e devem ser assinados pelo responsável antes do DNS. O pacote de código pode ser lançado sem simular aprovação de credenciais ou infraestrutura ainda não conectadas.
