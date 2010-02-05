---
  layout: ideiame
  title: Brincadeiras com flex - criando um chart
  categories: ['flex', 'sinatra']
  dirbase: /../../..
---

# Brincadeiras em flex - criando um chart

Brincando com flex, resolvi produzir um [exemplo em que exibisse um gráfico][exemplo_flex]. Encontrei um [exemplo][exemplo_flex] usando XML com JAVA, mas só para contrariar vou usar um background com *Sinatra*.

## Uma fonte de dados:

Resolvi criar uma fonte de dois valores **a** e outra fonte **b** com 100 valores randômicos, reinderizados em JSON. O servidor sinatra ficou com o seguinte código:

<div><pre class="prettyprint lang-ruby">
require 'rubygems'
require 'sinatra' 
require 'activesupport' 

get "/json.json" do 
  100.times.collect{|e| {:a => 1000+rand(1000), :b => 1000+rand(10000)}}.to_json
end
</pre></div>

## Testando o serviço JSON

Para testar o serviço JSON, é necessário acessar a URL de alguma forma, neste exemplo foi usado **curl** para fazer o teste do retorno do serviço. Curl é uma ferramenta que permite enviar ou receber informações do servidor.

>  jonatas@xonatax-mac: ~ $ curl http://localhost:4567/json.json

<div><pre class="prettyprint lang-javascript">
[{"a":1036,"b":1329},{"a":1442,"b":9879},{"a":1265,"b":8222},{"a":1822,"b":3708}...]
</pre></div>

## Criando o programa Flex

Após o serviço estar ok, é necessário criar o programa flex, que irá fazer o gráfico. O programa é composto básicamente por dois componentes, um DataGrid e um LineChart. Os dois componentes irão usar a mesma fonte de dados, e compartilham o mesmo serviço.

<div>
  <pre class="prettyprint lang-xml">
&lt;?xml version="1.0" encoding="utf-8"?&gt;
 &lt;mx:Application xmlns:mx="http://www.adobe.com/2006/mxml" layout="vertical"
    creationComplete="jsonservice.send()"&gt;
 &lt;mx:Script&gt;
 &lt;![CDATA[
 import mx.rpc.events.ResultEvent;
 import com.adobe.serialization.json.JSONDecoder;

 private function onJSONResult( event:ResultEvent ) : void {
   voidvar data:String = event.result.toString();
   toStringdata = data.replace( /\s/g, '' );
   replacevar jd:JSONDecoder = new JSONDecoder( data );
   chart.dataProvider = dg.dataProvider = jd.getValue();
 }
 ]]&gt;
 &lt;/mx:Script&gt;
 
 &lt;mx:HTTPService id="jsonservice"
    url="http://localhost:4567/json.json"
    resultFormat="text" result="onJSONResult(event)" /&gt;


 &lt;mx:LineChart id="chart" width="100%" height="100%"&gt;
 &lt;mx:series&gt;
 &lt;mx:LineSeries xField="b" yField="a" displayName="Company A" /&gt;
 &lt;mx:LineSeries xField="a" yField="b" displayName="Company B" /&gt;
 &lt;/mx:series&gt;
 &lt;/mx:LineChart&gt;
 &lt;mx:Legend dataProvider="{chart}" /&gt;

 &lt;mx:Panel title="Stock Data " width="100% " height="100% "&gt;
 &lt;mx:DataGrid id="dg" w="onJSONResult(event)" /&gt;

 &lt;mx:LineChart id="chart" width="100%" height="100%"&gt;
 &lt;mx:series&gt;
 &lt;/mx:LineChart&gt;
 &lt;mx:Legend dataProvider="{chart}" /&gt;

 &lt;mx:Panel title="Stock Data " width="100% " height="100% "&gt;
 &lt;mx:DataGrid id="dg" width="100%" height="100%"&gt;
 &lt;mx:columns&gt;
 &lt;mx:DataGridColumn dataField="a" /&gt;
 &lt;mx:DataGridColumn dataField="b" /&gt;
 &lt;/mx:columns&gt;
 &lt;/mx:DataGrid&gt;
 &lt;/mx:Panel&gt;
 &lt;/mx:Application&gt;
</pre>
</div>

Logo, fui visualizar o sistema e nada aconteceu:

![grafico-sem-dados]

E no aplicativo Sinatra, percebi um erro *404* no log que apontava para */crossdomain.xml* conforme o exemplo abaixo:

<pre>
 jonatas@xonatax-mac: json_flex $ ruby app.rb 
 == Sinatra/0.9.4 has taken the stage on 4567 for development with backup from Mongrel
 127.0.0.1 - - [04/Feb/2010 20:14:00] "GET /crossdomain.xml HTTP/1.1" 404 424 0.0013
</pre>


O gráfico estava sem dados e havia um xml não encontrado chamado *crossdomain.xml*. Então [descobri][crossdomain] que é necessário saber quais serviços podem ser acessados do site. Então declarei o seguinte xml:

<div>
  <pre class="prettyprint lang-xml">
  &lt;?xml version="1.0"?&gt;
  &lt;!DOCTYPE cross-domain-policy 
    SYSTEM "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd"&gt;
  &lt;cross-domain-policy&gt
    &lt;allow-access-from domain="*" /&gt;
  &lt;/cross-domain-policy&gt;
</pre>
</div>

Após isso adicionei o acesso ao xml ao Sinatra, sendo esta a versão final do serviço:

<div><pre class="prettyprint lang-ruby">
require 'rubygems'
require 'sinatra' 
require 'activesupport' 

get "/json.json" do 
  100.times.collect{|e| {:a => 1000+rand(1000), :b => 1000+rand(10000)}}.to_json
end

get "/crossdomain.xml" do 
  %(&lt;?xml version="1.0"?&gt;
  &lt;!DOCTYPE cross-domain-policy 
    SYSTEM "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd"&gt;
  &lt;cross-domain-policy&gt
    &lt;allow-access-from domain="*" /&gt;
  &lt;/cross-domain-policy&gt;)
end
</pre></div>

Depois retornei e fiquei muito feliz ao ver a interface funcionando: 

![grafico-com-dados]

De maneira muito simples, carreguei o mesmo serviço para os dois componentes, LineChart e DataGrid. Também é possível comparar e criar faixas relativas como um burn down chart sem esforços.

[exemplo_flex]: http://www.infoq.com/articles/flex-xml-json
[grafico-sem-dados]: /../../../images/grafico_sem_dados.jpg
[grafico-com-dados]: /../../../images/grafico_com_dados.jpg
[crossdomain]: http://moock.org/asdg/technotes/crossDomainPolicyFiles/
