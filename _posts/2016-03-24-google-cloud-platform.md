---
  layout: post
  title: Google Cloud Platform
---

Após começar a me [interessar mais por Go Lang](/comecando-com-go-lang),
estou iniciando minha história com o [Google Cloud Platform](http://cloud.google.com).

E as primeiras impressões foram muito boas! Exatamente como a 6 anos atrás quando brincava no [google code playground](/google-code-playground/).

Eu sempre gostei muito dos produtos mas a parte de clouds ainda não tinha testado.

Inicialmente me atraí pois curti o terminal de acesso via web deles é bem descente e integrado. Estou
rodando com meu dotvim + fish redondo pela primeira vez me senti em casa como
no terminal mas rodando direto de uma cloud através de um browser \o/

Outra coisa que gostei foi dos comandos auxiliares para usar no console: `gcloud` e `gsutil`.

O `gcloud` é mais genérico e abrangente no gerenciamento geral da sua google
cloud enquanto o `gsutil` é para você fazer coisas relacionadas ao [Google Storage](https://cloud.google.com/storage/).

## Instalação do Google Cloud Platform

Para instalar o `gcloud` e `gsutil` digite na linha de comando:

    curl https://sdk.cloud.google.com | bash

Neste exemplo vou mostrar usando `gsutil` para manusear seus arquivos entre sua
máquina e o google :)

## Criando meu primeiro HD no google :)

Estou com meu bucket "jonatasdp" criado e agora vamos usufruir dele.

Um bucket funciona como uma partição de um HD em um servidor do google. O custo médio é 2 centavos de dólar por GB.

O comando [gsutil](https://cloud.google.com/storage/docs/gsutil) é bem parecido com o [aws s3](http://docs.aws.amazon.com/cli/latest/reference/s3/) do Amazon e tem a mesma finalidade: manipular buckets. Só que em um "google storage" :)

<script type="text/javascript" src="https://asciinema.org/a/40271.js"
id="asciicast-40271" async></script>

Lembre-se que antes de iniciar a interação com o `gsutil` você precisa fazer um `gcloud auth login`.
