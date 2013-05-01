---
 layout: post
 title: RML - Resume Markup Language
 categories: [code for fun, dsl]
 dirbase: /../../..
---

# RML - Resume Markup Language

Como não queria escrever um currículo, então criei este RML - Resume Markup Language, que se trata apenas de uma sintaxe inspirada em JSON.

Neste linguagem, os olhos do contratante são o compilador, e o objetivo deste código é mostrar cada chave com seu determinado valor. Se deseja me contratar, envie um email para a chave **email**.

ps: Googlando descobri que a linguagem RML [realmente existe][rml-google], e é para este fim também, mas não usa chave => valor, mas <chave>valor</chave>.

[rml-google]: http://terpconnect.umd.edu/~freeman1/rml.html

<div><pre class="prettyprint lang-js">
{
 name: Jônatas Davi Paganini
 email: jonatasdp@gmail.com
 phone: +55 46 9911 7879
 address: Rua São Paulo, 1112 
 zipcode: 85601 010
 city: Francisco Beltrão
 state: PR
 country: Brazil
 objectives: [
   Work with people that do whatever with passion
   Code for people
   Code for fun 
   Write pretty code
   Simplicity
 ]

 skills: [
   languages: [
       Ruby
       JavaScript
       Pl/Pgsql
       Java
       Html
       Css
       Dhtml
       Clipper
       FlagShip
       Shell
       Tex
    ]
    testing with: [
      Cucumber
      RSpec 
      Test::Unit 
    ]
    wraped in: [ 
      Rails
      Sinatra
    ]
    databases: [
      Postgresql
      MySql
      SqlLite3
      MongoDB
    ]
    operational system: [
      Linux
      Mac Os
      iPhone Os
    ]
    development star's: [
      VIM Editor
      Unix Terminal
      FireBug
      Rake 
    ] 
  ]
}
</pre></div>
