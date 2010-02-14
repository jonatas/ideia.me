---
  layout: ideiame 
  title: Google code playground 
  dirbase: /../../..
---

# Diverta-se no google code playground

Esta semana vi uma twittada sobre o [google code playground][playground], e como mostra o printscreen abaixo, funciona mesmo! Acredito que esta plataforma pode ser realmente útil, e apartir dos exemplos prontos e rodando, se torna mais fácil das pessoas começarem a usar. Na imagem abaixo, estou [consultando o blog][blog-ange] da minha noiva Angela Maria Meili, veja o site dela em [www.consultoria-lingua.com][blog-ange].

![playground-printscreen]

Brincando mais um pouco, vamos embutir este serviço [nesta página][pagina-html-usando-servico]:

<div><pre class="prettyprint">
&lt;script src="http://www.google.com/jsapi" type="text/javascript"&gt;&lt;/script&gt;
&lt;script type="text/javascript"&gt;
google.load("gdata", "1.x", { packages : ["blogger"] });
&lt;/script&gt;
&lt;script type="text/javascript"&gt;
  function _run() {

  var bloggerService =
      new google.gdata.blogger.BloggerService('com.appspot.interactivesampler');
  
  var feedUri = "http://www.consultoria-lingua.com/feeds/posts/default?alt=rss";
  var handleBlogFeed = function(blogFeedRoot) {
     var author = blogFeedRoot.feed.getAuthors();
     var authorName = author[0].getName().getValue();
     var authorUri = author[0].getUri().getValue();
     var blogEntries = blogFeedRoot.feed.getEntries();
     var html = '&lt;h1&gt;&lt;a href="' + authorUri + '"&gt;' + 
                authorName + '&lt;/a&gt;&lt;/h1&gt;';
     
     for (var i = 0, blogEntry; blogEntry = blogEntries[i]; i++) {
        var blogTitle = blogEntry.getTitle().getText();
        var blogURL = blogEntry.getHtmlLink().getHref();
         
        html += '&lt;li&gt;&lt;a href="' + blogURL + '" target="_blank"&gt;'
             + blogTitle + '&lt;/a&gt;&lt;/li&gt;'
        
     };
    document.body.innerHTML = html;
  };
  var handleError = function(error) {
    document.body.innerHTML = '&lt;pre&gt;' + error + '&lt;/pre&gt;';
  };
  bloggerService.getBlogFeed(feedUri, handleBlogFeed, handleError);
  
}
google.setOnLoadCallback(_run);
  &lt;/script&gt;
&lt;body style="font-family: Arial;border: 0 none;"&gt;
Carregando...
&lt;/body&gt;
</pre></div>

Com poucas linhas de javascript puro, foi possível usufruir dos serviços do blogger. Estão disponíveis serviços de diversas Apis. 

[playground]: http://code.google.com/apis/ajax/playground
[blog-ange]: http://www.consultoria-lingua.com
[pagina-html-usando-servico]: http://savedbythegoog.appspot.com/?id=3ccfc6e0bc3ed8159f3869fd773001b3551370c3
[playground-printscreen]: /images/google_code_playground.jpg
