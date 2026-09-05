# Relatório operacional da migração do JoystickNights

**Data do ensaio/cutover:** 16 de agosto de 2026  
**Objetivo:** registrar o que foi necessário no JoystickNights e transformar o aprendizado em escopo e orçamento para a futura migração do PromoGames.

## Resumo executivo

O frontend Next.js foi publicado com sucesso na Hostinger como uma aplicação Node.js separada. O WordPress continua sendo a fonte editorial em `cms.joysticknights.com.br`, enquanto `joysticknights.com.br` foi transferido para o novo frontend em 16 de agosto de 2026.

O plano de e-mail foi atualizado para **Starter Business Email**, válido até 16 de agosto de 2027. A caixa `contact@joysticknights.com.br` permaneceu ativa, com aproximadamente 301 MB preservados, e passou a ter 10 GB de armazenamento.

Mesmo após o pagamento e a confirmação do plano pago no painel, o assistente de troca continuou informando que o plano gratuito seria redefinido e que as contas vinculadas seriam excluídas. O suporte humano orientou recriar o endereço exato e solicitar restauração em até 30 dias caso a caixa fosse apagada. Com backup e autorização expressa do responsável, o corte foi concluído. Na prática, a caixa paga permaneceu ativa e os 300,92 MB de mensagens continuaram presentes, sem necessidade de recriação ou restauração.

Após o corte, a Hostinger moveu automaticamente o WordPress legado para `joysticknights-com-br-130633.hostingersite.com`, preservando uma rota de rollback. A aplicação Node foi renomeada para o domínio público e recebeu a configuração de produção. Foi necessário remover um ALIAS legado da QUIC.cloud que concorria com o novo ALIAS da Hostinger. Depois da propagação e de uma reimplantação limpa, o domínio principal e `www` passaram a responder HTTP 200.

## Topologia implantada

| Endereço | Papel | Estado |
|---|---|---|
| `joysticknights.com.br` | Frontend Next.js na aplicação Node | Ativo em produção |
| `cms.joysticknights.com.br` | WordPress editorial e API REST | Ativo |
| `joysticknights-com-br-130633.hostingersite.com` | WordPress legado para rollback | Ativo |
| `beta.joysticknights.com.br` | Antigo endereço de homologação | Removido do DNS no corte |

Durante a migração existem três websites, mas o novo frontend não possui um terceiro banco editorial. Ele lê o conteúdo diretamente do CMS.

## Trabalho concluído

- CMS isolado criado em `cms.joysticknights.com.br`.
- Conteúdo WordPress copiado para o CMS.
- Plugin PromoGames Core 1.1 instalado e ativado.
- Usuário técnico não administrador criado para preview.
- Application Password exclusiva criada e armazenada apenas no ambiente da hospedagem.
- Três segredos independentes configurados para preview, revalidação e comentários.
- Aplicação Next.js criada no runtime Node.js 22 da Hostinger.
- Repositório `pedrobragabes/JoysticKnights`, branch `agent/repository-hardening`, commit `e9e3270f` implantado.
- SSL vitalício ativado no beta.
- Publicação, rota de matéria, busca, categorias, páginas, feed, sitemap, robots e proteção de rascunhos validados.
- Webhook de revalidação testado com resposta HTTP 200.
- A notícia de teste `teste-da-silva` apareceu corretamente no CMS e no beta.
- Build de produção preparada com canonical e sitemap apontando para `https://joysticknights.com.br`.
- Backup final informado como concluído pelo responsável antes do corte.
- Upgrade do e-mail concluído para Starter Business Email, com validade até 16 de agosto de 2027.
- Caixa `contact@joysticknights.com.br` confirmada como ativa após o pagamento, com os 300,92 MB preservados.
- Novo build com configuração de produção concluído em 16 de agosto de 2026; o corte foi bloqueado pelo alerta de e-mail.
- Beta restaurado em seguida para canonical próprio, `noindex` e bloqueio em `robots.txt`.
- Corte autorizado e executado em 16 de agosto de 2026.
- Aplicação Node configurada com `NEXT_PUBLIC_SITE_URL=https://joysticknights.com.br` e indexação habilitada.
- Build de produção concluído com 171 páginas estáticas, incluindo a notícia de teste.
- WordPress legado movido automaticamente para o domínio temporário de rollback da Hostinger.
- Caixa `contact@joysticknights.com.br` permaneceu ativa depois do corte, sem perda observada.
- MX e SPF permaneceram apontando para o serviço de e-mail da Hostinger.
- Destinos de preview e revalidação do PromoGames Core atualizados para o domínio de produção no CMS.
- ALIAS legado `c6496913.tier1.quicns.com` removido; ALIAS da Hostinger preservado.
- Nova implantação concluída às 19:10 de 16 de agosto de 2026 após a associação do domínio.
- Verificação automatizada de produção aprovada em home, categoria, busca, matéria, página institucional, feed, robots, sitemap e proteção de rascunho.
- Home, `www`, notícia `teste-da-silva`, CMS e WordPress legado validados com HTTP 200.
- Canonical de `www` e das páginas públicas validado apontando para `https://joysticknights.com.br`.

Nenhum segredo, senha de aplicação, banco, SQL, `wp-config.php` ou dado de cartão deve ser incluído neste relatório ou no Git.

## Bloqueio encontrado no corte

Na Hostinger, o plano gratuito de e-mail pode ficar vinculado ao website que usa o domínio. Ao tentar transferir `joysticknights.com.br` do WordPress para a aplicação Node, o assistente informou que:

- o WordPress antigo seria movido para um domínio temporário da Hostinger, preservando os arquivos para rollback;
- o plano gratuito de e-mail do domínio seria redefinido;
- as caixas vinculadas seriam excluídas.

Foi localizada uma caixa ativa, com aproximadamente 301 MB usados. Antes do upgrade ela tinha 1 GB; depois do pagamento, o painel passou a mostrar 10 GB, plano Starter Business Email e validade até 16 de agosto de 2027. Apesar disso, o assistente de troca continuou mostrando o alerta de exclusão. Por segurança, o corte foi interrompido antes de marcar o aceite ou confirmar a troca.

Apagar somente os arquivos de `public_html` não resolve o problema. O frontend usa SSR, ISR, rotas de API, preview e webhooks; por isso, o domínio precisa ser associado internamente ao runtime Node.js da Hostinger. Um simples upload de arquivos estáticos no website PHP quebraria essas funções.

## Opções para preservar o e-mail

### Opção recomendada: upgrade do plano de e-mail

A Hostinger apresentou o upgrade como a opção para manter a caixa e suas mensagens. Oferta observada em 16 de agosto de 2026:

| Prazo | Preço promocional exibido |
|---|---:|
| 12 meses | R$ 3,49 por caixa/mês; total exibido de R$ 41,40 |
| 24 meses | R$ 2,99 por caixa/mês |
| 48 meses | R$ 2,49 por caixa/mês |

O plano de 12 meses foi contratado por R$ 41,40 em 16 de agosto de 2026. Preços, impostos, descontos, renovação e condições podem mudar. Depois do upgrade:

1. confirmar que a caixa, mensagens, aliases e encaminhamentos continuam presentes;
2. reabrir a troca de domínio;
3. confirmar que o aviso de exclusão do e-mail desapareceu — no JoystickNights ele permaneceu mesmo depois do pagamento;
4. somente então conectar o domínio à aplicação Node;
5. testar recebimento e envio externo após o corte.

### Alternativa: transferência manual

A Hostinger também oferece migração manual para outro plano ou conta. Essa opção exige uma caixa de destino pronta, cópia de mensagens e validação de DNS/MX antes da troca. Ela traz mais etapas, maior chance de indisponibilidade e deve ser usada apenas com janela de manutenção e testes de envio/recebimento.

### Alternativa operacional: suporte Hostinger

Se o upgrade não remover o aviso, solicitar ao suporte que desassocie o domínio do website WordPress e o conecte à aplicação Node sem apagar a instalação antiga nem o serviço de e-mail. Não usar **Delete Website** para liberar o domínio.

No caso do JoystickNights, o suporte confirmou que o fluxo `Change domain` pode excluir a caixa mesmo após o upgrade. A alternativa oferecida foi recriar `contact@joysticknights.com.br` após a troca e pedir restauração em até 30 dias. Essa resposta não equivale a garantia de preservação contínua e deve ser tratada como plano de recuperação, não como migração sem perda.

## Itens que devem entrar no orçamento do PromoGames

Antes de estimar a migração, inventariar:

- quantidade de domínios e subdomínios;
- quantidade de caixas, aliases, encaminhamentos e catch-all;
- armazenamento usado por caixa;
- plano de e-mail atual, validade e vínculo com o website;
- MX, SPF, DKIM e DMARC;
- necessidade de upgrade ou migração de e-mail;
- plano Hostinger com suporte a aplicações Node.js;
- vagas disponíveis para websites e aplicações Node;
- custo de backup externo e retenção;
- horas para cópia final do WordPress e pausa editorial;
- adaptação de Elementor, shortcodes, formulários, anúncios e analytics;
- QA desktop/mobile, SEO, comentários, preview e webhook;
- janela de observação e rollback;
- suporte pós-lançamento e monitoramento de CPU, memória e erros 5xx.

O orçamento deve separar pelo menos:

1. infraestrutura e licenças recorrentes;
2. migração e implantação;
3. adaptação funcional do frontend;
4. QA e SEO;
5. migração/preservação de e-mail;
6. acompanhamento do corte e rollback;
7. manutenção e monitoramento mensal.

## Checklist adicional para o PromoGames

- [ ] Fazer inventário de e-mail antes de criar ou mover websites.
- [ ] Confirmar por escrito se o plano de e-mail é independente do website.
- [ ] Exportar ou migrar mensagens antes do corte, mesmo quando houver upgrade.
- [ ] Fazer backup externo de banco e arquivos.
- [ ] Criar CMS e beta isolados.
- [ ] Manter beta com `noindex` até a janela de corte.
- [ ] Validar o último conteúdo publicado no CMS e no beta.
- [ ] Testar usuário técnico, preview, revalidação e comentários.
- [ ] Preparar build final com canonical no domínio público.
- [ ] Preservar MX, SPF, DKIM e DMARC.
- [ ] Não apagar o WordPress legado para liberar o domínio.
- [ ] Manter o legado acessível em endereço temporário para rollback.
- [ ] Testar SSL, `www`, home, matérias, mídia, login, comentários e e-mail depois do corte.
- [ ] Monitorar por pelo menos uma hora antes de reabrir a publicação editorial.

## Estado atual e próximo passo do JoystickNights

O corte foi executado e validado. O frontend de produção, o CMS, o legado para rollback e a caixa paga de e-mail estão preservados. O certificado aparece como **Lifetime SSL — Ativo** no painel. O domínio principal e `www` respondem HTTP 200, com canonical no domínio sem `www`. O `robots.txt` permite indexação pública e aponta para o sitemap de produção.

Próxima sequência operacional:

1. testar envio e recebimento externo da caixa `contact@joysticknights.com.br`;
2. validar preview editorial e revalidação na próxima publicação real;
3. manter o WordPress legado intacto no endereço temporário durante a janela de observação;
4. monitorar erros 5xx e evitar novas mudanças de DNS durante as próximas 24 horas;
5. transferir futuramente os dois destinos de produção hoje fixados no PromoGames Core para `wp-config.php`, evitando que uma atualização do plugin sobrescreva a configuração operacional.
