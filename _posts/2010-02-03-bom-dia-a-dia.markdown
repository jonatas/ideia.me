---
  layout: post 
  title: Bom dia a dia do desenvolvimento 
  categories: ['decisoes', 'oraclexe', 'postgresql', 'java', 'ferramentas', 'linux', 'mac'] 

---
<style>
 table, tr, td { border: 1px solid gray}
</style>

Após sair da Leosoft, logo consegui um free-lancer com a [ACP Tecnologia][acp] aqui em Francisco Beltrão mesmo. O trabalho vai ser integrar uma interface em flex com um background Java, e banco de dados Oracle XE. Mas aí surgiu a dúvida, trabalhar no Mac ou no Linux? 
As diferenças entre minhas máquinas Linux e Mac:

   o que     |     linux     | mac
-------------|---------------|-----
OracleXE     | Sim           | Não disponível
Java         | Não Instalado | Ok 
Eclipse      | Não Instalado | Ok 
Flex Builder | Não Instalado | Ok 

Como eu já tinha todo o ambiente configurado para trabalhar com Mac + Eclipse + Flex Builder, decidi primeiramente tentar instalar o Oracle XE, e também descobri que não existe uma versão para Mac, então busquei alternativas e encontrei [JeOS - Just enough OS][jeos], que é uma versão básica do debian, e apartir de uma máquina virtual, seria possível instalar ela e instalar o OracleXE como serviço.

Após horas (velocidade da internet: 256 kbs) baixando a imagem iso do [JeOS][jeos], máquinas virtuais (VMWare Fusion, Virtual Box), decidi por usar um adaptador para o banco de dados Postgresql. Uma mudança significativamente menor.


[jeos]: http://help.ubuntu.com/community/JeOSVMBuilder
[acp]: http://www.acptecnologia.com.br

