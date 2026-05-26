# Salon System Fullstack

Este repositório contém a solução Fullstack para o sistema de gestão e agendamentos do salão de beleza. A aplicação é dividida em duas partes independentes: o backend em **Spring Boot** (Java) e o frontend em **Angular**.

---

## Como Executar a Aplicação

Para rodar o projeto completo na sua máquina local, certifique-se de que o banco de dados MySQL está ativo e siga os passos abaixo abrindo **dois terminais diferentes**.

### Terminal 1: Backend & Banco de Dados (Docker)

Navegue até o diretório raiz (ou onde está o seu arquivo `docker-compose.yml`) e inicialize os containers do ecossistema do servidor:

```bash
docker compose up -d --build
```

* O comando baixará as imagens, criará a rede isolada, subirá o banco MySQL e inicializará a API Spring Boot.
* O Flyway executará as migrações e o versionamento do banco de dados automaticamente na inicialização do container.

### Terminal 2: Frontend (Angular)

Navegue até a pasta da interface, instale as dependências caso necessário, e inicie o servidor:

```bach
cd beauty-salon-front
npm install
ng serve
```

* O frontend será carregado na porta **http://localhost:4200**.
* Acesse http://localhost:4200/ no navegador para utilizar o sistema.

---

## Rodando os Testes Unitários

Caso queira validar os fluxos e travas de segurança através dos testes automatizados desenvolvidos:

### Frontend (Vitest)

No diretório do frontend, utilize o atalho do npm para disparar o motor do Vitest:

```bach
cd beauty-salon-front
ng test
```

---

## Principais Tecnologias Utilizadas

### Backend

* **Java 21** & **Spring Boot 3.4.3**
* **Spring Data JPA** & **Hibernate**
* **Flyway Migration** (Gerenciamento de banco de dados)
* **MySQL** (Produção/Desenvolvimento) & **H2 Database** (Escopo de Testes)
* **Lombok** & **Spring Validation**

### Frontend

* **Angular** (Componentes Standalone e Roteamento SPA)
* **Angular Signals** (Gerenciamento reativo de estado de alta performance)
* **Reactive Forms** (Validação reativa e assíncrona de formulários)
