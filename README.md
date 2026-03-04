# FIAR API

Backend de FIAR para gestion de clientes, transacciones, autenticacion y pagos (Mercado Pago).

## Stack

- NestJS 10 + TypeScript
- TypeORM + PostgreSQL
- Swagger
- Firebase Admin
- Mercado Pago

## Estructura funcional

- `auth/`: autenticacion
- `client/`: gestion de clientes
- `transactions/`: creditos, movimientos y cartera
- `mercadopago/`: integracion de pagos
- `profile/`, `user/`: perfil y usuarios

## Requisitos

- Node.js >= 18
- npm >= 9
- PostgreSQL

## Configuracion

```bash
cp .env.example .env
```

Variables principales:
- `PORT` (default runtime: `8080`)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SYNCHRONIZE`
- `FIREBASE_*`, `GOOGLE_APPLICATION_CREDENTIALS`
- `MP_ACCESS_TOKEN`, `MP_SANDBOX_MODE`, `MP_TEST_PAYER_EMAIL`

## Ejecucion local

```bash
npm install
npm run start:dev
```

Rutas base:
- API: `http://localhost:8080/api/v1`
- Swagger: `http://localhost:8080/api`
- Health: `http://localhost:8080/health`

## Docker (stack FIAR completo)

Desde `Fiar/`:

```bash
docker compose up --build
```

Servicios:
- `fiar-api`: `8080:8080`
- `fiar-front`: `3001:3000`
- `postgres`: `5436:5432`

## Scripts utiles

```bash
npm run build
npm run start:prod
npm run test
npm run test:cov
npm run lint
```

## Notas

- Para contexto de ecosistema y despliegue corporativo, ver `HumanizarDocs/documentacion/07ProyectosTecnologia/FIAR.md`.
