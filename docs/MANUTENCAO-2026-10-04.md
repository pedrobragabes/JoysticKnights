# Manutenção e validação de outubro de 2026

Base: main canônica, sem alterar o WIP de modernização PromoGames. Next.js e ESLint Next passam de 16.3.6 para 16.3.8. Overrides por major fixam brace-expansion 1.1.21 e 5.0.12, preservando CommonJS e as cadeias compatíveis.

A geração estática passa de duas páginas simultâneas por worker para uma e aumenta o mínimo de páginas por worker. O objetivo é reduzir a concorrência de consultas ao CMS compartilhado. Webpack e a política de cache das requisições permanecem em uso.

## Verificação

- Lint, tipos e 74 testes unitários passaram.
- O primeiro build encontrou respostas 503 do WordPress. O build com concorrência reduzida passou. A disponibilidade do CMS também varia; essas execuções não isolam a causa dos 503 nem comprovam capacidade permanente do host.
- E2E desktop/mobile: 47 passaram e quatro foram ignorados pelos critérios existentes. Um teste de paginação encontrou a tela de recuperação após falha upstream; repetido isoladamente, passou. O primeiro CI recebeu 403 do CMS no build. O job técnico agora usa um servidor REST local, somente leitura, com 56 publicações explicitamente sintéticas, sem fallback da aplicação. A suíte completa nessa origem passou em 50 cenários e ignorou dois exclusivos de mobile quando executados no desktop. A primeira execução sintética reutilizou imagem antiga do cache do Next e encontrou cinco timeouts; repetir com uma origem local nova comprovou o conteúdo atualizado.
- Auditoria de produção sem alertas. O audit completo ficou com cinco alertas high na cadeia de ferramentas baseada em braces; sem patch publicado compatível no corte consultado. Não foi aplicada a sugestão de downgrade do ESLint Next para 14.x.

Não foram criadas matérias, comentários ou mensagens. Os testes de contato interceptam respostas no navegador e verificam a rejeição de origem externa. Publicação na Hostinger, métricas Search Console/CWV e aceite editorial permanecem evidências operacionais próprias.

## CI e operação

O fixture cobre a parte do contrato REST consumida pelo frontend: paginação, filtros, posts, páginas, categorias, autores e ausência de rotas. Nunca é importado pela aplicação e rejeita escrita. As imagens sintéticas usam um SVG local; esse CI não mede desempenho do otimizador de imagens nem valida o CMS real. O workflow de uptime continua verificando o site e, quando configurado, o WordPress de produção. A configuração do host de deploy continua usando o CMS real.
