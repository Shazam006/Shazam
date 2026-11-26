# Sorteio em Sigilo

Aplicação estática de amigo secreto em três etapas. Sem backend ou dependências.

## Publicação
Copie esta pasta para a raiz de um repositório dedicado e habilite GitHub Pages (Settings > Pages > Deploy from a branch > main / root). Abra a URL HTTPS fornecida pelo GitHub antes de gerar convites. Não altere a configuração Pages do repositório Shazam sem verificar se há outro site ativo.

## Uso
Cadastre 2 a 100 participantes, configure exclusões direcionais e detalhes opcionais, gere e compartilhe links individualmente. O algoritmo usa emparelhamento bipartido com ordenação aleatória; encontra uma distribuição válida quando existe, sem garantir uniformidade entre todas as distribuições possíveis.

## Privacidade
Cada convite tem um envelope AES-GCM com a chave no próprio fragmento da URL. O portador, inclusive o organizador, pode revelar o resultado. O site não armazena convites em servidor e não oferece revogação, expiração ou autenticação. Não publique os links no GitHub nem em grupos. Para sigilo perante o organizador, é necessária uma arquitetura adicional com autenticação independente.

## Teste local
Execute `python -m http.server 8000` nesta pasta e abra http://localhost:8000. Links locais não funcionam em outros dispositivos; publique via HTTPS.
