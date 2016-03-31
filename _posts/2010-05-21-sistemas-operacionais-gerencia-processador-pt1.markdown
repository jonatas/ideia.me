---
 title: Sistemas Operacionais - Gerência do processador - parte 1
 layout: post
---

{% include ads_lateral.html %}

## O que é política de escalonamento de um sistema operacional?

Trata-se da abordagem utilizada pelo sistema operacionall para gerenciar o processador e tornar possível a multiprogramação do sistema operacional.

## Quais as funções do escalonador e do dispatcher?

O escalonador deve aplicar a política de escalonamento escolhida pelo S.O.

O dispatcher é responsável por realizar a troca de contexto.

## Quais os principais critérios utilizados pela política de escalonamento?

* Tempo de espera
* Tempo de resposta
* Tempo de turnaround 
* Tempo de cpu
* Utilização do processador

## Diferencie os tempos do processador, espera, turnaround e resposta

### Espera

Permanece na fila

### Turnaround

Tempo de vida do ciclo do processo desde sua criação até o término

### Tempo de resposta

Tempo entre a chamada e a resposta do CPU.

## Diferencie os escalonamentos preemptivos e não-preemptivos?

Preemptivo permite parar a execução de um processo e iniciar outro.

## Qual a diferença entre os escalonamentos FIFO e Circular?

O escalonamento FIFO procura primeiro terminar um processo antes de começar outro, enquanto o escalonamento circular, reserva um determinado tempo para que o processo circule compartilhando o mesmo momento com outros processos. O circular é do tipo preemptivo enquanto FIFO é First In First Out.

## Descreva o escalonamento SJF e o escalonamento por prioridades.

As prioridadse são baseadas no processo que tiver o menor tempo de processador e desta forma sempre serão executados nesta ordem. Esta política é preemptiva e está baseado na prioridade de execução.

## Qual a diferença entre preempção por tempo e preempção por prioridades?

A preempção por tempo visa iterromper os processos baseados no menor tempo de processo, enquanto quando basedo na prioridade visa processar a fila através do nível de prioridade.

## O que é um mecanismo de escalonamento adaptativo? 

Esta política busca ajustar dinamicamente qual é a ordem dos processos objetivando o balanceamento do uso do processador. 

## Que tipo de escalonamento aplicações de tempo real exigem? 

Estas aplicações Exigem respostas em tempo imediato.

## O escalonamento por múltiplas filas com realimentação favorece processos CPU-bound ou I/O-bound?Justifique

O processo de IO tem um tempo de espera curto e por isso podem subir para as filas com prioridade maior enquanto processos de CPU exigem mais cpu e podem ser intercaladas para favorecer o processo de IO.

## Considere que cinco processos sejam criados no instante de tempo 0 (P1, P2, P3, P4 e P5) e possuam as características descritas na tabela a seguir:

 Processo  | Tempo de UCP |  Prioridade
 ----------|--------------|-----------
     P1    |     10       |      3
     P2    |     14       |      4
     P3    |      7       |      2
     P4    |     20       |      5
                                                   
Desenhe um diagrama ilustrando o escalonamento dos processos e seus respectivos tempos de turnaround, segundo as políticas específicadas a seguir. O tempo de troca de contexto deve ser desconsiderado.

### FIFO

 Processo  | Tempo de UCP | Prioridade | Tempo
 ----------|--------------|------------|--------
     P1    |     10       |      3     |  10
     P2    |     14       |      4     |  24
     P3    |      7       |      2     |  31
     P4    |     20       |      5     |  51

### SJF

 Processo  | Tempo de UCP | Prioridade | Tempo
 ----------|--------------|------------|--------
     P3    |      7       |      2     |  7 
     P1    |     10       |      3     |  17
     P2    |     14       |      4     |  31
     P4    |     20       |      5     |  51


### Prioridade (número menor implica a prioridade maior)


 Processo  | Tempo de UCP | Prioridade | Tempo
 ----------|--------------|------------|--------
     P3    |      7       |      2     |  7
     P1    |     10       |      3     |  17
     P2    |     14       |      4     |  31
     P4    |     20       |      5     |  51

### Circular com fatia de tempo igual a 2 u.t.

 Processo  | Tempo de UCP |  Prioridade  | Tempo
 ----------|--------------|--------------|------
     P1    |     10       |      3       |  2
     P2    |     14       |      4       |  4 
     P3    |      7       |      2       |  6  
     P4    |     20       |      5       |  8 
     P1    |     8        |      3       |  10
     P2    |     12       |      4       |  12 
     P3    |      5       |      2       |  14  
     P4    |     18       |      5       |  16 
     P1    |     6        |      3       |  18
     P2    |     10       |      4       |  20
     P3    |      3       |      2       |  22  
     P4    |     16       |      5       |  24 
     P1    |     4        |      3       |  26
     P2    |     8        |      4       |  28
     P3    |     1        |      2       |  30  
     P4    |     14       |      5       |  32 
     P1    |     2        |      3       |  34
     P2    |     6        |      4       |  36
     P3    |     -        |      2       |  37  
     P4    |     12       |      5       |  39 
     P1    |     -        |      3       |  41
     P2    |     4        |      4       |  43
     P3    |     -        |      2       |  -  
     P4    |     10       |      5       |  45 
     P2    |     2        |      4       |  47
     P4    |     8        |      5       |  49 
     P2    |     -        |      4       |  51
     P4    |     6        |      5       |  53 
     P4    |     4        |      5       |  55 
     P4    |     2        |      5       |  57 
     P4    |     0        |      5       |  59 


Sendo assim os processos terminaram após os seguintes tempos:

Processo | Segundos
---------|---------
      P1 | 41
      P2 | 51
      P3 | 37
      P4 | 59

{% include adsense.html %}

