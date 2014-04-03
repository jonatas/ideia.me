---
  layout: post
  title: Como gerar um vídeo de fotos sequênciais
---

Estive gerando uma série de vídeos com fotos sequências estilo _timelapse_ e existem muitas formas de fazer isso. Aqui estou  usando o bom e velho [ffmpeg](http://www.ffmpeg.org/).

Coloquei todas as fotos em um diretório e digitei: 

    ffmpeg -r 24 -i img%04d.jpg -c:v libx264 timelapse.mp4

Onde:

* `-r` é o frame rate, neste caso 24 fotos por segundo
* `-i` é o padrão de entrada (input) de imagens. Neste caso img001.jpg, img002.jpg e assim por diante.
* [libx264](http://www.videolan.org/developers/x264.html) refere-se ao padrão de encoding do vídeo. Parece ser o padrão do Facebook, Youtube, Vimeo e outros..

    Apesar do ffmpeg ser muito interessante, existe um fork dele que se chama avconv e é o projeto que está sendo continuado e é o novo manipulador de vídeos/imagens padrão para linux. Não estou usando neste caso mas se você estiver fazendo algo do gênero vale a pena dar uma olhada.

### Renomeando imagens

O ffmpeg não consegue entender a ordem se as imagens não tiverem um número de casas fixo, por exemplo:

    img1.jpg, img2.jpg,..., img10.jpg, img11.jpg

Neste caso, é necessário converter o nome das imagens para utilizar casa fixas como img001.jpg, img002.jpg.

Para renomear as imagens necessárias, eu fiz um script ruby para gerar os nomes corretamente e depois executei o comando com `| sh` pegando o puts diretamenten do `$stdout`.

    ruby -e "Dir['*.jpg'].each{|f|f =~ /img_(\d+).jpg/; g = \"img_#{'%04d' % \$1.to_i}.jpg\"; puts \"mv #{f} #{g}\" if f != g}" | sh

Este é o tipo de comando rápido que as vezes não tenho tanta agilidade e prática com shell para fazer o rename. Mas com ruby flui rapidamente e consigo avançar.

### Refactoring

Os nomes das variáveis não são os melhores então está um pouco estranho de entender. Abrindo o código acima temos:

<pre class="prettyprint">
 Dir['*.jpg'].each do |image|
   if image =~ /img\_(\d+).jpg/
     new_image_name = "img_#{'%04d' % \$1.to_i}.jpg"
     if new_image_name != image
       puts "mv #{image} #{new_image_name}" 
     end
   end
end
</pre>

Executando ruby e fazendo o pipeline para o shell temos o mesmo resultado de uma forma mais bonita:

    ruby converte.rb | sh


### Imagens com nomes diferentes

Se as suas imagens não tiverem um padrão de nomes também é possível utilizando o parâmetro `pattern_type glob`, veja o exemplo:

    ffmpeg -r 24 -pattern_type glob -i "*.jpg" out.mkv

### Veja um exemplo de vídeo

O vídeo abaixo é um timelapse de 120 fotos, uma foto a cada 64 segundos. Girando 1 grau para a direita. O framerate utilizado foi 24 fotos por segundo.

<video src="/images/motolapse.mp4"></video>

O vídeo foi gerado com o comando: `ffmpeg -r 24 -i deg%04d.jpg -c:v libx264 motolapse.mp4`.


