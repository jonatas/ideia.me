---
  layout: ideiame
  title: WebOrb + ActiveRecord
  categories: weborb flex rails
  dirbase: /../../..
---

# weborb + active record

WebOrb tem se demonstrado muito bom no seu trabalho, estou gostando de desenvolver com ele, após descobrir que qualquer classe do ruby, não apenas as classes Service podem ser usadas como objetos remotos, fiquei muito feliz e logo tive boas experiências.

Boas experiências é poder chamar um ActiveRecord puramente apartir do flex:

<div><pre class="prettyprint">
remoteObject = new RemoteObject();
remoteObject.destination = "Person";
remoteObject.all({"include": "address", 
                           "conditions": ["age > ?",18]});
</pre></div>

Para isso apenas foi necessário alguns passos:

## Adicionar a configuração do serviço remoto:

Para trabalhar com weborb, existe um arquivo no projeto em que são mapeados os serviços, por padrão está em:

   Rails.root/config/WEB-INF/flex/remoting-config.xml

Neste arquivo deve ser adicionado o mapeamento entre as classes:

<div><pre class="prettyprint">
&lt;destination id="Person"&gt;
  &lt;properties&gt;
    &lt;source&gt;Person&lt;/source&gt;
  &lt;/properties&gt;
&lt;/destination&gt;
</pre></div>

## Adicionar mapeamento dos modelos

Após isso, é necessário configurar a classe ActionScript que irá receber o modelo, para ser possível recuperar as informações. O arquivo agora é:

    Rails.root/config/weborb-config.xml

<div><pre class="prettyprint">
&lt;classMapping&gt;
  &lt;clientClass&gt;com.model.Person&lt;/clientClass&gt;
  &lt;serverClass&gt;Person&lt;/serverClass&gt;
  &lt;source&gt;Person&lt;/source&gt;
&lt;/classMapping&gt;
&lt;classMapping&gt;
  &lt;clientClass&gt;com.model.Address&lt;/clientClass&gt;
  &lt;serverClass&gt;Address&lt;/serverClass&gt;
  &lt;source&gt;Person&lt;/source&gt;
&lt;/classMapping&gt;
</pre></div>

## Verificar os modelos do Rails

No model, sabe-se que é usado classes ActiveRecord como:

<div><pre class="prettyprint">
class Person &lt; ActiveRecord::Base
   belongs_to :address
end
class Address &lt; ActiveRecord::Base
end
</pre></div>

## Verificar os modelos do ActionScript

A classe model do ActionScript deve possuir os atributos que serão instanciados no Flex:

<div><pre class="prettyprint">
package com.model {
  [RemoteClass(alias="com.model.Person")]
  public class Person {
    public var name:String;
    public var age:Number;
    public var address:Address;
    
    public function Person() {
    }
  }
}
</pre></div>

## Compatibilizar os hashs do Rails e ActionScript 

Após isso, existe um pequeno problema entre as classes que são usadas como serviços, que o Hash do flex, converte as chaves como string, por não possuir símbolos, então é necessário fazer um pequeno hack no método find por exemplo:

<div><pre class="prettyprint">
module SymbolizeArgs 
  module ClassMethods
    # this hack should be used by remoteObjects 
    # that just pass a Hash with string keys
    # because this we need to symbolize the keys
    def find_with_simbolyzed_keys( *args ) 
      options = {}
      old_options = args.extract_options!
      old_options.each{|key,value|
        if key.kind_of?(String) 
          options[key.to_sym] = value 
        else
          options[key] = value
        end
      }
      args.push options
      find_without_simbolyzed_keys *args
    end
  end

  def self.included(base)
    base.class_eval do
      extend ClassMethods
      class &lt;&lt; self
        alias_method_chain :find, :simbolyzed_keys
      end
    end
  end  
end

module ActiveRecord
  class Base
    include SymbolizeArgs
  end
end
</pre></div>

O código acima pode ficar na pasta/arquivo: Rails.root/config/initializers/active\_record\_simbolyze\_keys.rb

Com esta alteração é possível usufruir do método find com todos os seus benefícios, de uma maneira fácil, a classe ActiveRecord fica totalmente exposta ao ActionScript.

Se o código acima não for ativado, você receberá um erro como: "Unknown key(s): conditions (ArgumentError)" 

ps: Inspirado em: <http://onrails.org/articles/2006/10/29/part-1-using-weborb-to-access-activerecords-from-a-flex-application>


