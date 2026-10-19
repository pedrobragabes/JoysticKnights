# JoysticKnights — atualização de funcionalidades em 19/10/2026

Fonte: estado local atual do PromoGames, incluindo arquivos sem commit. O inventário completo de caminhos e hashes está em PORTABILIDADE-PROMOGAMES-2026-10-19.json. As atualizações anteriores de setembro/14 de outubro foram preservadas. O nome público correto é **JoysticKnights**; identificadores históricos, domínio e namespaces REST permanecem compatíveis.

## Funcionalidades portadas e adaptadas

| Origem PromoGames | JoysticKnights |
| --- | --- |
| Prévia privada/autosave | Código de uso único, sessão limitada à matéria por 15 minutos, login/admin revogável no CMS; retirado o acesso amplo por Application Password do frontend |
| Barra administrativa | Atalhos de editar matéria, prévia, painel WordPress e edição da home; somente com sessão administrativa, origem exata e flag de ativação |
| Home editável | Títulos do radar/capa, destaques, plataformas e feed; ocultar blocos e mudar ordem dos dois blocos editoriais, no painel WordPress |
| Configurações do site | Logo na navegação desktop/mobile e rodapé, título/descrição/imagem social da home, e-mail público, redes sociais e descrição do rodapé |
| Notas modulares | Auto/exibir/ocultar ficha e nota; nota oculta também sai do objeto usado pelo JSON-LD; zero continua sendo nota válida |
| URLs antigas | Regras internas editáveis e slugs antigos, com recusa de URLs externas, travessias e ciclos; opt-in no proxy |
| Mobile | Menu, busca, cartão da home e arquivo próprio; categoria Mobile OU metacampo da plataforma, sem duplicar resultados |
| Paginação editorial | Destaques excluídos de todas as páginas do feed; se o bloco for oculto, matérias voltam ao feed; removidos blocos secundários repetitivos dos arquivos |
| Sitemap | Inventário completo, lotes de 100, imagens em lotes e falha explícita em inventário incompleto |

Landing comercial, branding/lojas, convites WhatsApp/Telegram, métricas de cliques em canais e catálogo de ofertas/afiliados dependem de produtos e destinos próprios do PromoGames. Não foram ativados no portal de notícias nem copiaram dados entre os sites. Eventos de audiência continuam nas integrações existentes de analytics e consentimento; cliques de grupo não são audiência editorial.

## Compatibilidade e ativação

O Core preparado é **1.5.0-jk.1**, pasta/namespace históricos `promogames-core` / `promogames/v1`. Não copiar configuração, banco, conteúdo ou contas do PromoGames. As flags novas começam desligadas: `WORDPRESS_ADMIN_TOOLBAR_ENABLED`, `WORDPRESS_REDIRECTS_ENABLED`, `WORDPRESS_EDITORIAL_SETTINGS_ENABLED`, `WORDPRESS_SITE_SETTINGS_ENABLED`.

Antes de ativar: instalar o Core pareado, configurar segredo de prévia de pelo menos 32 bytes nos dois servidores, conferir sessão real do CMS, preservar as variáveis atuais e validar a prévia de um rascunho já existente. A prévia antiga com `secret`/`id` passa a ser rejeitada. Não reutilizar uma Application Password ampla para este recurso.

No hPanel, o frontend atual usa GitHub/main, implantação automática e Node.js 22; último commit exibido é 25bc7c4. Plano Business com 2/5 aplicações, backup diário. O WordPress mostra Core 1.4.0 e WordPress 7.0.7. Newsroom não aparece entre os apps Node.js atuais. Site Kit pede reconexão pelo deslocamento do CMS; audiência Google não foi certificada.

## Validação

Node 22: lint, TypeScript, build e 101 testes unitários aprovados. E2E: 56 aprovados em desktop/Pixel 7 e dois cenários exclusivos de mobile ignorados no projeto desktop. Auditoria das dependências de produção: zero vulnerabilidades. E2E usa somente CMS sintético local, sem escrever em produção. PHP 8.3.35 oficial foi usado para sintaxe e contratos isolados; isso não equivale a validar o CMS de produção.

Uma variação não canônica de base64url na assinatura de prévia foi identificada ao rodar o teste portado com Node 22 e corrigida no JoysticKnights. O PromoGames foi apenas lido e permanece sem alterações por esta tarefa.

## Implantação confirmada em 19/10/2026

PR #25 integrada em `main` (`abeaf8b`), CI e varredura de segredos aprovadas. Hostinger concluiu a implantação com Node 22. Core 1.5.0-jk.1 instalado e as quatro flags acima ativadas. Página inicial e `/mobile/` respondem; a barra administrativa apareceu na sessão real do CMS e o formulário nativo da home foi salvo com os valores existentes. Prévia privada ainda requer validação real com um rascunho.

Exportações WordPress antes/depois: 709 itens originais, 709 preservados, nenhum ausente/alterado/adicionado na comparação de conteúdo, título, slug, status, tipo, anexos e datas. Pacote atual, pacote de retorno baseado no código anterior, exportações e relatório ficam privadamente em `%LOCALAPPDATA%/JoysticKnights/releases-20261019/`. O pacote de retorno não substitui backup integral da hospedagem.

Os números e versões anteriores descrevem a inspeção inicial. A newsroom foi criada como app separado; sua ativação editorial depende do banco e das credenciais próprios.

## Retorno

Repor o par frontend/Core anterior e as variáveis anteriores. Preservar o banco, uploads, matérias e opções atuais; nunca restaurar dump antigo sobre notícias novas. As opções e metadados desta versão não são apagados na desativação.
