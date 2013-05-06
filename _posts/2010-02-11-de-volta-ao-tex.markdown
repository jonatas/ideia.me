---
  layout: post
  title: De volta as aulas
  categories: ['unipar', 'artigo', 'estatistica', 'ruby']

---

# De volta a Unipar

Este é meu 5 de 4 anos na Unipar, fazendo o curso de sistemas de informação.  Após desistir da matéria de estatística o ano passado, estou voltando a todo vapor, apenas para terminar três matérias. O ano passado, desisti desta matéria por passar [algumas aulas programando os exemplos abordados][url-df] em aula, então este ano, a minha pretensão é levar este conteúdo mais a sério.

# De volta a estatística

Como estou trabalhando em um sistema para commodities, e percebendo a necessidade de estatísticos no mundo, resolvi escrever uma [proposta][proposta-tex] para o desenvolvimento do artigo. Estou contando com a colaboração forte da professora Denise Miechuanski, que irá ajudar na correção e sugestão dos conteúdos. Acredito que o sistema de ensino usado por ela funciona muito bem, e com a colaboração e interesse do aluno, é possível realmente aprender a usar a estatística. 

# De volta ao Latex

Gosto realmente de ver quando meus docs ficam bonitos. No caso de artigo científico, o padrão do material é mais rigoroso e característico. Como não é a [primeira vez][artigo-elep] que me deparo com esta situação, resolvi usar TeX para escrever o [artigo][github-url-artigo]. Como estou acostumado a usar o editor VIM, optei por ele para editar qualquer tipo de arquivo texto. 

Para tornar a formatação perfeita e estilosa, estou usando TeX. Que é uma poderosa lingugem de marcação que torna possível formatar um documento de diferentes maneiras. No meu caso, optei por TeX para usar o pacote abnt, tornando possível formatar um artigo científico apenas usando a seguinte declaração no documento:

<div><pre class="prettyprint lang-latex">
\documentclass[espaco=simples,appendix=Name]{abnt}
\usepackage{abntex}
\usepackage[brazil]{babel}
\usepackage[num]{abntcite}
\usepackage{tabela-simbolos}
\usepackage{dsfont} 
</pre></div>

Conheci esta linguagem o ano passado e fiquei muito feliz ao descobrir quanto esforço eu polpei, usando esta ferramenta. 

# Proposta do artigo

Desde que desisti de fazer a matéria, resolvi que este ano iria escrever sobre este assunto, ontem, após elaborar a [proposta][proposta-tex], então elaborei o início do [artigo][artigo-tex]. Hoje [commitei no github][github-url-artigo] pois pode se tornar interessante para a professora fazer a revisão parcial do artigo e também para garantir que nenhum esforço será perdido.

# O diferencial da ideia

A ideia foi elaborada, com o objetivo de ensinar a linguagem de programação Ruby através de uma necessidade ainda insatisfeita. Através das explicações de cada tópico estatístico, serão abordadas maneiras de realizar o mesmo processo codificando. [Acompanhe o artigo][github-url-feed] e colabore se quiser!


[url-df]: http://github.com/jonatas/distribuicao_de_frequencia
[proposta-tex]: http://github.com/jonatas/artigo_estatistica/blob/master/proposta.tex
[artigo-tex]: http://github.com/jonatas/artigo_estatistica/blob/master/artigo.tex
[github-url-artigo]: http://github.com/jonatas/artigo_estatistica
[github-url-feed]: http://github.com/feeds/jonatas/commits/artigo_estatistica/master
[artigo-elep]: http://github.com/jonatas/artigo_elep
