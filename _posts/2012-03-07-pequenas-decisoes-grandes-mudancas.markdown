---
title: "Pequenas mudanças e grandes decisões"
layout: post
description: "Como desenvolvedor, me sinto sedento pela busca mais rápida de colocar os sistemas pra funcionar de forma automática, simples e fácil de se construir."
---
Como desenvolvedor, me sinto sedento pela busca mais rápida de colocar os sistemas pra funcionar de forma automática, simples e fácil de se construir.

Sem demora busco no google e lá encontro pessoas em todos os lugares do mundo com um erro exatamente igual o meu. E lá encontra-se a resposta com aquele maravilhoso título alterado para _FIXED_.

Vivemos em uma comunidade cheia de diversidades. Fazemos nosso negócio melhor quando encontramos as melhores formas de interagir com essas diversidades. Encontramos pessoas realmente inovando todo dia. E o que uma coisa tem haver com a outra? A dificuldade de se habilitar a toda essa gama de ferramentas *força a comunidade a pensar e agir de forma simples*.

Estou me desafiando a criar o core do meu negócio totalmente aberto, programar aberto e manter *meus passos o mais transparente possível*.

A linha de raciocínio é simples, a maior parte dos códigos está pronta para ser reutilizados ou servir de exemplo para um próximo trabalho. Estou organizando tudo que é livre das lógicas de meus clientes e vou dedicar uns minutos criando bons exemplos do que realmente pode ser reutilizado.

Pense em quantos códigos realmente valiosos para você já foram criados e simplesmente estão abandonados no hd do seu notebook velho? Quantos dias e nervos foram gastos (fora financeiramente) e quanto eles valem hoje? Se você pensa que algum pode queimar teu filme, outro pode te render um bom freelancer no futuro... Você é o único pai deste filho orfão :)

Abaixo segue a lista de pedaços de códigos que tive a ideia de publicar:

* Android
  * Suite de efeitos utilizados no [Camera Overlay][android-market-link]
  * Chave dicotômica em JRuby - um uso legal do ListView do Android utilizando o Ruboto
  * Camera Overlay grátis - abrir a [versão gratuíta][android-market-link] enquanto não lançamos uma paga

* Web apps
  * Chave dicotômica -> projeto muito bacana, primeira experiência com linguagem natural, em andamento faltando publicar
  * Subway - sistema web que permite você montar um sanduiche do subway - uma DSL cool :) 
  * UseSMS Online - exemplo em sinatra que utiliza o serviço usesms criado pelo meu amigo Edson da Leosoft.

* Mercado Financeiro
  * Backtests online - sistema  de análise de performance de trades escrita com Sinatra + Backbone + jQuery + outras ferramentas mágicas do javascript
  * Adaptador de dados do mercado - recebe preços do mercado integrado com a Cedro Finances
  * DSL para trabalhar com barras OHLC e indicadores - integrado ao Marketcetera
  * Suíte de overloads sobre a classe [Strategy] do Marketcetera

* Ruby
  * Diff Tree -> um algorítmo que retorna um Tree::TreeNode que é faz um diff entre dois Tree::TreeNode's 
  * Chave dicotômica -> Biblioteca contendo a chave dicotômica das árvores e plantas arborescentes do Rio Grande do Sul e Santa Catarina.

[Strategy]: http://repo.marketcetera.org/javadoc/1.5.0/platform/org/marketcetera/strategy/ruby/Strategy.html
[android-market-link]:https://play.google.com/store/apps/details?id=me.ideia.cameraoverlay&feature=search_result#?t=W251bGwsMSwxLDEsIm1lLmlkZWlhLmNhbWVyYW92ZXJsYXkiXQ..
