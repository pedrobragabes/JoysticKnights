# JoystickNights Headless

Projeto independente do JoystickNights. O frontend público usa Next.js, React, TypeScript e Tailwind; o WordPress continua como CMS editorial em `cms.joysticknights.com.br`.

## Desenvolvimento

Requer Node.js 22.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

A aplicação local fica em `http://localhost:3000`.

## Validação

```bash
npm run check
npm run test:e2e
npm run audit:wordpress
```

## Deploy na Hostinger

O `package.json` está na raiz para que este repositório possa ser conectado diretamente a **Deploy Web App** no plano Business.

- framework: Next.js;
- Node.js: 22;
- instalação: `npm ci`;
- build: `npm run build`;
- inicialização: `npm run start`.

Cadastre as variáveis de `.env.example` no hPanel. Não envie `.env.local`, banco, uploads ou backups ao GitHub.

## Estrutura

- `src/`: frontend e rotas de servidor;
- `public/`: identidade e arquivos públicos do JoystickNights;
- `wordpress/promogames-core/`: plugin de integração do CMS;
- `docs/`: cutover, QA e rollback;
- `arquivoswordpress/`: backup local ignorado pelo Git.

Comece pelo [runbook do JoystickNights](docs/joysticknights-headless.md) e pelo [tutorial Hostinger](docs/TUTORIAL-HOSTINGER-DO-ZERO.md).
