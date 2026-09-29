# JoystickNights — melhorias compartilhadas de setembro de 2026

## Escopo

Atualização seletiva a partir da revisão local do PromoGames, sobre o `main` do JoystickNights em `1458fcf`. Implementada na cópia `JoysticKnights--github`, branch `codex/joysticknights-melhorias-compartilhadas`. O trabalho original do PromoGames, no diretório `JoysticKnights`, foi preservado.

- Capa editorial com títulos diretos, destaques, plataformas e feed cronológico; a home continua em `/` e a paginação em `/page/N/`.
- Consultas independentes em paralelo; página 2 em diante não consulta os destaques e as categorias que não exibe. O carrossel recebe apenas os campos que renderiza, carrega a primeira imagem com prioridade e dimensiona as imagens para o recorte vertical.
- Menu dividido em Conteúdo, Plataformas e Equipe, indicação da página ativa e rolagem em telas pequenas. Categorias, análises e Anime do JoystickNights permanecem disponíveis nos endereços existentes.
- Ícones de PlayStation, Xbox, Nintendo Switch e Windows reaproveitados da revisão anterior, em arquivos neutros de plataforma. Fontes em [PLATFORM-ASSETS.md](PLATFORM-ASSETS.md).
- Contato com formulário, orientações e acesso direto a `contact@joysticknights.com.br`. Mantém o link da política de privacidade. Com `WORDPRESS_COMMENTS_SECRET`, envia à integração existente; sem ele, prepara um e-mail para o leitor revisar e enviar no próprio aplicativo, sem simular recebimento.
- Correção do título da home e do contraste dos textos roxos no tema escuro, preservando a marca e as cores dos botões. Preferência de tema armazenada por perfil.
- Webhook rejeita formatos JSON inválidos, inclusive `null`, com HTTP 400; mantém autenticação, limites e invalidação editorial.
- Correção da classificação de análises, guias e promoções no frontend e no preenchimento de metadados ausentes do Core 1.4.1. Não sobrescreve decisões editoriais existentes.
- Next.js e eslint-config-next em 16.3.6 e sharp em 0.35.4, conforme a revisão anterior. Prévia HTTP local funciona também em WebKit; produção mantém HSTS e upgrade para HTTPS.

Não inclui landing page comercial, grupos, WhatsApp/Telegram, gestão de convites, lojas, gift cards, arte de GTA VI, número de participantes, paleta ou conteúdo editorial do PromoGames. Também não introduz a separação exclusiva entre a home comercial e `/noticias/` desse site.

## Validação local

- Lint e TypeScript aprovados.
- 73 testes unitários aprovados.
- Build de produção concluído e 40 testes E2E aprovados em Chromium desktop e mobile. Quatro cenários foram pulados pelos critérios da própria suíte: testes de menu mobile no desktop e galeria quando a matéria da amostra não tem galeria.
- A primeira tentativa de build registrou falhas temporárias da API do CMS e recuperou na repetição. O build da rodada final não registrou falhas de prerenderização nem de carregamento do WordPress. Isso não comprova disponibilidade contínua do CMS.
- Testes novos cobrem separação das marcas, URLs legadas de plataforma, estado ativo do menu, carregamento das imagens, acesso ao último item do menu em 320×568 e 667×375, contato e contraste claro/escuro.
- Inspeção visual em 1440, 390 e 320 px: sem rolagem horizontal; nenhuma falha JavaScript na amostra. Contato também conferido no WebKit a 390 px.
- Modo e-mail validado sem chamar `/api/contact/` e sem enviar mensagem; editar o texto remove o rascunho anterior. Envios de sucesso/erro da suíte E2E usam respostas simuladas.
- Sintaxe PHP e contratos isolados aprovados com PHP 8.5.11; CI mantém PHP 8.1. Auditoria npm de dependências de produção sem vulnerabilidades reportadas nesta execução.

Capturas e relatório local em `test-results/preview/`, ignorados pelo Git. Prévia de desenvolvimento em `http://localhost:3300`, com indexação desativada. Como esta cópia não possui as credenciais de produção, Contato usa o modo de preparação de e-mail.

## Publicação

A entrega não altera DNS, WordPress ou o domínio público. O frontend pode ser publicado pelo fluxo existente de GitHub/Hostinger com as variáveis atuais do JoystickNights. A atualização do Core é separada: substituir o plugin completo por `wordpress/promogames-core/` no CMS quando for instalar a correção de classificação. Não instalar a versão com gestão de grupos do PromoGames neste site.
