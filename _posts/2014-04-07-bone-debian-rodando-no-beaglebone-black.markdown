---
  layout: post
  categories: [beaglebone debian]
  title: Bone Debian rodando no BeagleBone Black
---

Após alguns dias me adaptando ao Angstrom, aqui estou eu tentando instalar o Debian no meu Beaglebone.

Comprei a alguns dias e o Angstrom está com um problema relacionado ao Hot Plugging e não consigo acessar todas as vezes que ligo ele via usb.

Desta forma, tive que comprar um cabo TTL Serial para assistir o boot do sistema via porta serial. Via screen funcionou perfeito e então identifiquei algumas mensagens de erro no beaglebone. Agora minha expectativa de instalar o Bone Debian é poder voltar a usar normalmente apenas via USB sem ter o inconveniente de usar o cabo TTL ou ter que manter conectado no cabo de rede.

##  Conferindo o nome do disco sdcard

No mac utilizei o aplicativo diskutil para descobrir qual era o meu sdcard.

    ➜ diskutil list
    /dev/disk0
    #:                       TYPE NAME                    SIZE       IDENTIFIER
    0:      GUID_partition_scheme                        *500.1 GB   disk0
    1:                        EFI EFI                     209.7 MB   disk0s1
    2:                  Apple_HFS Macintosh HD            499.2 GB   disk0s2
    3:                 Apple_Boot Recovery HD             650.0 MB   disk0s3
    /dev/disk1
    #:                       TYPE NAME                    SIZE       IDENTIFIER
    0:     FDisk_partition_scheme                        *7.8 GB     disk1
    1:                 DOS_FAT_32 BONE DEBIAN             7.8 GB     disk1s1


## Formatar o sdcard

Utilizei o próprio aplicativo "Utilitário de disco" que vem instalado no Mac para formatar o disco. Utilizei a extensão MSDOS-FAT convencional.

## Instalar imagem no cartão

Para instalar o nova imagem do sistema eu usei um sdcard de 8GB.

No meu macbook eu baixei a [imagem](http://debian.beagleboard.org/images/bone-debian-7.4-2014-03-27-2gb.img.xz) com extensão .img.xz então tive que utilizar um programa chamado xz para descompactar a imagem:

    brew install xz

Depois disso descompactei a imagem no disco:

    xz -dkv bone-debian-7.4-2014-03-27-2gb.img.xz 

E após isso usei o aplicativo dd para escrever a imagem no sdcard.

    ➜ sudo dd bs=1m if=./bone-debian-7.4-2014-03-27-2gb.img of=/dev/disk1


Se você receber uma mensagem como esta:

    dd: /dev/disk1: Resource busy

Então é melhor desmontar o disco antes de executar o comando dd.

    sudo umountDisk /dev/disk1


Após terminar de escrever a imagem de 1,7 GB você deve ver uma mensagem assim:

    1700+0 records in
    1700+0 records out
    1782579200 bytes transferred in 1476.053213 secs (1207666 bytes/sec)


Aqui demorou aproximadamente 24 minutos e depende da velocidade do sdcard e do tamanho da imagem para efetuar a gravação.

Neste momento você pode ejetar o sdcard e remover o sdcard com segurança para colocar no Beaglebone.

Ao reiniciar o beaglebone black e reconectar observei o boot via TTL:


    Debian GNU/Linux 7 beaglebone ttyO0

    default username:password is [debian:temppwd]

    Support/FAQ: http://elinux.org/Beagleboard:BeagleBoneBlack_Debian

    The IP Address for usb0 is: 192.168.7.2

Fazendo o login via ssh:

    ➜  ~  ssh debian@192.168.7.2 
    The authenticity of host '192.168.7.2 (192.168.7.2)' can't be established.
    RSA key fingerprint is 20:8e:11:cb:98:2b:b1:f1:56:ec:3c:1a:2a:d4:e8:e5.
    Are you sure you want to continue connecting (yes/no)? yes
    Warning: Permanently added '192.168.7.2' (RSA) to the list of known hosts.
    Debian GNU/Linux 7

    BeagleBoard.org BeagleBone Debian Image 2014-03-27

    Support/FAQ: http://elinux.org/Beagleboard:BeagleBoneBlack_Debian
    debian@192.168.7.2's password: 
    debian@beaglebone:~$ ls
    sudo bin
    debian@beaglebone:~$ sudo su

    We trust you have received the usual lecture from the local System
    Administrator. It usually boils down to these three things:

    #1) Respect the privacy of others.
    #2) Think before you type.
    #3) With great power comes great responsibility.

    [sudo] password for debian:
    root@beaglebone:/home/debian#

Gostei das lições do administrador :)

