---
title: "Timelapse girando no Raspberry PI"
layout: post
categories: ['python', 'raspberry pi']
description: "A internet das coisas está aí! Então também decidi entrar para o mundo dos embarcados e conectar algumas dessas coisas :)"
---
A [internet das coisas](http://pt.wikipedia.org/wiki/Internet_das_Coisas) está aí! Então também decidi entrar para o mundo dos embarcados e conectar algumas dessas coisas :)

Inicialmente comprei um beaglebone e agora um raspberry pi.

Estou me aprofundando nestas tecnologias pois acredito que o futuro exige que migramos grande parte dos nossos sistemas para a nuvem e dispositivos embarcados.

Desta forma, na nuvem eu já estou trabalhando, e agora quero trabalhar com a conexão destes aparelhos e sensores diversos que estão surgindo.

A alguns dias comprei um Raspberry PI (RPI) e agora estou iniciando uma série de experimentos com dispositivos embarcados.

## O Raspberry PI

O RPI é um computador do tamanho de um cartão de crédito com saída HDMI, roda linux e tem uma série de pinos extras permitindo conectar sensores diversos através de uma estrutura de genérica de entrada e saída GPIO: General-purpose input/output.

{% instagram liZyFjnfaR %}

## A Raspi CAM

Também comprei a camera oficial e ontem fiz funcionar com um motor para girar a câmera e fazer um timelapse.

{% instagram ltELezHfQ4 %}


Essa camera é muito boa e fácil de usar. Para utilizar ela via código em python, tive que instalar uma biblioteca com um nome sugestivo: `python-camera`

    sudo apt-get install python-camera

Depois disso é só utilizar no código diretamente:

<pre class="prettyprint">
with picamera.PiCamera() as camera:
    camera.capture('pic.jpeg')
</pre>

Também dá pra manipular a camera e as propriedades como brilho, contraste ou foco.

<pre class="prettyprint">
with picamera.PiCamera() as camera:
    camera.brightness = 50
    camera.contrast = 70
</pre>  

Além disso também dá pra pré-visualizar e gravar vídeos.

<pre class="prettyprint">
with picamera.PiCamera() as camera:
    camera.preview()
    camera.start_recording('myvideo.h264')
    camera.stop_recording()
</pre>

Além deste programa ainda existe um programa na linha de comando que dá para gravar vídeos ou tirar fotos. As fotos também podem ser tiradas em sequência para fazer um timelapse.

## O motor

E também comprei um motor de passo para girar a camera.

{% instagram l_br0enfb5 %}

Este motor é um 28BYJ-48 e está conectado com um módulo ULN2003. Utilizei um código já existente para controlar o motor em angulo de graus. Basicamente o motor dá 4096 passos para executar uma volta completa então utilizei uma classe para mapear os movimentos utilizando graus.

Para garantir que não iria tirar fotos e girar a camera ao mesmo tempo escrevi um script simples que interopera entre a camera e o motor.

Funcionou legal e é muito simples de trabalhar.

Usei uma [classe Motor](http://blog.scphillips.com/2012/12/a-python-class-to-move-the-stepper-motor/) para abstrair a rotação do motor e agora só falta adicionar um fator tempo para poder dizer:

    Quero que gire 180 graus em 6 horas.

Para girar o motor basta importar a classe e usar o método `move_to(angle)`.

<pre class="prettyprint">
from motor import Motor

GPIO.setmode(GPIO.BCM)

PINS_ON_ULN = [17,18,23,22]

motor = Motor(PINS_ON_ULN)
motor.rpm = 1
motor.move_to(90)
</pre>

## Impressora 3D

A engrenagem encontrei na internet e imprimi na impressora 3d. Se quiser baixar o modelo pode ser encontrado [aqui no thingverse](http://www.thingiverse.com/thing:258646).

Também imprimi um [suporte](http://www.thingiverse.com/thing:128617) para a camera rpi que coicidentemente encaixou na engrenagem.

Veja o vídeo da câmera rodando:


{% instagram mSUDgXJzmE %}

## Primeiro timelapse girando

Então mesmo fiz o primeiro timelapse girando. 180 graus em 4 horas. Girou apenas 120 depois a camera descolou e a camera ficou pendurada.

<video src="/images/motolapse.mp4"></video>

Neste caso girou um grau e tirou uma foto, aguardou 64 segundos, girou mais um grau e seguiu repetindo o processo.
