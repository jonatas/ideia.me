---
  layout: post
  title: Update ou upgrade
---



Esta semana estou pensando muito em como irei me apresentar para o mundo no meu modelo de freelancer. Percebi que o site está desatualizado pois enquanto fui sócio da [Executive] me dediquei totalmente ao negócio e acabei deixando de lado a atualização do meu trabalho e curriculo.

Comecei a navegar novamente e ver tantos posts e tantas outras ideias que desenvolvi até 2010 e quanta coisa eu tinha feito de lá pra cá para adicionar a este portfolio e como eu já penso diferente de lá pra cá. Tanto na forma de exposição das ideias e distribuição do conteúdo quanto na maneira de fazer o próprio site.

## O update

Acredito que o estilo console do site realmente define o dia a dia do meu trabalho e estou iniciando uma série de atualizações que irão apenas dinamizar as informações por aqui. Iniciei migrando o stream para o facebook pois ele já agrupa vários outros serviços e como ainda não me adaptei muito ao google plus vou manter apenas este stream na barra lateral do site. Antigamente usava o Google Buzz mas o produto foi abandonado :(

## A verdade

A segunda alteração que envolve o conteúdo do site é sobre filosofia de trabalho e conclusões tomadas sobre minhas experiências como empreendedor e freelancer. Gostaria muito de apresentar uma nova maneira de trabalhar de prestar serviço de desenvolvimento de software. Estou trabalhando com um de meus clientes com um modelo de desenvolvimento pré-pago e pretendo expandir este serviço para poder ser utilizado através do site. O princípio da ideia é sempre receber pelas horas de desenvolvimento de software. Sabemos que muito pouco dos programas de tecnologia tem sucesso real no mercado e ganham dinheiro brutalmente e eu um mero desenvolvedor, decidi que não quero arcar totalmente como um empreendedor em todo o tempo. 

## O upgrade

A essência do meu trabalho está em arquitetar, desenvolver e entregar software e a verdade é que o $uce$$o destes geralmente não é tão rápido quanto os "investidores" querem. Atrelar-se totalmente financeiramente em "parcerias" com "investidores" podem causar um rombo na suas conta bancária ou pior, no seu estomago. Criar parcerias esperando receber *apenas* quando o software "der certo" é uma decisão que pra mim foi empreendedora demais. Geralmente o software exige um período de amadurecimento.

A decisão principal é conquistar a independência financeira de maneira que as rendas venham de diferentes fontes e me permitam trabalhar sempre em novos projetos e de assuntos e tecnologias diferentes, que me permitam sempre aprender e ser pesquisador e tenha também a oportunidade de ensinar estes aprendizados a outras pessoas.

Percebi que a as principais dificuldades de quem está iniciando em uma tecnologia nova é a *habilidade* de reconhecer/resolver o problema com eficiência em um contexto totalmente novo. Em outras palavras, você é programador, sabe programar e pesquisar com uma relativa eficiência mas fica batendo a cabeça atrás de um simples erro navegando no google, stackoverflow e muitos outros fórums atrás da solução. Rola página daqui, rola página de lá, você lê 200 páginas e gasta muito mais tempo do que esperava para fazer a tarefa que até então era pra levar minutos.

Situações como essa acontecem todos os dias e você percebe que o trabalho durou muito mais tempo do que o estimado e consequentemente o número de horas de desenvolvimento. Alguém realmente tem que pagar por isso, e eu realmente acredito não ser eu.

## Live on the edge

Qualquer software que não é constantemente atualizado será penalizado de alguma forma quando precisar ser atualizado.

Sempre me lembro de que mantenho sempre o pensamento positivo sobre a atualização das versões por que o trabalho é árduo. 

Já tive muitas vezes bugs totalmente aleatórios. Por exemplo, quando o Rails lança uma nova versão, os plugins muitas vezes tem incompatibilidades e essas ferramentas também estão sendo atualizadas então a qualquer momento um deles pode ter uma nova versão.

Então você vai, instala, funciona, atualiza, para de funcionar, atualiza de novo, funciona. Instala outra coisa, ainda é incompatível com a nova versão... e por aí vai....

As versões novas então, sempre vem solucionando até o problema de instalação da versão anterior e trazendo muito mais novidades e performance. Após 2 minutos você já está rodando a nova versão e então você sempre decide que não pode ficar fora dessa e atualiza e atualiza e atualiza. Este é um ciclo vicioso muito positivo em busca da melhor qualidade no ambiente de desenvolvimento, testes e integração.

Existem várias ferramentas que controlam as versões: maven, rubygems, bundler e outras mas na prática estamos no mundo real e nem tudo é perfeito. Existem determinadas tarefas que seriam necessárias serem realizadas para manter tudo lindo mas na prática nem sempre elas são realizadas. 

Por outro lado, entendo que o ambiente real deve ser estável e utilizar versões estáveis mas realmente na prática quando você vai programar em um sistema desatualizado, nem sempre tudo está na ponta dos dedos. Por exemplo, na semana passada, pegamos uma simples funcionalidade de fazer o login com a conta do google/twitter utilizando o oauth e reservamos 2 horas e meia para realização da tarefa. 

Em 2 minutos rodamos no meu notebook o exemplo bacanda com a mesma versão do rails no servidor então implementamos e ao instalar as bibliotecas 'omini-auth' no servidor em produção a versão do RubyGems era mais antiga e impossibilitava a instalação sem atualização do RubyGems. 

O servidor de produção por sua vez, possuí um RubyGems que é compartilhado por mais uns 10 outros sistemas e não seria uma boa imaginar qual tipo de problema esta atualização poderia causar para os outros aplicativos. Sem escrúpulos, pegamos biblioteca por biblioteca das dependêncidas da omni-gems que também necessitavam a atualização da rubygems, baixamos e fizemos o downgrade e readaptação para versão mais antiga do Rails. Solucionamos o problema com 4 vezes o tempo que imaginavamos :/

Esta é a realidade sobre o ambiente de desenvolvimento: Nem tudo é perfeito. Eu como freelancer tenho me sentido muito feliz em migrar meu modelo de negócio para algo muito mais claro e próximo da realidade que eu vivo.

[Executive]:http://www.executive.com.br
