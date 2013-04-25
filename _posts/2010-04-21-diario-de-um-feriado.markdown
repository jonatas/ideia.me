---
  layout: post
  title: Diário de um feriado
  categories: latex xp
--- 



Hoje, como é feriado resolvi me dedicar a outras atividades além do desenvolvimento. Como fui convidado pelo professor Eder Gasparin para ministrar uma aula sobre [Extremme Programming][pdf], então resolvi [preparar o material][pdf]. 

Para preparar a [apresentação][pdf], concerteza tive que dar uma passada no [site da Improve It][improveit]. Quando participei de uma imersão ágil feita por eles, concerteza foi um dos eventos que mudou a minha vida.

O surgimento do Extremme Programming e a forma como o [Vinícius Teles][improveit] apresentou o conteúdo realmente me empolgou e me ajudou ainda mais a firmar meu espírito de programador. Percebi que as práticas do Extremme Programming eram muito melhores do que as práticas que tentavamos antes na empresa. Através dos exemplos práticos vivenciados durante a semana da imersão, foi possível perceber que poderíamos assumir um papel melhor, mais colaborativo, e tornarmos mais profissionais. A melhoria do trabalho, do pensar, do valorizar-se dentro da empresa trouxe muitas ideias novas e desapego a velha e escrava vida de codificador.

O desenvolvimento orientado a testes e a refatoração mudaram o rumo do desenvolvimento de software (pelo menos o meu). Escavar, descobrir, baixar uma tonelada de biliotecas para analisar, usar, e reaproveitar tudo que fosse possível. 

A independência da interface gráfica para programar também sempre foi algo que me satisfez, usando umas 200 linhas no .bashrc foi possível digitar apenas algumas letras e enter e já estava no ponto exato em que queria. 

Foi nesta mesma época, em que encarei que o VIM iria ser o meu editor definitivo, então superei fácilmente com seis meses de erros árduos e sempre com o pensamento "flexinhas para navegação é para os fracos" consegui me acustumar a ser um programador preguiçoso que está escrevendo este post no VIM.

Me empolgo muito em conseguir fazer várias coisas neste editor, por exemplo, em vez de utilizar uma interface gráfica para criar uma apresentação, não preciso do Power Point, Open Office ou iWork. Posso escrever um arquivo Latex e continuar usando o VIM.

Com este editor, eu já sei trabalhar e interagir com agilidade de diversas formas. Aproveitando para aprimorar meus conhecimentos, procuro encontrar linguagens simples que possam reproduzir as mesmas tarefas realizadas por estas interfaces. A criação desta apresentação no VIM, se tornou possível apenas lendo um pouco sobre como criar uma [apresentação em latex][tex], exemplos do pacote beamer e um conhecimento básico no Latex. 

Para criar uma página de apresentação como esta:

![valores-xp]

Com o LaTex, a apresentação acima deve ser escrita com um código semelhante à:

<div><pre class="prettyprint">
\section{Valores}
\frame{
  \frametitle{Valores mantidos na equipe}
  \begin{slide}{
    \begin{description}
      \item[Comunicação] 
      \item[Coragem]     
      \item[Feedback]    
      \item[Respeito]   
      \item[Simplicidade]
    \end{description}
  }
\end{slide}
}
</pre></div>

E apenas isso, o código acima cria um slide semelhante a figura mostrada anteriormente. Da mesma forma que usar um programa com interface gráfica, o slide foi gerado. E com um padrão muito bom. Também é possível agregar muitas outras ferramentas úteis na construção de uma apresentação. Acredito que usar o Latex para escrever apresentações é algo que está bem ligado a **Coragem**, um dos **Valores** mencionados acima. Coragem de usar, de querer aprender, de não ter medo do novo e do improvável.

Outro aspecto interessante de utilizar o terminal e o editor VIM **neste caso**, é que permitem que você se concentre exatamente na tarefa em que está fazendo, no conteúdo que está criando. As interfaces vivem impressionando com pequenos efeitos, "com bordinha ou sem bordinha?" entre outros aspectos que não devem ser pensados em todos os momentos. Todos estes pequenos artefatos ajudam e desfocam, fazem a concentração se perder em meio a tantos maravilhosos cliques que alteram o seu documento. Estes elementos, quando bem manipulados, são uma mão na roda na hora da produção intelectual, mas muitas vezes, gastam muitas horas preciosas de seus usuários.

[tex]: /apresentacao_xp.tex
[pdf]: /apresentacao_xp.pdf
[improveit]: http://improveit.com.br
[valores-xp]: /../../../images/valores-xp.jpg
