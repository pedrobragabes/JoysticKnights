# Integrações editoriais

## Contato

`/contato/` envia para `/api/contact/`. O servidor valida origem, tamanho,
campos, honeypot e frequência, e autentica a entrega ao CMS com o segredo
servidor existente `WORDPRESS_COMMENTS_SECRET`. O plugin 1.4 registra a mensagem
em **Mensagens do site**, disponível somente a administradores, sem REST público.
Há limite adicional no WordPress, compartilhado entre instâncias do frontend.
As mensagens ficam no CMS; não há promessa de envio de e-mail ou inscrição em newsletter.
Administradores podem revisar e excluir mensagens pelo painel.

## AdSense

Definir `NEXT_PUBLIC_ADSENSE_CLIENT` na Hostinger e recompilar. `/ads.txt` é
gerado a partir desse ID. Os anúncios automáticos mantêm as preferências da
conta AdSense. Slots manuais são opcionais e precisam de IDs de blocos reais.
A tag é carregada após consentimento de marketing; prévias e acesso direto ao
contato não inicializam anúncios. A mensagem europeia é administrada em
AdSense > Privacidade e mensagens e publicada pela própria tag do Google.
O Google pode levar até uma hora para distribuir alterações dessa mensagem.

## Blocos

Suporte a detalhes/summary nativos, áudio/vídeo, tabelas, colunas, galerias com
ampliação, slides Spectra com rolagem horizontal e cards de avaliação. Notas
numéricas antigas de reviews são preservadas; JSON-LD legado não é copiado.
Posts do X preservam texto e link mesmo sem carregar o script de terceiros.
YouTube usa o domínio de privacidade aprimorada; Vimeo, Spotify, SoundCloud e
widgets Steam têm hosts explícitos na sanitização e CSP. Scripts arbitrários,
formulários de plugins e iframes de hosts desconhecidos continuam bloqueados.
Elementor não é um segundo frontend: widgets novos que dependam do runtime
do plugin precisam de um componente ou integração específica.

## Referências oficiais consultadas

- https://support.google.com/adsense/answer/9261307
- https://support.google.com/adsense/answer/10961068
- https://support.google.com/adsense/answer/9274516
- https://developers.elementor.com/docs/forms/
- https://developer.wordpress.org/reference/functions/register_post_type/
- https://developer.wordpress.org/block-editor/reference-guides/core-blocks/
