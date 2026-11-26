# Sorteio em Sigilo

Frontend HTML e API PHP 8.2+ com OpenSSL e mbstring. Sem GPT ou banco de dados. POST JSON para api.php: create (names, event, date, budget), preview (token), reveal (token). O sorteio usa Fisher-Yates com rejeição de pontos fixos. Tokens AES-256-GCM com chave exclusivamente no servidor, válidos por 90 dias. O organizador que tiver os links também pode revelar resultados. Não há revogação individual.

## Publicação
GitHub Pages não executa PHP. Use hospedagem PHP HTTPS ou Render com runtime Docker, branch sorteio-em-sigilo e root directory sorteio-em-sigilo. Configure DRAW_SECRET como segredo persistente, aleatório e de alta entropia (por exemplo, gere com `openssl rand -hex 32`). Nunca inclua esse valor no GitHub. O Dockerfile usa porta 10000. Em hospedagem PHP existente, envie index.html e api.php para uma pasta dedicada e configure DRAW_SECRET no ambiente do PHP. Não altere o site existente. Configure limites de requisições na hospedagem antes de divulgar publicamente. Trocar o segredo invalida convites anteriores.

## Teste local
`DRAW_SECRET="$(openssl rand -hex 32)" php -S 127.0.0.1:8000` (shell Unix, na pasta do projeto). No Windows configure a variável de ambiente antes de iniciar. Abra http://127.0.0.1:8000. Não use file://. Teste criação, preview sem resultado, reveal, duplicatas, tokens adulterados e expiração. Não há publicação confirmada ainda.
