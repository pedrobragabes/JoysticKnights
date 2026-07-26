# Transição Hostinger do zero — JoystickNights

Este é o roteiro operacional do projeto independente JoystickNights. O PromoGames permanece em seu próprio diretório, Git e plano Hostinger e não participa desta migração.

## Resposta curta às dúvidas principais

### Preciso mudar as senhas dos redatores?

**Não.** Usuários, senhas, funções e conteúdo ficam no banco do WordPress. Ao copiar o banco para o novo endereço do CMS, as senhas continuam válidas. Cada pessoa provavelmente terá de entrar novamente porque `cms.joysticknights.com.br` usa cookies diferentes do domínio antigo.

Não troque senhas nem os salts do WordPress durante o corte sem uma razão de segurança. Faça isso depois, separadamente, se houver suspeita de vazamento.

Você criará apenas credenciais técnicas novas:

- um usuário WordPress técnico, exclusivo para o frontend, e uma **Application Password**;
- um segredo para preview;
- um segredo diferente para revalidação;
- um terceiro segredo, também diferente, para comentários;
- credenciais de um banco novo somente se fizer uma restauração manual.

A senha do banco não é a senha dos redatores. Alterá-la no `wp-config.php` não muda os logins do WordPress.

### O WordPress continua como antes?

Para a redação, quase tudo continua igual:

- mesmo `/wp-admin`, agora no subdomínio `cms`;
- mesmos usuários, funções, posts, rascunhos, agendamentos, categorias, mídia e comentários;
- Gutenberg, biblioteca de mídia e moderação continuam no WordPress;
- o botão de preview passa a abrir o novo frontend;
- publicar ou atualizar conteúdo avisa o Next.js para renovar a página.

O que deixa de ser igual é a aparência pública. O tema Hello/Elementor, cabeçalho, rodapé e scripts inseridos por `wp_head` não desenham mais o site. O público recebe o frontend Next.js. Alterar o visual no Elementor não altera automaticamente o novo site.

### Todos os plugins continuam funcionando?

Os plugins podem continuar instalados, mas não se pode prometer que todos produzam o mesmo efeito público. A regra é:

| Tipo de plugin | Resultado no headless |
|---|---|
| Editor, campos, usuários, mídia e dados | Continua no WordPress |
| SEO TSF/SEOPress | Dados chegam ao frontend pelo PromoGames Core; metadata pública é gerada no Next |
| Elementor/Spectra | Conteúdo precisa de compatibilidade; o layout do tema não é executado no Next |
| Complianz | Configuração pode ficar no WP, mas banner/consentimento público é do Next |
| Site Kit | Histórico fica; a tag pública é carregada pelo Next após consentimento |
| LiteSpeed | Ainda pode ajudar banco, objeto e mídia do CMS; não é o cache das páginas Next |
| WP-PageNavi | Fica apenas para rollback; paginação pública é do Next |
| Formulários, widgets, shortcodes e pop-ups | Precisam ser testados e, normalmente, portados explicitamente |
| PromoGames Core | Faz o contrato de conteúdo, preview, SEO, comentários e revalidação |

Não remova Elementor, tema ou plugins antigos no dia da migração. Eles são úteis para rollback e seus dados podem continuar dentro dos posts. A limpeza vem depois da estabilização.

## Arquitetura recomendada para os seus planos

Use esta divisão:

| Local | Site | Função |
|---|---|---|
| Business do JoystickNights | `joysticknights.com.br` | Frontend Next.js público |
| Mesmo Business do JoystickNights | `cms.joysticknights.com.br` | WordPress da redação |

Em julho de 2026, a documentação da Hostinger informa que Web Business aceita aplicações Node.js/Next.js e até cinco sites Node.js. Confirme os limites exibidos no seu próprio hPanel, pois ofertas contratadas podem ter parâmetros diferentes. O Premium do PromoGames não será usado pelo JoystickNights.

Links oficiais para conferir antes de começar:

- [Deploy de aplicação Node.js/Next.js](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Limites atuais dos planos](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/)
- [Opções de Node.js na Hostinger](https://www.hostinger.com/support/node-js-hosting-options-at-hostinger/)
- [Cópia de WordPress para outro domínio/subdomínio](https://www.hostinger.com/support/6601521-how-to-copy-a-wordpress-website-to-another-domain-name-in-hostinger/)
- [Criação de subdomínio como website separado](https://www.hostinger.com/support/1583405-how-to-create-and-delete-subdomains-in-hostinger/)
- [Ambiente de staging WordPress](https://www.hostinger.com/support/5720286-how-to-create-a-wordpress-staging-environment-in-hostinger/)

O Business permite staging WordPress e **Copy Website**, desde que origem e destino estejam no mesmo plano e haja uma vaga de website. Não use o botão **Publish staging** para o corte: ele pode sobrescrever o banco ativo e perder conteúdo publicado depois da criação do staging.

### O Business vai aguentar o web app?

É uma base razoável para lançar o JoystickNights porque o frontend usa cache e ISR e o plano Business atual anuncia 2 vCPU, 3 GB de RAM e até cinco aplicações Node.js. Isso não é uma garantia de tráfego ilimitado: uma matéria viral, imagens sem CDN, muitas reconstruções simultâneas ou o WordPress lento ainda podem saturar recursos.

Comece com o app do JoystickNights no Business e acompanhe **hPanel → Websites → Dashboard → Resources Usage**. Faça um teste de carga controlado no beta antes do corte e defina alerta para CPU, memória, processos e respostas 5xx. Se o uso ficar repetidamente próximo do limite, suba o frontend para Cloud/VPS ou outro runtime antes de comprometer a publicação. A latência do WordPress no mesmo Business também precisa ser monitorada, mesmo com páginas públicas em cache.

## Antes de tocar em qualquer domínio

Crie uma planilha ou documento de controle do JoystickNights contendo:

- conta/plano Hostinger em que ele está;
- provedor DNS e acesso ao domínio;
- registros DNS atuais, especialmente MX, SPF, DKIM e DMARC de e-mail;
- versão do WordPress, tema e plugins ativos;
- número do último post, data e autor;
- contagem de posts, páginas, usuários e comentários;
- tamanho do banco e de `wp-content/uploads`;
- IDs do Google Tag, Analytics e AdSense;
- formulários, newsletter, SMTP, pixels, webhooks e arquivos como `ads.txt`;
- pessoa que decide continuar ou fazer rollback.

Depois:

1. Baixe para fora da Hostinger um backup completo de arquivos e banco.
2. Teste que o arquivo de banco realmente abre e anote tamanho/data.
3. Não coloque SQL, uploads, `.env`, `wp-config.php` ou chaves no GitHub.
4. Baixe/exporte a zona DNS.
5. Vinte e quatro horas antes do corte, reduza o TTL de raiz e `www` para 300 segundos.
6. Verifique o espaço e as vagas de websites do Business.
7. Verifique quantas aplicações Node já existem no Business.
8. Confirme que o repositório independente do JoystickNights pode ser acessado pela conta GitHub conectada ao plano Business. ZIP é a alternativa.

## Parte 1 — ensaio completo no JoystickNights

### 1. Criar o WordPress de ensaio no subdomínio CMS

No plano Business que já contém o JoystickNights:

1. Abra **Websites → Add Website**.
2. Adicione `cms.joysticknights.com.br` como website independente.
3. Aguarde DNS e SSL. Se o DNS estiver fora da Hostinger, aponte o `A` do subdomínio para o IP informado no plano.
4. Abra **Websites → Dashboard → WordPress → Copy Website**.
5. Escolha `joysticknights.com.br` como origem e `cms.joysticknights.com.br` como destino.
6. Confirme que o destino pode ser sobrescrito e inicie a cópia.
7. Espere a conclusão. A ferramenta copia arquivos e banco e atualiza referências internas; ela não copia e-mail, FTP ou SSH.

Se não houver vaga de website no Business, não apague o site atual. Primeiro escolha uma destas saídas: liberar uma vaga comprovadamente descartável, elevar o plano ou restaurar manualmente arquivos e banco em hospedagem separada.

Valide o clone:

- abra `https://cms.joysticknights.com.br/wp-admin/`;
- entre com a sua senha atual;
- abra o último post, um rascunho, uma página Elementor e a biblioteca de mídia;
- confira se `Configurações → Geral` mostra o domínio `cms`;
- salve novamente `Configurações → Links permanentes` sem alterar a estrutura;
- abra `https://cms.joysticknights.com.br/wp-json/wp/v2/posts?per_page=1`;
- marque **Configurações → Leitura → Desencorajar os mecanismos de busca**.

O CMS não deve ser protegido por Basic Auth global, pois o Next precisa ler REST e imagens. Use HTTPS, senhas fortes, MFA e proteção específica do painel. Adicione `X-Robots-Tag: noindex, nofollow` às respostas HTML do host `cms` se o painel permitir, sem bloquear `/wp-json/` nem `/wp-content/uploads/`.

### 2. Instalar o adaptador do WordPress

1. Compacte a pasta local `wordpress/promogames-core` como ZIP, mantendo `promogames-core.php` diretamente dentro da pasta do plugin.
2. No CMS, abra **Plugins → Adicionar plugin → Enviar plugin**.
3. Instale e ative **PromoGames Core 1.1**.
4. Crie um usuário técnico exclusivo, por exemplo `frontend_joystick`, com uma função mínima que ainda consiga ler rascunhos para preview. Não use a conta do dono do site.
5. No perfil desse usuário, crie uma Application Password chamada `Next JoystickNights`.
6. Copie o valor uma vez para o gerenciador de segredos. Não coloque no código nem mande em chat público.
7. Se a tela de Application Password não existir, verifique no Hostinger Tools se a função foi desabilitada e reative-a.

Gere três segredos aleatórios longos e diferentes no seu gerenciador de senhas. Antes da linha `/* That's all, stop editing! */` do `wp-config.php`, adicione:

```php
define('PROMOGAMES_SITE_NAME', 'JoystickNights');
define('PROMOGAMES_FRONTEND_URL', 'https://beta.joysticknights.com.br');
define('PROMOGAMES_PREVIEW_SECRET', 'MESMO_VALOR_DO_DRAFT_MODE_SECRET');
define('PROMOGAMES_REVALIDATE_URL', 'https://beta.joysticknights.com.br/api/revalidate/');
define('PROMOGAMES_REVALIDATE_SECRET', 'MESMO_VALOR_DO_REVALIDATE_SECRET');
define('PROMOGAMES_COMMENTS_SECRET', 'MESMO_VALOR_DO_WORDPRESS_COMMENTS_SECRET');
```

Não use literalmente os textos em maiúsculas. Os pares precisam coincidir, mas os três segredos entre si precisam ser diferentes.

### 3. Validar o código antes do deploy

No computador, a partir da raiz deste projeto:

```powershell
Set-Location .\web
npm ci
npm run check
npm run test:e2e
npm run audit:wordpress
```

O deploy só continua se esses comandos concluírem. O `audit:wordpress` usa a origem definida no ambiente; confira se ele está auditando o CMS desejado.

### 4. Criar o frontend beta no seu Business

No plano Business:

1. Abra **Websites → Add Website → Deploy Web App**.
2. Comece no domínio temporário da Hostinger.
3. Escolha **Next.js** e **Node.js 22**.
4. Conecte o GitHub ou envie ZIP.
5. Este repositório guarda o app em `web/`. Defina `web` como raiz do projeto. Se o formulário não oferecer essa opção, envie um ZIP com o conteúdo de `web` na raiz, de modo que `package.json` não fique dentro de uma pasta extra.
6. Use instalação `npm ci`, build `npm run build` e início `npm run start`.
7. Não use exportação estática: preview, comentários, revalidação, SSR e ISR precisam do servidor Node.
8. Cadastre as variáveis abaixo no hPanel e faça o deploy.

```dotenv
NEXT_PUBLIC_SITE_PROFILE=joysticknights
NEXT_PUBLIC_SITE_URL=https://beta.joysticknights.com.br
NEXT_PUBLIC_INDEXING_ENABLED=false

WORDPRESS_API_URL=https://cms.joysticknights.com.br/wp-json/wp/v2
WORDPRESS_USERNAME=frontend_joystick
WORDPRESS_APPLICATION_PASSWORD=COLE_NO_HPAINEL
WORDPRESS_COMMENTS_SECRET=SEGREDO_COMENTARIOS

DRAFT_MODE_SECRET=SEGREDO_PREVIEW
REVALIDATE_SECRET=SEGREDO_REVALIDACAO

NEXT_PUBLIC_GOOGLE_TAG_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_ADSENSE_CLIENT=
NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP=
NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_INLINE=
NEXT_PUBLIC_NEWSLETTER_ACTION=
```

Deixe analytics, anúncios e newsletter vazios no primeiro ensaio. Após o deploy temporário funcionar, conecte `beta.joysticknights.com.br`, aguarde SSL e redeploye porque as variáveis públicas fazem parte da build.

### 5. Aprovar o beta

Teste em desktop e celular:

- home, busca, paginação, categorias, tags, autor e 404;
- três matérias antigas e três recentes;
- uma matéria com Spectra e cada uma das páginas institucionais;
- imagens destacadas, imagens internas, embeds e links antigos;
- título, description, canonical, Open Graph e JSON-LD;
- `robots.txt` com `Disallow: /` e meta `noindex` no beta;
- login do redator no `cms`;
- criar rascunho, preview, agendamento, publicação e atualização;
- comentário aprovado, pendente, fechado e bloqueado pelo antispam;
- webhook de revalidação aparecendo nos logs do frontend;
- nenhuma Application Password ou segredo aparecendo no HTML, console ou URL;
- consentimento antes de carregar analytics ou anúncios.

Execute também:

```powershell
Set-Location .\web
npm run verify:production -- https://beta.joysticknights.com.br
```

Crie uma lista para as páginas Elementor e para formulários/shortcodes. Cada item deve ser marcado como **implementado no Next**, **redirecionado** ou **aceito como pendência**. “O plugin está ativo” não é aprovação funcional.

### 6. Ensaiar rollback antes da noite do corte

1. Anote os targets DNS antigo e novo.
2. Cronometre a volta do domínio de teste para o WordPress legado.
3. Teste home, matéria, mídia, login e comentário depois da volta.
4. Defina quem decide o rollback e quais sintomas o acionam: 5xx persistente, painel/REST fora, imagens críticas ausentes ou canonical errado em escala.
5. Meta sugerida: decisão em até 5 minutos e retorno em até 15 minutos após a decisão.

Não apague o frontend, o CMS ou o banco durante um rollback. Nunca restaure um dump antigo sobre conteúdo novo.

### 7. Fazer a sincronização final do JoystickNights

O clone de ensaio envelheceu enquanto você testava. Portanto:

1. Avise os redatores e pause publicação/edição.
2. Faça um backup novo do WordPress público e baixe-o.
3. Anote último post, data, contagens e uploads recentes.
4. Faça backup também do CMS de ensaio, pois a próxima cópia o sobrescreverá.
5. Use novamente **Copy Website** de `joysticknights.com.br` para `cms.joysticknights.com.br`.
6. Como o destino foi sobrescrito, reinstale/ative o PromoGames Core, reaplique as constantes e recrie o usuário/Application Password se necessário.
7. Recoloque as credenciais atualizadas no app Business e redeploye o beta.
8. Compare usuários, último post, páginas, mídia, comentários e plugins.
9. Repita o teste rápido de painel, REST, preview, imagem e webhook.

Essa segunda cópia é intencional: evita perder matérias publicadas durante o período de testes. Mantenha a pausa editorial até terminar o corte e a primeira janela de observação.

### 8. Preparar a aplicação de produção

Troque as variáveis da build:

```dotenv
NEXT_PUBLIC_SITE_PROFILE=joysticknights
NEXT_PUBLIC_SITE_URL=https://joysticknights.com.br
NEXT_PUBLIC_INDEXING_ENABLED=true
WORDPRESS_API_URL=https://cms.joysticknights.com.br/wp-json/wp/v2
```

Mantenha o usuário técnico e os três segredos do CMS. Troque também no `wp-config.php`:

```php
define('PROMOGAMES_FRONTEND_URL', 'https://joysticknights.com.br');
define('PROMOGAMES_REVALIDATE_URL', 'https://joysticknights.com.br/api/revalidate/');
```

Faça build/redeploy e valide pelo domínio temporário. É normal o canonical já apontar ao domínio final.

### 9. Fazer o cutover de DNS

1. Confirme que o CMS, backup externo, e-mails e rollback estão prontos.
2. Conecte `joysticknights.com.br` à aplicação Node do Business seguindo o assistente **Connect domain**.
3. Ajuste o DNS conforme o target mostrado pelo próprio hPanel e preserve todos os registros de e-mail.
4. Redirecione `www` com 301 para o domínio sem `www`.
5. Aguarde DNS e SSL.

**Não clique em Delete Website no WordPress antigo apenas para liberar o domínio.** A exclusão de um website na Hostinger pode remover arquivos, banco e e-mails associados. Se o hPanel disser que o domínio está preso ao website WordPress, abra o suporte e peça para desassociar/reapontar o domínio sem apagar a instalação. Só remova o legado depois de backup, estabilidade e confirmação dos e-mails.

Valide imediatamente:

```powershell
Invoke-WebRequest 'https://joysticknights.com.br/' -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest 'https://joysticknights.com.br/robots.txt' -UseBasicParsing | Select-Object StatusCode, Content
Invoke-WebRequest 'https://joysticknights.com.br/sitemap.xml' -UseBasicParsing | Select-Object StatusCode
Invoke-RestMethod 'https://cms.joysticknights.com.br/wp-json/wp/v2/posts?per_page=1&_fields=id,slug'
```

Depois abra uma matéria, categoria, autor, página, imagem antiga, `/wp-admin` e um comentário. Monitore CPU, memória, processos, 5xx, 404, latência do CMS, imagens e logs de webhook por pelo menos 60 minutos. Só então libere os redatores e envie o sitemap ao Search Console.

### 10. Rollback real, se necessário

Durante a primeira hora, os redatores continuam pausados. Se houver falha grave:

1. pare mudanças e registre o deployment problemático;
2. reaponte raiz e `www` ao target antigo do WordPress;
3. valide SSL, home, três matérias, mídia, login e comentários;
4. não restaure banco antigo e não apague CMS/Next/logs;
5. reabra a redação apenas quando todos estiverem usando o mesmo banco.

Se já houver conteúdo criado somente no CMS, não volte ao banco antigo. Use o procedimento técnico de rollback para servir o tema legado com o banco mais recente, descrito em [Piloto headless do JoystickNights](joysticknights-headless.md#rollback-ensaiável).

## O que pode melhorar depois que o JoystickNights estiver estável

Faça estas melhorias em ciclos separados, com backup e QA:

1. Portar todas as páginas institucionais que ainda dependem de Elementor.
2. Substituir shortcodes, formulários e newsletter por integrações nativas do Next.
3. Expor e renderizar corretamente redes sociais dos autores.
4. Adicionar armazenamento compartilhado ao rate limit de comentários se houver mais de uma instância Node.
5. Registrar falhas e tentativas de webhook, com alerta quando a revalidação falhar.
6. Monitorar uptime do frontend, `/wp-json/`, tempo de resposta, erros 5xx e uso de CPU/memória no hPanel.
7. Verificar consentimento, Analytics e AdSense no navegador antes de ativar IDs de produção.
8. Habilitar CDN/cache de mídia sem cachear preview, administração ou endpoints mutáveis.
9. Automatizar backups externos e testar restauração periodicamente.
10. Só depois remover tema/plugins legados comprovadamente sem uso.

O ganho esperado é importante: páginas públicas mais rápidas e estáveis por cache/ISR, design independente do tema, deploy e rollback controlados, menor exposição do WordPress e uma redação que continua usando a ferramenta conhecida. O custo é operacional: agora existem duas camadas para monitorar, e qualquer função que antes dependia do tema precisa ter implementação explícita no frontend.

## Checklist de autorização do corte

Só marque **GO** se todos os itens forem verdadeiros:

- [ ] backup fresco de arquivos e banco baixado e conferido;
- [ ] CMS no subdomínio abre painel, REST, mídia e último post;
- [ ] usuários existentes entram com as mesmas senhas;
- [ ] usuário técnico e três segredos exclusivos estão no hPanel;
- [ ] beta está `noindex` e passou no QA desktop/mobile;
- [ ] páginas Elementor, shortcodes e formulários têm decisão explícita;
- [ ] preview, publicação, revalidação e comentários funcionam;
- [ ] DNS e registros de e-mail foram registrados e preservados;
- [ ] rollback foi ensaiado e cronometrado;
- [ ] pausa editorial foi comunicada;
- [ ] build final usa domínio público, CMS correto e indexação ativa;
- [ ] responsável pelo corte pode ver logs e uso de recursos;
- [ ] ninguém precisa apagar o WordPress antigo para prosseguir.

Se um item crítico falhar, mantenha o site antigo no ar e corrija no beta. Não há benefício em fazer um corte incompleto.

## Referências internas

- [Runbook técnico do JoystickNights](joysticknights-headless.md)
- [Instalação e segredos do PromoGames Core](../wordpress/promogames-core/README.md)
- [Contrato do WordPress](CONTRATO-WORDPRESS.md)
- [QA de lançamento](QA-LANCAMENTO.md)
- [Deploy e rollback](DEPLOY-E-ROLLBACK.md)
