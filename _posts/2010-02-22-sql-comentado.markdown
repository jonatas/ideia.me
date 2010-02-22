---
 layout: ideiame
 title: A linguagem SQL
 categories: postgresql
 dirbase: /../../..
---

# Um projeto de SQL comentado

Apesar de não ser um fã de desenvolvimento orientado a banco de dados, à dois anos atrás [trabalhei em um ensaio do TCC][appointme], em cima de um projeto sem BD.

Entreguei o projeto com alegria no último bimestre, mas descobri que a matéria de Banco de Dados II iria cobrar um banco de dados referente ao projeto anterior. Sendo esta a própria avaliação do quarto bimestre, resolvi criar um banco de dados de exemplo, usando um número razoável de recursos do SGBD, para auxiliar do "desenvolvimento" do projeto.

Como meu projeto não concebia um banco de dados, abordei um exemplo de um ponto de encontro, o qual meninos e meninas podem sentar-se em casal em uma mesa. Este bd tem a seguinte estrutura:

![der-bd]

Depois, organizei a criação começando pela criação do DATABASE.

ps: Lembrando que as linhas que começão com **- -** são comentários.
ps2: O objetivo deste post, é mostrar alguns recursos do banco de dados, sendo este apenas um simples exemplo.

## CREATE DATABASE 

<div><pre class="prettyprint lang-sql">
-- Banco de dados 
-- Conectando com o banco template1 e usuário postgres
-- para criar o usuario e o banco de dados.
\c template1 postgres

-- dropando banco de dados e objetos existentes.
DROP DATABASE IF EXISTS ponto_de_encontro;
DROP USER     IF EXISTS ponto_de_encontro;

-- recriando o usuario 
CREATE USER ponto_de_encontro SUPERUSER;

-- conectando com o usuario dono do banco 
-- e que irá criá-lo para já entrar como dono do banco.
\c template1 ponto_de_encontro

-- criando o banco
CREATE DATABASE ponto_de_encontro;
\c ponto_de_encontro ponto_de_encontro

-- criando a linguagem plpgsql que iremos utilizar nas triggers
CREATE LANGUAGE plpgsql;
</pre></div>

## CREATE DOMAIN

Os domínios, são tipos de dados próprios que permitem extender os tipos de colunas, e a vantagem de usar domínio, é a refatoração do banco. Por exemplo, o domínio abaixo, garante que qualquer tabela que tenha uma coluna do tipo masculino_ou_feminino irá aceitar apenas as letras 'M', 'm', 'F', 'f'. Se decidir por mudar para 'masculino' e 'feminino', é possível apenas trocar o domínio, e todas as colunas que fazem referência a este domínio serão compátiveis.

<div><pre class="prettyprint lang-sql">
-- Tipo de dado para usar em pessoa   
CREATE DOMAIN masculino_ou_feminino AS CHAR CHECK ( VALUE ~ '[mMfF]' );
</pre></div>

## CREATE TABLE

As tabelas são interessantes por serem criadas com várias opções default, por exemplo **SERIAL PRIMARY KEY** irá criar implicitamente uma sequência para o campo que receber este tipo.

<div><pre class="prettyprint lang-sql">
-- criando a tabela pessoa que será populado por meninos e meninas
CREATE TABLE pessoas (
  id SERIAL PRIMARY KEY,  
 nome VARCHAR,
 conversando BOOLEAN DEFAULT FALSE,
 sexo masculino_ou_feminino 
);

-- criando as mesas do ponto de encontro
CREATE TABLE mesas (
 id SERIAL PRIMARY KEY,
 descricao VARCHAR,
 ocupada BOOLEAN DEFAULT false);

-- uma conversa é a ocasião em que estão alocando uma mesa um menino e uma menina
-- isso pode acontecer se a mesa não estiver ocupada e o menino e a menina
-- não estiverem conversando em outras mesas.
CREATE TABLE conversas ( 
 id SERIAL PRIMARY KEY, 
 mesa_id INTEGER NOT NULL,
 menina_id INTEGER NOT NULL,
 menino_id INTEGER NOT NULL,
 iniciou_em TIMESTAMP DEFAULT now(),
 terminou_em TIMESTAMP,

 CONSTRAINT mesa_existente
    FOREIGN KEY (mesa_id) REFERENCES mesas(id),

 CONSTRAINT menina_existente 
  FOREIGN KEY (menina_id) REFERENCES pessoas (id),

 CONSTRAINT menino_existente 
  FOREIGN KEY (menino_id) REFERENCES pessoas(id)

);
</pre></div>

## CREATE VIEW

Após a criação da estrutura das tabelas, é criado as **views** para evitar a repetição de SQL. Através das visões, é possível manter um SQL Limpo e fácil de fazer a manutenção.

<div><pre class="prettyprint lang-sql">
-- as meninas são diferenciadas pelo sexo 'F'eminino
CREATE OR REPLACE VIEW meninas AS SELECT * FROM pessoas WHERE sexo='F';

-- os meninos são diferenciados pelo sexo 'M'asculino
CREATE OR REPLACE VIEW meninos AS SELECT * FROM pessoas WHERE sexo='M';

-- view para vizualizar todas as mesas que estão ocupadas
-- e quem está conversando nelas, e detalhes. 
-- esta view é semelhante é o próprio status do local.
CREATE OR REPLACE VIEW conversas_acontecendo AS 
SELECT meninas.nome        AS menina,
       meninas.id          AS menina_id,
         mesas.descricao   AS mesa,
       meninos.nome        AS menino,
       meninos.id          AS menino_id,
     conversas.iniciou_em  AS desde
  FROM conversas  
  LEFT JOIN mesas   ON conversas.mesa_id = mesas.id
  LEFT JOIN meninas ON conversas.menina_id = meninas.id
  LEFT JOIN meninos ON conversas.menino_id = meninos.id
  WHERE terminou_em is NULL;
</pre></div>

## CREATE FUNCTION 

Criando as views, foi muito útil para a filtragem de resultados e união de consultas. As funções, permitem a execução de SQL, e também permitem o recebimento de parâmetros. Os parâmetros são idêntificados por **$1**, **$2** e assim para cada parâmetro seguinte.

<div><pre class="prettyprint lang-sql">

-- Verifica se uma mesa está ocupada(resultado true) com pessoas conversando 
-- ou livre e pronta para ser usada(resultado false).
CREATE OR REPLACE FUNCTION mesa_ocupada(INTEGER) RETURNs BOOLean 
  AS 'SELECT true FROM conversas 
       WHERE current_date &lt; iniciou_em 
         AND terminou_em is NULL 
         AND mesa_id = $1'
  LANGUAGE SQL IMMUTABLE;

-- Verifica se uma mesa está ocupada(resultado true) com pessoas conversando 
-- ou livre e pronta para ser usada(resultado false).
CREATE OR REPLACE FUNCTION esta_conversando(INTEGER) RETURNs BOOLean 
  AS 'SELECT conversando FROM pessoas WHERE id = $1'
  LANGUAGE SQL IMMUTABLE;

</pre></div>

Depois disso, é necessário inserir as triggers para que cada evento tenha seu determinado efeito:

<div><pre class="prettyprint lang-sql">
-- trigger para ocupar a mesa quando uma 
-- nova mesa for locada por uma menina e um menino
-- para uma conversa e enquanto a conversa não for terminada.
CREATE OR REPLACE FUNCTION ocupar_mesa_TRIGGER() 
   RETURNS TRIGGER AS $ocupar_mesa$

   BEGIN 
    -- lançando as possiveis excessoes
    IF esta_conversando(new.menino_id) THEN
     RAISE EXCEPTION 'Este menino já está conversando';
    END IF;


    IF esta_conversando(new.menina_id) THEN
     RAISE EXCEPTION 'Este menina já está conversando';
    END IF;

    IF mesa_ocupada(new.mesa_id) THEN
       RAISE EXCEPTION 'Esta mesa já está sendo usada!';
    END IF;

    UPDATE mesas SET ocupada=true WHERE id=new.mesa_id;
    UPDATE pessoas SET conversando=true WHERE id IN(new.menina_id, new.menino_id);

    RETURN new;
   END;
$ocupar_mesa$ 
LANGUAGE plpgsql;


-- Trigger responsável por desocupar uma mesa quando 
-- uma conversa for finalizada.
CREATE OR REPLACE FUNCTION desocupar_mesa_TRIGGER() 
   RETURNS TRIGGER AS $desocupar_mesa$
   BEGIN
    IF old.terminou_em IS NULL AND new.terminou_em IS NULL THEN 
      UPDATE mesas   SET ocupada=false WHERE id=new.mesa_id;
      UPDATE pessoas SET conversando=false WHERE id IN(new.menina_id, new.menino_id);
    END IF;
    RETURN new;
   END;
$desocupar_mesa$ 
LANGUAGE plpgsql;
-- quando for inserida uma nova conversa
-- duas pessoas: um menino e uma menina 
-- estarão ocupando uma mesa, então a mesa
-- ficará ocupada.
CREATE TRIGGER ocupar_mesa 
       before INSERT ON conversas 
       FOR EACH ROW EXECUTE PROCEDURE ocupar_mesa_TRIGGER();

-- quando estes sairem da mesa
-- devera mudar o status da mesa
-- para desocupada.
CREATE TRIGGER desocupar_mesa 
       after UPDATE ON conversas FOR EACH ROW EXECUTE PROCEDURE desocupar_mesa_TRIGGER();
</pre></div>

## CREATE RULE

Criar regras no banco de dados, se torna uma mão na roda para tornas as coisas simples. Através de uma regra, é possível fazer um **INSERT** em uma **VIEW** e pegar o resultado do insert e distribuir entre a(s) tabela(s) desejadas.

<div><pre class="prettyprint lang-sql">
-- regra para ficar mais amigável a inserção de meninos
-- na tabela de pessoas e para isso trocaremos o uso de:
-- -- INSERT INTO pessoas (nome, sexo) VALUES ('joaozinho', 'M');
-- é só utilizar:
-- -- INSERT INTO meninos (nome) VALUES ('joaozinho');
CREATE OR REPLACE RULE insere_menino_em_pessoa AS ON INSERT TO meninos
        DO  INSTEAD  INSERT INTO pessoas (nome, sexo) VALUES (new.nome, 'M'); 

-- regra para ficar mais amigável a inserção de meninas
-- na tabela de pessoas e para isso trocaremos o uso de:
-- -- INSERT INTO pessoas (nome, sexo) VALUES ('mariazinha', 'F');
-- é só utilizar:
-- -- INSERT INTO meninas (nome) VALUES ('mariazinha');
CREATE OR REPLACE RULE insere_menina_em_pessoa AS ON INSERT TO meninas
        DO  INSTEAD  INSERT INTO pessoas (nome, sexo) VALUES (new.nome, 'F'); 
</pre></div>


## INSERT INTO 

Após a estrutura e as triggers prontas, é possível inserir alguns dados para teste, e executar algumas consultas para garantir a consistência. (Nesta época eu ainda não conhecia pgUnit).


<div><pre class="prettyprint lang-sql">
-- Populando com dados para teste.
-- Note a diferença na sintaxe para aproveitar e 
-- inserir várias meninas ao mesmo tempo.
-- Note também que a regra foi construída para CADA LINHA (EACH ROW)
-- e isso torna a regra válida e insere uma menina ou menino
-- para CADA LINHA e não para CADA DECLARAÇAO (EACH STATEMENT)
INSERT INTO meninas (nome) VALUES ('jennifer'),('mary'),('gorete');
INSERT INTO meninos (nome) VALUES ('jonatas'),('pedro'),('marcio'),('joao');

INSERT INTO mesas (descricao)
VALUES ('a1'),('b1'),('12 proximo a janela'),('13 corredor');

SELECT 'problema na funcao ocupar_mesa' 
  FROM mesas WHERE NOT mesa_ocupada(1);

SELECT 'problema na funcao mesa_ocupada e nao deve estar ocupada' 
  FROM mesas WHERE mesa_ocupada(2);

INSERT INTO conversas (menina_id, menino_id, mesa_id) VALUES (1,1,1);

SELECT 'a mesa 1 deve estar ocupada' FROM mesas WHERE id = 1 AND NOT ocupada;

SELECT 'precisa lancar 4 excecoes seguidas';
-- menina ocupada  
INSERT INTO conversas (menina_id, menino_id, mesa_id) VALUES (1,1,1);
-- mesa nao existe 
INSERT INTO conversas (menina_id, menino_id, mesa_id) VALUES (2,2,9);
-- menino nao existe
INSERT INTO conversas (menina_id, menino_id, mesa_id) VALUES (3,9,2);
-- menina nao existe
INSERT INTO conversas (menina_id, menino_id, mesa_id) VALUES (9,2,2);
</pre></div>

Bom, apesar do exemplo ser simples, foi possível mostrar algumas funcionalidades do banco PostgreSql, que muitas vezes, estes pequenos códigos se tornam úteis e interessantes!

[der-bd]: /images/der_ponto_de_encontro.jpg
[appointme]: http://github.com/jonatas/appointme
