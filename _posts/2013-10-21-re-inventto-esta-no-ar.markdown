---
  title: ReInvent.to está no ar!
---

Estou muito orgulhoso de falar do nosso trabalho no [Re.Invent.to][1]!. 

Hoje é o primeiro dia depois das 48 horas de desenvolvimento que tivemos e a [Rails Rumble][2] foi incrível.
Nos conhecemos cada vez mais como [equipe][7] e também como pessoas.

Após umas boas horas de programação é necessário ser muito empolgado para seguir num bom ritmo por mais horas,
 acredito que a equipe também serve para dar este ânimo 

Trabalhamos em 2 cidades diferentes: Eu e o [Tafarel][3] aqui em São Miguel do Oeste - SC e o [Marlon][4] e o [Mitruti][5]
em Francisco Beltrão. O [Wellinton Mitruti][5] substituiu o [Edson][6] no time e teve uma excelente participacão como designer da equipe.

Conseguimos usar uma série de componentes visuais próprios e um leiaute muito mais agradável do que se nós tivessemso produzido.

Existem uma série de coisas que realmente vieram como vieram e não foram pensadas e acabaram saindo naturalmente. Foi legal que
deixamos levar um pouco pela magia pois o escopo era bem definido já que a ideia veio de criarmos uma versão mais robusta e acessível
do [Camera Overlay][6]. Em breve iremos integrar o [camera overlay][6] e trabalhar no mesmo padrão e com projetos distribuídos e contribuitivos.

A ideia é apresentarmos este software para ser consumido para alguns destinos profissionais específicos.  Estamos pensando em começar 
em iniciar com o pessoal da área de tratamentos e acompanhamento de estética, sendo esta uma área que tem uma vasta utilidade como tratamentos de pele, cabelos, unhas.
Academias, cirurgiões plásticos e outros espaços voltados a saúde e transformação do corpo.

Um aspecto interessante de poder usar a camera do computador é utilizar uma câmera profissional conectada ao USB. Hoje a maioria
das cameras suporta acesso via USB e é possível tirar fotos de alta qualidade para os projetos. Uma possibilidade que enriquece
os projetos e abre as portas para ser utilizado como uma ferramenta de trabalho profissional.

Estou muito empolgado com estas ideias e também vamos produzir uma funcionalidade ou outro projeto apartir deste para facilitar 
a criação de stop motion via web.

O Re.invent.to pode ser extremamente útil para reposicionamento da camera e cenário.

## As primeiras 12 horas

Durante as primeiras 12 horas tivemos a maior produtividade do projeto. Iniciamos e tudo deu certo sem muitas complicações.

Decidimos umas questões como:

  * Não irá ter autenticação
  * Iremos solucionar o problema via url única e cookies por hora
  * Vamos fazer o projeto funcionar na parte sobre a câmera que é a essência do [Câmera Overlay][6]
  * Precisamos gerar um vídeo com as fotos - o camera overlay não faz isso

Conseguimos fazer o setup do server, capistrano e o setup do projeto na primeira hora. Então criamos um fluxo bem interessante
de deploy e tivemos um acompanhamento contínuo e evolutivo de todas as tarefas.

Também trabalhamos uma boa parte do tempo em par e em alguns momentos de maior tensão em três.

## Um descanso bem merecido

Dormimos no sábado de manhã e a tarde pegamos novamente. Foi muito legal pois rendeu muito até de manhã cedo. Fui dormir as 9:50.

Pegamos das 13 as 21 e foi bem interessante a satisfaçãod o rendimento que tivemos quanto a produção e organização da interface.

Tinhamos muitos desafios que ainda não tinhamos certeza do funcionamento mas no fim o canvas foi nosso melhor amigo :D

Eu e o [tafarel][3] saímos jantar e tomar umas cervejas após uma tarde intensa de desenvolvimento.

##  O segundo dia

No segundo dia mantemos em mente a ideia de que tudo ia funcionar bem e então começamos a fazer testes online. Tivemos um problema
de incompatibilidade com a versão do ffmpeg e não conseguimos nem mesmo usar o paperclip e o rmagick tbm não funcionou 100%. Por algum 
motivo os argumentos da linha de comando não eram compatíveis na versão instalada no servidor. Parecia que estava faltando alguma biblioteca
para lidar com o PNG ou algum detalhe neste sentido. Nos desgastamos profundamente tentando substituir os comandos que funcionavam em
todas as nossas máquinas locais, porém no nosso servidor não funcionavam.

Eu estava usando o macbook e o [Marlon][4] e o [Tafarel][3] estava usando ubuntu. E as versões deles do ubuntu eram mais atualizadas.
Me senti um pouco culpado pois fui eu mesmo que instalei a versão 12.04 no servidor e então perdi a oportunidade de instalar a versão 13.04 que
eles estavam rodando localmente e funcionava. Baixamos e compilamos a versão mais recente do ffmpeg mas também não adiantou. Testamos outros softwares
como o converter diretamente para tentar intermediar os problemas do PNG, mas não obtivemos sucesso.

Por fim quando faltava 1 hora para terminar o evento decidi abandonar a ideia de gerar o vídeo e fiquei focado em criar uma versão mais simples
usando o plugin cycle do jQuery para conseguir 'simular' o vídeo. O cycle deu certo porém não conseguimos gerar nenhum vídeo no ambiente servidor.

Os problemas do ambiente da programação são normais. Temos que aprender a lidar com eles. Sobreviver a eles. Encontrar alternativas para não travar
no ciclo virtuoso de desenvolvimento. Logo precisamos ser persistentes e tomar decisões rápidas quando os problemas começam a persistir mais tempo
do que esperávamos gastar em certas tarefas. Por fim conseguimos visualizar mas não gerar o conteúdo.

Fiquei chateado com a situação dos vídeos pois me empenhei uma boa parte do domingo implantando um worker com o resque para gerarem os vídeos em background
mas o conversor não funcionou.

De qualquer forma vamos dar sequencia neste projeto e iremos corrigir o caso. Por hora, na competição vamos participar com a versão que apenas faz o ciclo
que merge as fotos linearmente.

Fizemos o último deploy da aplicação uns 7 minutos antes do horário oficial terminar.

[1]: http://re.invent.to
[2]: http://railsrumble.com
[3]: http://jltafarel.github.io
[4]: http://marlonscalabr.in
[5]: https://github.com/Wmitrut
[6]: https://play.google.com/store/apps/details?id=me.ideia.cameraoverlay
[7]: http://railsrumble.com/entries/113-reinventto
