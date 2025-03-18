---
title: "Sistemas Operacionais - Gerência do processador - parte 1"
layout: post
description: "Entenda como os sistemas operacionais gerenciam o processador, aplicam políticas de escalonamento e garantem a multiprogramação para maximizar a eficiência do sistema."
categories: ['sistemas-operacionais', 'technical', 'aulas', 'processador']
toc: true
---

# Gerência do Processador em Sistemas Operacionais

A gerência do processador é uma das funções mais importantes de um sistema operacional moderno. Através de diferentes algoritmos e políticas de escalonamento, o sistema consegue compartilhar os recursos do CPU entre múltiplos processos, garantindo eficiência e responsividade.

## O que é política de escalonamento de um sistema operacional?

A política de escalonamento é a abordagem utilizada pelo sistema operacional para gerenciar o processador e tornar possível a multiprogramação. Ela define quais processos recebem tempo de processamento, por quanto tempo e em qual ordem, buscando atingir objetivos como:

- Maximizar a utilização do processador
- Minimizar o tempo de espera dos processos
- Garantir tratamento justo aos diferentes processos
- Priorizar processos críticos
- Equilibrar a responsividade do sistema

## Componentes do Sistema de Escalonamento

### Funções do escalonador

O escalonador é o componente do sistema operacional responsável por implementar a política de escalonamento escolhida. Suas principais funções incluem:

- Selecionar o próximo processo a ser executado
- Determinar por quanto tempo o processo selecionado poderá utilizar o processador
- Monitorar o comportamento dos processos para informar decisões futuras
- Manter filas de processos organizadas conforme a política adotada

### O papel do dispatcher

O dispatcher é responsável por realizar a troca de contexto entre os processos. Quando o escalonador decide que um novo processo deve ser executado, o dispatcher:

1. Salva o estado do processo atual (registradores, contador de programa, etc.)
2. Carrega o estado do próximo processo a ser executado
3. Transfere o controle do processador para o novo processo

A eficiência do dispatcher é crítica para o desempenho do sistema, pois a troca de contexto representa um overhead que não contribui diretamente para o processamento útil.

<pre class="process-diagram">
 +------------+
 | Created/New|
 +------------+
        |
        | admitted
        v
  +------------+             +------------+
  |   Ready    |<------------|   Waiting  |
  +------------+    I/O or   +------------+
        |          event           ^
        | dispatch  complete       |
        |                          | I/O or
        v                          | event wait
  +------------+             |     |
  |  Running   |-------------+     |
  +------------+                   |
        |                          |
        | exit                     |
        v                          |
  +------------+                   |
  | Terminated |                   |
  +------------+                   |
        
        +---------------+          |
        |  CPU Scheduler|----------+
        |  +-----------+|   time slice
        |  |Dispatcher |<----expired---+
        |  +-----------+|              |
        +---------------+              |
               |                       |
               | context switch        |
               v                       |
        +---------------+              |
        |  Process      |--------------+
        +---------------+
          
  Scheduling Algorithms:
  - FCFS (First-Come, First-Served)
  - SJF (Shortest Job First)
  - Priority Scheduling  
  - Round Robin
  - Multilevel Feedback Queue
</pre>

## Critérios de Avaliação das Políticas de Escalonamento

As políticas de escalonamento são avaliadas com base em diversos critérios, que podem ter pesos diferentes dependendo do tipo de sistema:

### Tempo de espera

O tempo total que um processo passa na fila de prontos aguardando para ser executado. Quanto menor o tempo de espera, melhor a experiência do usuário.

### Tempo de resposta

Tempo entre a solicitação de uma operação e o início da resposta. Este critério é particularmente importante em sistemas interativos, onde o usuário espera feedback rápido.

### Tempo de turnaround

Representa o tempo total de vida de um processo, desde sua criação até seu término. Este é um indicador importante da eficiência global do sistema.

### Tempo de CPU

Quantidade total de tempo de processador utilizada por um processo. Processos que exigem mais tempo de CPU são chamados de CPU-bound.

### Utilização do processador

Porcentagem de tempo em que o processador está efetivamente executando processos. Uma alta taxa de utilização é desejável para maximizar o retorno sobre o investimento em hardware.

## Modos de Escalonamento: Preemptivo vs. Não-preemptivo

O escalonamento pode ser classificado em dois tipos principais, com características e aplicações distintas:

### Escalonamento Não-preemptivo

No escalonamento não-preemptivo, quando um processo recebe o controle do processador, ele mantém esse controle até:
- Terminar sua execução
- Realizar uma operação de I/O
- Liberar voluntariamente o processador

**Vantagens:**
- Implementação mais simples
- Menor overhead de troca de contexto
- Previsibilidade

**Desvantagens:**
- Pode causar inanição (starvation) de processos
- Tempos de resposta menos consistentes
- Processos longos podem monopolizar o processador

### Escalonamento Preemptivo

No escalonamento preemptivo, o sistema operacional pode interromper a execução de um processo e conceder o processador a outro, mesmo que o primeiro não tenha terminado ou solicitado uma operação de I/O.

**Vantagens:**
- Melhor distribuição do tempo de processador
- Tempos de resposta mais consistentes
- Maior justiça entre processos

**Desvantagens:**
- Maior complexidade de implementação
- Overhead adicional de troca de contexto
- Possíveis problemas de sincronização

## Algoritmos de Escalonamento

### FIFO (First-In, First-Out)

Também conhecido como FCFS (First-Come, First-Served), este é o algoritmo mais simples, onde os processos são executados na ordem em que chegam.

**Características:**
- Não-preemptivo
- Fácil implementação
- Favorece processos que chegaram primeiro
- Pode resultar em tempo de espera elevado se processos longos chegarem primeiro

### Escalonamento Circular (Round Robin)

O algoritmo Round Robin atribui a cada processo um intervalo de tempo fixo (quantum), executando-os em ciclos. Se um processo não termina dentro do seu quantum, ele volta para o final da fila.

**Características:**
- Preemptivo
- Distribui o tempo de processador igualmente
- Tempo de resposta proporcional ao número de processos
- O desempenho depende fortemente do tamanho do quantum

### SJF (Shortest Job First)

Neste algoritmo, o processo com o menor tempo estimado de execução é selecionado primeiro.

**Características:**
- Pode ser preemptivo (SRTF - Shortest Remaining Time First) ou não-preemptivo
- Minimiza o tempo médio de espera
- Requer estimativa prévia do tempo de execução
- Pode causar inanição de processos longos

### Escalonamento por Prioridades

Cada processo recebe uma prioridade, e o processo com maior prioridade é executado primeiro.

**Características:**
- Pode ser preemptivo ou não-preemptivo
- Permite diferenciar a importância dos processos
- Flexível e adaptável a diferentes contextos
- Pode causar inanição de processos de baixa prioridade

## Diferenças entre Tipos de Preempção

### Preempção por Tempo

Na preempção por tempo, um processo é interrompido após utilizar o processador por um tempo predeterminado (quantum). Este é o mecanismo utilizado no algoritmo Round Robin.

### Preempção por Prioridades

Na preempção por prioridade, um processo é interrompido quando um processo de maior prioridade se torna disponível para execução, independentemente de quanto tempo o processo atual já utilizou o processador.

## Escalonamento Adaptativo

O mecanismo de escalonamento adaptativo busca ajustar dinamicamente a política de escalonamento ou seus parâmetros com base no comportamento observado do sistema. Os objetivos incluem:

- Balancear a utilização do processador
- Responder a mudanças na carga de trabalho
- Otimizar para diferentes tipos de processos (I/O-bound vs. CPU-bound)
- Adequar-se às necessidades do usuário ou aplicação

Sistemas modernos frequentemente implementam políticas adaptativas que combinam elementos de diferentes algoritmos básicos.

## Escalonamento para Sistemas de Tempo Real

Aplicações de tempo real exigem respostas dentro de prazos (deadlines) predefinidos. O escalonamento para estes sistemas tem características específicas:

- Processos têm prazos explícitos que devem ser cumpridos
- A previsibilidade é mais importante que a eficiência média
- Podem ser classificados em:
  - **Tempo real rígido (hard real-time)**: Perder um prazo causa falha do sistema
  - **Tempo real flexível (soft real-time)**: Perder um prazo reduz a qualidade do serviço, mas não causa falha

Os algoritmos típicos para sistemas de tempo real incluem EDF (Earliest Deadline First) e RMS (Rate Monotonic Scheduling).

## Escalonamento por Múltiplas Filas com Realimentação

O escalonamento por múltiplas filas com realimentação (Multilevel Feedback Queue) é um dos algoritmos mais sofisticados e amplamente utilizados em sistemas operacionais modernos.

### Como funciona:

1. Processos são organizados em múltiplas filas, cada uma com um nível de prioridade
2. Cada fila pode ter seu próprio algoritmo de escalonamento
3. Processos podem ser movidos entre filas com base em seu comportamento

### Favorecimento de processos:

Este algoritmo favorece processos I/O-bound sobre processos CPU-bound, porque:

- Processos I/O-bound tipicamente têm surtos curtos de CPU seguidos por operações de I/O
- Quando terminam seu pequeno tempo de CPU, eles são bloqueados para I/O
- Ao retornarem da operação de I/O, frequentemente são colocados em filas de maior prioridade
- Processos CPU-bound tendem a usar todo seu quantum e são movidos para filas de menor prioridade

Esta abordagem melhora a responsividade do sistema e a utilização global dos recursos, pois mantém tanto o CPU quanto os dispositivos de I/O ocupados.

## Exemplos Práticos de Escalonamento

Vamos analisar como diferentes algoritmos de escalonamento processariam um conjunto de processos com as seguintes características:

### Informações dos processos:

 Processo  | Tempo de UCP |  Prioridade
 ----------|--------------|-----------
     P1    |     10       |      3
     P2    |     14       |      4
     P3    |      7       |      2
     P4    |     20       |      5

### FIFO (First-In, First-Out)

Os processos são executados na ordem em que chegam:

 Processo  | Tempo de UCP | Prioridade | Tempo de Conclusão
 ----------|--------------|------------|--------
     P1    |     10       |      3     |  10
     P2    |     14       |      4     |  24
     P3    |      7       |      2     |  31
     P4    |     20       |      5     |  51

Tempo médio de turnaround: (10 + 24 + 31 + 51) / 4 = 29 unidades de tempo

### SJF (Shortest Job First)

Os processos são executados em ordem crescente de tempo de CPU:

 Processo  | Tempo de UCP | Prioridade | Tempo de Conclusão
 ----------|--------------|------------|--------
     P3    |      7       |      2     |  7 
     P1    |     10       |      3     |  17
     P2    |     14       |      4     |  31
     P4    |     20       |      5     |  51

Tempo médio de turnaround: (7 + 17 + 31 + 51) / 4 = 26.5 unidades de tempo

### Escalonamento por Prioridade

Os processos são executados em ordem crescente de número de prioridade (número menor significa maior prioridade):

 Processo  | Tempo de UCP | Prioridade | Tempo de Conclusão
 ----------|--------------|------------|--------
     P3    |      7       |      2     |  7
     P1    |     10       |      3     |  17
     P2    |     14       |      4     |  31
     P4    |     20       |      5     |  51

Tempo médio de turnaround: (7 + 17 + 31 + 51) / 4 = 26.5 unidades de tempo

### Circular (Round Robin) com quantum = 2

Cada processo recebe 2 unidades de tempo de CPU antes de ser preemptado:

 Processo  | Tempo Restante |  Prioridade  | Tempo Atual | Tempo de Conclusão
 ----------|----------------|--------------|-------------|------------------
     P1    |     10 → 8     |      3       |  2          | 
     P2    |     14 → 12    |      4       |  4          | 
     P3    |      7 → 5     |      2       |  6          |  
     P4    |     20 → 18    |      5       |  8          | 
     P1    |      8 → 6     |      3       |  10         | 
     P2    |     12 → 10    |      4       |  12         | 
     P3    |      5 → 3     |      2       |  14         |  
     P4    |     18 → 16    |      5       |  16         | 
     P1    |      6 → 4     |      3       |  18         | 
     P2    |     10 → 8     |      4       |  20         | 
     P3    |      3 → 1     |      2       |  22         |  
     P4    |     16 → 14    |      5       |  24         | 
     P1    |      4 → 2     |      3       |  26         | 
     P2    |      8 → 6     |      4       |  28         | 
     P3    |      1 → 0     |      2       |  30         | P3 concluído em t=30
     P4    |     14 → 12    |      5       |  32         | 
     P1    |      2 → 0     |      3       |  34         | P1 concluído em t=34
     P2    |      6 → 4     |      4       |  36         | 
     P4    |     12 → 10    |      5       |  38         | 
     P2    |      4 → 2     |      4       |  40         | 
     P4    |      8 → 6     |      5       |  42         | 
     P2    |      2 → 0     |      4       |  44         | P2 concluído em t=44
     P4    |      6 → 4     |      5       |  46         | 
     P4    |      4 → 2     |      5       |  48         | 
     P4    |      2 → 0     |      5       |  50         | 
     P4    |      0 → 0     |      5       |  52         | P4 concluído em t=52

Tempo de conclusão de cada processo:

Processo | Tempo de Conclusão
---------|------------------
   P1    | 34
   P2    | 44
   P3    | 30
   P4    | 52

Tempo médio de turnaround: (34 + 44 + 30 + 52) / 4 = 40 unidades de tempo

### Comparação dos Resultados

Algoritmo | Tempo Médio de Turnaround
----------|-------------------------
FIFO      | 29.0
SJF       | 26.5
Prioridade| 26.5
Round Robin (q=2) | 40.0

Neste exemplo específico, os algoritmos SJF e Prioridade produziram os melhores resultados em termos de tempo médio de turnaround. No entanto, é importante lembrar que o desempenho de cada algoritmo varia dependendo das características da carga de trabalho e dos objetivos do sistema.

## Considerações Finais

A escolha da política de escalonamento deve considerar as características e objetivos do sistema:

- **Sistemas Interativos**: Priorizam tempos de resposta baixos (Round Robin, Múltiplas Filas)
- **Sistemas Batch**: Priorizam throughput e utilização do CPU (SJF)
- **Sistemas de Tempo Real**: Priorizam cumprimento de prazos (EDF, RMS)
- **Sistemas de Propósito Geral**: Buscam equilíbrio usando abordagens adaptativas (Múltiplas Filas com Realimentação)

Os sistemas operacionais modernos tipicamente implementam algoritmos híbridos que combinam características de múltiplas abordagens para atingir um bom desempenho em diversos cenários.

{% include adsense.html %}
{% include ads_lateral.html %}

