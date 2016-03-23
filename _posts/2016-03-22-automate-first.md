---
  layout: post
  title: Automatize primeiro
  categories: ['pense','dev']
---

Essa semana iniciei um projetinho na [Resultados Digitais](http://resultadosdigitais.com.br) com Ruby, uma
ferramenta interna para resolver alguns problemas da nossa infra.

Enfim, percebi que estou adotando uma nova abordagem para tudo que estou
fazendo. Automatizo tudo!

Comecei a navegar no terminal, precisei criar um arquivo, ou um banco de dados
ou configurar alguma coisa.

Logo que inicio crio uma pasta `script` com um arquivo `setup-alguma-coisa` dentro e adiciono ao README.

O processo é mais simples do que simplesmente eu lembrar depois. Então,
conforme vou fazendo testes e chegando a exemplos que funcionam, migro os
testes para um script bacaninha para reutilizar.

O [@pcasaretto](http://twitter.com/pcasaretto) escreveu um [post](http://shipit.resultadosdigitais.com.br/blog/padronizacao-para-reduzir-atrito-entre-projetos/) massa 
sobre padronização de setup e como esses padrões entre projetos facilitam a vida.
Então de certa forma essa ideia também tem a ver com isso. Sobre manter scripts
de `script/setup` para iniciar o projeto e `script/run` para rodar.

Sei que meus velhos amigos vão falar: mas nós sempre fizemos o  `make test`, `make build`,
ou `make install`, não seria isso?

A questão é `adotar`. Os métodos e práticas precisam ser adotados. Pode se usar
`make` ou uma pasta `script` com os bons e velhos `.sh` ou nossos modernos
dockers. O importante é não deixar de lado e ferrar o próximo que tentar
embarcar no code.

Quanto mais fácil for de fazer o setup, mais fácil será de conseguir
contribuições da comunidade.

Quanto mais simples for de fazer o release, mais pessoas vão poder contribuir
ao mesmo tempo. Então, antes eu ficava deixando para fazer o Makefile bonitão
no final. Agora estou partindo para um TDD. Digito `make test` and nada
aconteceu? Opa! Hora de criar meu script automatizado :)

