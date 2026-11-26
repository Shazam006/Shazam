# Sorteio em Sigilo

HTML/CSS/JS em public/index.html e API JavaScript em worker.mjs. Sem PHP, GPT ou banco de dados. POST /api aceita create, preview e reveal. Convites AES-256-GCM com chave exclusiva do servidor, expiração de 90 dias. Portadores de links podem revelar o respectivo resultado, inclusive o organizador. Não há revogação individual. Tokens da versão PHP não são compatíveis.

## Cloudflare Workers
Na pasta deste projeto, instale/execute Wrangler via npx, configure `DRAW_SECRET` como 64 caracteres hexadecimais aleatórios (`openssl rand -hex 32`), usando `npx wrangler secret put DRAW_SECRET`, e publique com `npx wrangler deploy`. Para desenvolvimento use .dev.vars local (nunca versionar) e `npx wrangler dev`. Configure rate limiting no serviço antes de divulgação pública.

## ChatGPT Sites
A estrutura usa APIs Web padrão. Para publicação pelo Sites, importe/adapte os arquivos ao runtime disponibilizado pelo ambiente. A compatibilidade direta com wrangler.jsonc no Sites não foi verificada. Não é GitHub Pages, que não executa a API.

## Testes
Execute `node --test worker.test.mjs` com Node 22 ou superior. Teste também a interface em navegador após implantação. Não há URL de produção confirmada.
