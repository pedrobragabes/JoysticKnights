# Atualização compartilhada do PromoGames — 14/10/2026

Fonte: estado local de `../PromoGames/web`, incluindo as correções ainda não commitadas de 14/10. Destino: JoystickNights-main. Marca, capa editorial, agrupamento do menu, categorias, assets, favicon, e-mail e CMS do JoystickNights preservados. O documento Newsroom já existente não foi modificado.

## Mudanças

- Next.js e eslint-config-next 16.4.0; sharp 0.35.5; source-map-js 1.2.2, com lockfile atualizado. Build continua usando Webpack.
- Carrossel permite que os últimos destaques alcancem a posição inicial e que os controles completem o ciclo. Cópias usadas para preencher a faixa ficam fora da navegação por teclado e da árvore de acessibilidade.
- Sumário usa Link com endereço completo da matéria/página. Âncoras nativas do conteúdo importado e do atalho de acessibilidade passam pelo App Router, respeitando origem, documento, teclas modificadoras e destino. Voltar restaura endereço, título e corpo da matéria.
- Sanitização conserva IDs legados, evita colisões e remove marcadores de citações de ferramentas sem excluir links reais. Imagens e legendas salvas pelo editor são preservadas mesmo quando a imagem também é capa ou se repete no corpo.
- Cliente e consultas do WordPress propagam exceções de controle do Next em vez de tratá-las como indisponibilidade do CMS. Política de cache do JoystickNights continua em cinco minutos, com tags de revalidação.
- Contato encaminha consentimento explícito, mantém UUID em retries e exige recibo JSON `201 / received` antes de confirmar recebimento. A integração existente via PromoGames Core continua disponível.
- Suporte opcional a `WORDPRESS_CONTACT_SECRET` e `WORDPRESS_CONTACT_API_URL`, exclusivamente no servidor. Só configure a chave dedicada se houver integração compatível instalada no CMS do JoystickNights e com destino correto. O plugin dedicado do Promogames não foi copiado: seu destinatário é fixo em contato@promogamesbr.com.

## Compatibilidade

A tela global de carregamento do PromoGames foi descartada após reproduzir mudança de HTTP 404 para 200 em `/page/99999/`. Os layouts e a ordem das categorias do JoystickNights foram preservados, conforme os testes específicos já existentes.

Nenhum deploy, alteração remota no WordPress, envio de mensagem real ou push foi realizado.

## Validação

- Lint, TypeScript, 84 testes unitários e build com Next 16.4 aprovados.
- E2E: 52 aprovados e quatro ignorados pelos critérios existentes (menu exclusivo de mobile e matéria descoberta sem imagens no corpo). Desktop e Pixel 7, incluindo regressões adicionais para todos os destaques e histórico após âncora. Respostas 404, categorias, identidade e contato aprovados.
- Auditoria das dependências de produção: zero vulnerabilidades. Após incorporar a manutenção já integrada em main, auditoria completa: cinco alertas altos na cadeia de ferramentas de desenvolvimento (ESLint, fast-glob, micromatch e braces). Patches de brace-expansion mantidos; downgrade automático do ESLint/Next não foi aplicado.
- O CMS apresentou respostas 500 transitórias durante build/testes; o build concluiu após retries. Esses erros externos não foram mascarados como conteúdo vazio.
