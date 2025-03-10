---
title: "A importância dos baby steps"
layout: post
categories: ['xp', 'bdd', 'tdd']
description: "Estou trabalhando em um projeto em que a interface foi construída com Flex. Estou me adaptando novamente a IDE e não consegui encontrar nenhuma ferramenta de..."
---
Estou trabalhando em um projeto em que a interface foi construída com Flex. Estou me adaptando novamente a IDE e não consegui encontrar nenhuma ferramenta de integração entre o VIM e o Eclipse que funcionasse no mac. 

## O ciclo de desenvolvimento

Testar um sistema em Flex, tem sido uma satisfação no ciclo de desenvolvimento orientado a testes. Cada pequena alteração no Flex, envolve uma série de tarefas como:

* abrir o browser
* logar no sistema
* navegar até chegar no ponto desejado
* preencher os campos
* verificar a validade da execução do serviço
* então o teste passou ou falhou
* implementação
* se o teste passou posso escrever um novo teste
* reabrir o browser e reiniciar este ciclo

Existem basicamente dois passos acima que não são repetitivos, implementação e adicionar novas funcionalidades escrevendo novos testes. Os outros passos são apenas consequências destes dois. Sendo este um processo de vários passos, como desenvolvedor quero automatizar estes passos repetitivos.

## Abrir o browser

Para abrir o browser, e testar o aplicativo flex, estou usando Watir], com o browser Safari. Através de uma simples instância do browser é possível navegar por páginas e acessar os elementos do contexto.

<pre class="prettyprint">
  @browser = Watir::Safari.new
  @browser.goto("http://localhost:3000/")
</pre>

Em conjunto com a biblioteca FunFx é possível compilar uma versão do aplicativo flex, com algumas ferramentas que permitem automação de tarefas e manipulação do aplicativo. Neste projeto estou usando as seguintes biblitecas:

- FunFXAdapter.swc
- automation.swc
- automation\_agent.swc
- automation\_dmv.swc
- funfx-0.2.2.swc

Com estas bibliotecas e a gem **FunFx**, é possível resgatar o objeto principal do aplicativo flex, que está na página aberta anteriormente:

<pre class="prettyprint">
  @flex = @browser.flex_app("flashContent", "NomeDoSWF")  
</pre>

Após isso o objeto flex está disponível e pode manipular elementos por vários tipos de seletores.

<pre class="prettyprint">
  @flex.text_field(:id => "username").input("jonatas")
  @flex.tab_navigator(:automationName => "Administração").change("Usuários")
  @flex.button(:id => "login").click
</pre>

Com estes e outros métodos, é possível manipular e testar o funcionamento do aplicativo flex. AutomationName é um nome deduzido pela própria biblioteca e geralmente é representado pelo próprio label do componente.

Através de uma ferramenta de gravação de tarefas, é possível verificar a melhor forma de maniupular os componentes de cada tela. A ferramenta grava os passos executados e transforma em código ruby, semelhante ao exemplo abordado anteriormente, apenas mais sujo e preciso. Esta sujeira, na verdade se trata de um código denso, pois ao invés de usar apenas um seletor, o gravador usa vários seletores ao mesmo tempo.
O exemplo a seguir, trata-se da gravação de apenas um clique em um botão:

<pre class="prettyprint">
@flex.panel({:id => 'users', 
        :automationName => 'Usuarios', 
        :automationIndex => 'index:4', 
        :automationValue => 'Usuarios'}
        ).button({
           :id => 'newUserButton',
           :automationName => 'Novo', 
           :automationIndex => 'index:5', 
           :automationValue => 'Novo'}).click('0')
</pre>

Também é interessante olhar este exemplo, para entender as várias formas de se atingir o mesmo elemento, ou garantir que será aquele. Agora basta escolher qual é a melhor forma de acessar o elemento, retirando os seletores que apenas **garantem** que será aquele elemento. 

<pre class="prettyprint">
@flex.panel(:id => 'users').button(:id => 'newUserButton').click('0')
</pre>

Para usufruir desta bela biblioteca, estou usando **Cucumber** para escrever as estórias e implementar os passos. 

Para não sofrer em reiniciar o ciclo todas as vezes, estou usando **Autotest** para reiniciar o ciclo a cada alteração efetuada. Uma prática que gostei, foi de manter uma tag @focus apenas na estória que estou executando, então na configuração do cucumber adicionei o seguinte:

<pre class="prettyprint">
autotest-all: --format pretty --tags @focus
</pre>

Usando estas ferramentas, tenho certeza que estou evitando muitas horas de navegação e teste manual. Além de tudo, garanto que o aplicativo está funcionando por inteiro, pois quando um teste quebrar, posso fácilmente identificar o erro e manter o sistema consistente.


Olhando para cada pequena funcionalidade, posso desenvolver apenas pequenos fragmentos, e fazer os testes passar.

Sem medo, cada passo acontece no seu tempo, e não gasto tempo navegando "pessoalmente" no sistema. Também evito aborrecimentos com grandes alterações. Uma alteração deve ser iniciada sempre com a escrita de um teste, pois quando você terminar a alteração, ela já vai estar pronta e testada.

Cada dia que passa, tenho certeza que o desenvolvimento orientado a testes, juntamente com os outros princípios do Extremme Programming trazem muitos benefícios para:

## desenvolvedor

* sempre evolui suas técnicas 
* melhora a qualidade do produto
* têm certeza da tarefa que está implementando
* mantêm o código auto documentado
* mantém o foco em um pequeno passo a cumprir
* satisfação em ver as funcionalidades implementadas

## produto

* é mais preciso
* resolve exatamente o que o teste (a estória) propõe

## equipe

* entende fácilmente a funcionalidade 
* adapta-se ao código
* levanta cenários de falhas ou estórias ainda não contadas

## proprietário do produto

* têm um documento formal em mãos que cumpre exatamente o que a estória conta ou seja, o que o aplicativo faz
* desenvolve uma habilidade e satisfação pelo protocolo utilizado
* respeita a estória e sabe que está "assinando um cheque" ao concordar com ela

# Conclusões

Cada passo que tenho andado tenho certeza que tem sido para frente. Aparentemente, executar um processo automatizado torna o desenvolvimento mais lento, mas no final das contas, é mais seguro e traz uma série de boas consequências para todos aspectos do negócio.

