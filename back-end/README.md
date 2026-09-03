# CadêMetrô — Back-End (MVP)

Backend REST API e streaming em tempo real (SSE) para a rede colaborativa de passageiros do Metrô de Recife.

Construído com **NestJS 12**, **Prisma Next** (`@prisma/orm-postgres`), **PostgreSQL 16**, **RxJS** para streaming de eventos e **Vitest** para testes.

---

## Funcionalidades do MVP

- **Metro Infrastructure (`MetroModule`)**:
  - `GET /lines`: Lista linhas e direções (Linha 1–Azul, 2–Verde, 3–Vermelha, 4–Amarela).
  - `GET /lines/:id`: Detalhes da linha com estações ordenadas.
  - `GET /stations`: Lista de estações com coordenadas geográficas e linhas associadas.
  - `GET /stations/:id`: Detalhes de uma estação.
- **Autenticação & Contas (`AuthModule`)**:
  - `POST /auth/register`: Cadastro com e-mail, senha (mínimo 8 caracteres) e perfil.
  - `POST /auth/login`: Autenticação e emissão de JWT (acesso de 1 hora).
  - `GET /auth/me`: Perfil do usuário autenticado com `trustScore` calculado dinamicamente.
- **Relatos Colaborativos (`ReportsModule`)**:
  - `POST /reports`: Criação de relatos operacionais (`TRAIN_*`, `OPERATIONAL_RESTRICTION`, `SERVICE_INTERRUPTION`, `NORMAL_OPERATION`) com validação estrita de escopo por tipo.
  - `GET /reports/recent`: Consulta paginada dos relatos mais recentes (ordenação decrescente por data, filtros por linha/estação/direção).
  - `GET /reports/:id`: Detalhe do relato com contadores de confirmação/contestação e confiabilidade calculada.
  - `POST /reports/:id/confirm`: Confirmação de relato (com semântica de toggle e proibição de auto-confirmação).
  - `POST /reports/:id/dispute`: Contestação de relato (com semântica de toggle e proibição de auto-contestação).
  - `PATCH /reports/:id/hide`: Moderação (soft-hide) de relatos (restrito a `MODERATOR` / `ADMIN`).
- **Status Operacional Derivado (`StatusModule` & `ReliabilityService`)**:
  - `GET /status`: Status operacional derivado por linha (janela de 30 minutos, regra de prioridade do relato mais recente: `INTERRUPTED` > `RESTRICTED` > `NORMAL` > `UNKNOWN`).
  - `GET /stations/:id/status`: Status operacional derivado para uma estação específica.
  - Algoritmo determinístico de confiabilidade (`confidence = 0.40 * f_age + 0.35 * f_conf + 0.25 * f_trust`).
- **Tempo Real via SSE (`EventsModule`)**:
  - `GET /events`: Stream de Server-Sent Events (SSE) com heartbeat (`: ping` a cada 30s) e filtros por `lineId` e `stationId`. Eventos emitidos: `report.created`, `report.confirmed`, `report.disputed`, `status.updated`.
- **Segurança & Hardening**:
  - Helmet para cabeçalhos de segurança HTTP.
  - Rate limiting via `express-rate-limit` (login: 5/min, criação de relatos: 10/min, confirmações: 30/min, global: 120/min).
  - Validação de entrada via Joi rejeitando campos desconhecidos.
  - Formato uniforme de erro da API.
  - Remoção automática de dados sensíveis (`passwordHash`).
  - Swagger/OpenAPI interativo em `/docs`.

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js ≥ 22
- Docker e Docker Compose

### 1. Iniciar com Docker Compose (Banco + API)

Na raiz do repositório:

```bash
# Sobe o banco PostgreSQL 16 (porta 5434) e a API (porta 8006)
docker compose up -d

# Para subir apenas o banco de dados para desenvolvimento local:
docker compose up -d db

# Para parar os serviços:
docker compose down
```

### 2. Configurar Variáveis de Ambiente

Arquivo `back-end/.env`:

```env
DATABASE_URL="postgresql://cademetro:cademetro@localhost:5434/cademetro"
DATABASE_URL_TEST="postgresql://cademetro:cademetro@localhost:5434/cademetro_test"
JWT_SECRET="dev-jwt-secret-cademetro-2026"
PORT=8006
CORS_ORIGIN="*"
```

### 3. Inicializar e Popular o Banco

```bash
cd back-end

# Emitir artefatos do contrato Prisma Next
npm run contract:emit

# Criar tabelas no PostgreSQL
npx prisma db init

# Executar seed com linhas 1, 2, 3, 4 e usuários iniciais
npm run seed
```

### 4. Rodar o Servidor em Desenvolvimento

```bash
npm run start:dev
```

Acesse a documentação Swagger em: [http://localhost:8006/docs](http://localhost:8006/docs).

---

## Testes

```bash
# Rodar testes unitários (Vitest)
npm test

# Rodar testes ponta a ponta (E2E)
npm run test:e2e

# Verificar formatação e linter (Oxlint)
npm run lint
```
