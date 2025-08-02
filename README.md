# 💳 FIAR API - Sistema de Créditos
## Credit Management System - Backend Service

<div align="center">

![FIAR API](https://img.shields.io/badge/FIAR-API-green?style=for-the-badge&logo=nestjs)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Wompi](https://img.shields.io/badge/Wompi-4CAF50?style=for-the-badge&logo=creditcard&logoColor=white)

**Sistema completo de gestión de créditos y pagos**  
*Parte del Ecosistema Humanizar*

</div>

## 🌟 Descripción General

FIAR API es el sistema de gestión de créditos del **Ecosistema Humanizar**. Esta API robusta, construida con NestJS y TypeScript, proporciona una solución completa para el manejo de créditos, transacciones, clientes y pagos. Integra múltiples métodos de pago incluyendo Wompi y ofrece un sistema de créditos flexible para el ecosistema comercial.

### 🎯 Propósito en el Ecosistema
- **Sistema de créditos**: Gestión completa de créditos para clientes
- **Integración Graf**: Pagos a crédito en el e-commerce
- **Pasarela de pagos**: Integración con Wompi y otros métodos
- **Suscripciones**: Sistema de planes y suscripciones recurrentes
- **Webhooks**: Notificaciones en tiempo real de transacciones

## ✨ Características Principales

### 💰 Gestión Avanzada de Créditos
- **Límites personalizables**: Configuración de límites por cliente
- **Saldo en tiempo real**: Tracking de saldos disponibles
- **Historial completo**: Registro detallado de transacciones
- **Clientes de confianza**: Sistema de categorización de clientes
- **Bloqueo de créditos**: Control granular de acceso

### 🏦 Sistema de Transacciones
- **Operaciones income/expense**: Manejo de entradas y salidas de crédito
- **Estados avanzados**: Pending, approved, rejected, completed
- **Detalles JSON**: Metadatos flexibles por transacción
- **Auditoría completa**: Trazabilidad de todas las operaciones
- **Webhooks integrados**: Notificaciones automáticas

### 👥 Gestión de Clientes
- **Perfiles completos**: Información personal y comercial
- **Documentación única**: Validación de documentos de identidad
- **Geolocalización**: Información de ciudad y estado
- **Contacto múltiple**: Email y teléfono únicos
- **Relación con usuarios**: Asociación a propietarios

### 💳 Integración de Pagos
- **Wompi Integration**: Pasarela de pagos principal
- **Payment Links**: Generación de enlaces de pago
- **Payment Sources**: Gestión de métodos de pago guardados
- **Suscripciones**: Pagos recurrentes automatizados
- **Webhooks seguros**: Verificación de integridad

### 🔐 Autenticación Robusta
- **Firebase Auth**: Autenticación unificada del ecosistema
- **JWT Tokens**: Sistema de tokens seguros
- **API Key Protection**: Protección de endpoints críticos
- **Roles y permisos**: Control de acceso granular
- **Guards personalizados**: Seguridad por capas

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **NestJS** | ^10.0.0 | Framework backend principal |
| **TypeScript** | ^5.1.3 | Lenguaje de desarrollo tipado |
| **PostgreSQL** | ^8.11.1 | Base de datos principal |
| **TypeORM** | ^0.3.17 | ORM para base de datos |
| **Firebase Admin** | ^12.7.0 | Autenticación y servicios |
| **Swagger** | ^7.4.2 | Documentación automática |
| **Axios** | ^1.7.5 | Cliente HTTP para integraciones |
| **Class Validator** | ^0.14.0 | Validación de datos |
| **Wompi SDK** | Custom | Integración de pagos |

## 🏗️ Arquitectura del Sistema

### Módulos Principales
```
📦 FIAR API
├── 🔐 Auth Module           # Autenticación y autorización
├── 👥 Client Module         # Gestión de clientes
├── 💰 Transaction Module    # Transacciones de crédito
├── 👤 User Module           # Usuarios del sistema
├── 💳 Wompi Module          # Integración de pagos
├── 👤 Profile Module        # Perfiles de usuario
├── 🔗 Events Module         # Eventos y webhooks
└── ⚙️ Config Module         # Configuración del sistema
```

### Estructura Detallada del Proyecto
```
📁 creditos-api/
├── 📁 src/                           # Código fuente principal
│   ├── 📄 main.ts                    # Punto de entrada
│   ├── 📄 app.module.ts              # Módulo principal
│   ├── 📄 logger.middleware.ts       # Middleware de logging
│   ├── 📁 auth/                      # Autenticación y autorización
│   │   ├── 📄 auth.controller.ts     # Controlador de auth
│   │   ├── 📄 auth.service.ts        # Servicio de auth
│   │   ├── 📄 firebase-auth.guard.ts # Guard Firebase
│   │   ├── 📄 api-key-auth.guard.ts  # Guard API Key
│   │   ├── 📄 roles.guard.ts         # Guard de roles
│   │   └── 📁 dto/                   # DTOs de autenticación
│   ├── 📁 client/                    # Gestión de clientes
│   │   ├── 📄 client.controller.ts   # Controlador de clientes
│   │   ├── 📄 client.service.ts      # Servicio de clientes
│   │   ├── 📁 entities/              # Entidades
│   │   │   └── 📄 client.entity.ts   # Entidad cliente
│   │   └── 📁 dto/                   # DTOs de cliente
│   │       ├── 📄 create-client.dto.ts
│   │       └── 📄 update-client.dto.ts
│   ├── 📁 transaction/               # Gestión de transacciones
│   │   ├── 📄 transaction.controller.ts # Controlador
│   │   ├── 📄 transaction.service.ts  # Servicio
│   │   ├── 📁 entities/              # Entidades
│   │   │   └── 📄 transaction.entity.ts # Entidad transacción
│   │   └── 📁 dto/                   # DTOs de transacción
│   ├── 📁 user/                      # Gestión de usuarios
│   │   ├── 📄 user.controller.ts     # Controlador de usuarios
│   │   ├── 📄 user.service.ts        # Servicio de usuarios
│   │   ├── 📁 entities/              # Entidades
│   │   │   ├── 📄 user.entity.ts     # Entidad usuario
│   │   │   └── 📄 subscription.entity.ts # Entidad suscripción
│   │   └── 📁 dto/                   # DTOs de usuario
│   ├── 📁 wompi/                     # Integración Wompi
│   │   ├── 📄 wompi.controller.ts    # Controlador Wompi
│   │   ├── 📄 wompi.service.ts       # Servicio Wompi
│   │   ├── 📄 wompi.util.ts          # Utilidades Wompi
│   │   ├── 📁 entities/              # Entidades de pago
│   │   │   ├── 📄 payment-link.entity.ts
│   │   │   └── 📄 payment-source.entity.ts
│   │   ├── 📁 interfaces/            # Interfaces Wompi
│   │   └── 📁 dto/                   # DTOs de pago
│   ├── 📁 profile/                   # Perfiles de usuario
│   ├── 📁 events/                    # Eventos y webhooks
│   │   ├── 📄 event-webhook.controller.ts
│   │   └── 📄 fiar-event-handler.service.ts
│   ├── 📁 utils/                     # Utilidades
│   │   ├── 📄 axiosWompiInstance.ts  # Cliente Axios Wompi
│   │   ├── 📄 encrypt.ts             # Utilidades de encriptación
│   │   ├── 📄 firebase-admin.config.ts # Config Firebase
│   │   └── 📄 typeorm.config.ts      # Config TypeORM
│   └── 📁 common/                    # Componentes comunes
│       └── 📁 entities/
│           └── 📄 sharedProp.helper.ts # Props compartidas
├── 📄 nest-cli.json                  # Configuración NestJS
├── 📄 tsconfig.json                  # Configuración TypeScript
├── 📄 package.json                   # Dependencias
└── 📄 Dockerfile                     # Imagen Docker
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** >= 16.x
- **npm** >= 8.x o **yarn** >= 1.x
- **PostgreSQL** >= 13.x
- **Docker** (opcional)

### 1️⃣ Instalación
```bash
# Navegar al directorio
cd FIAR/creditos-api

# Instalar dependencias
npm install
# o
yarn install
```

### 2️⃣ Configuración del Entorno
```bash
# Crear archivo de variables de entorno
cp .env.example .env

# Editar variables
nano .env
```

#### Variables de Entorno Principales
```bash
# Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=fiar_user
DB_PASSWORD=your_secure_password
DB_NAME=fiar_database
DB_SYNCHRONIZE=false  # true solo en desarrollo

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"

# Wompi Integration
WOMPI_BASE_URL=https://production.wompi.co
WOMPI_PRIVATE_KEY=prv_prod_your_private_key
WOMPI_PUBLIC_KEY=pub_prod_your_public_key
WOMPI_EVENTS_SECRET=your_events_secret

# API Configuration
PORT=3004
NODE_ENV=development
API_VERSION=v1

# Frontend URLs
FRONT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Security
JWT_SECRET=your_super_secret_jwt_key
API_KEY_SECRET=your_api_key_secret
ENCRYPTION_KEY=your_32_character_encryption_key

# Ecosystem Integration
GRAF_API_URL=http://localhost:3000
EMW_API_URL=http://localhost:3001
ECOSYSTEM_API_KEY=your_ecosystem_key
```

### 3️⃣ Configuración de Base de Datos
```bash
# Crear base de datos PostgreSQL
createdb fiar_database

# O usando psql
psql -U postgres
CREATE DATABASE fiar_database;
CREATE USER fiar_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE fiar_database TO fiar_user;
```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
# Iniciar en modo desarrollo
npm run start:dev

# La API estará disponible en:
# http://localhost:3004
# Swagger UI: http://localhost:3004/api
```

### Producción
```bash
# Construir aplicación
npm run build:prod

# Iniciar servidor de producción
npm run start:prod
```

### Con Docker
```bash
# Construir imagen Docker
docker build -t fiar-api .

# Ejecutar contenedor
docker run -p 3004:3004 --env-file .env fiar-api
```

## 📡 API Endpoints

### 🔐 Autenticación
```http
POST /auth/register           # Registro de usuario
POST /auth/login              # Iniciar sesión
GET  /auth/profile            # Obtener perfil
```

### 👥 Gestión de Clientes
```http
GET    /client               # Listar clientes
POST   /client               # Crear cliente
GET    /client/:id           # Obtener cliente
PUT    /client/:id           # Actualizar cliente
DELETE /client/:id           # Eliminar cliente
```

### 💰 Transacciones de Crédito
```http
GET    /transaction          # Listar transacciones
POST   /transaction          # Crear transacción
GET    /transaction/:id      # Obtener transacción
PUT    /transaction/:id      # Actualizar transacción
DELETE /transaction/:id      # Eliminar transacción
```

### 👤 Usuarios del Sistema
```http
GET    /user                 # Listar usuarios
POST   /user                 # Crear usuario
GET    /user/:id             # Obtener usuario
PUT    /user/:id             # Actualizar usuario
DELETE /user/:id             # Eliminar usuario
```

### 💳 Integración Wompi
```http
POST /wompi/process-subscription    # Procesar suscripción
POST /wompi/webhook                # Webhook de notificaciones
GET  /wompi/payment-status/:id     # Estado de pago
POST /wompi/create-payment-link    # Crear enlace de pago
```

### 👤 Perfiles
```http
GET    /profile              # Listar perfiles
POST   /profile              # Crear perfil
GET    /profile/:id          # Obtener perfil
PUT    /profile/:id          # Actualizar perfil
DELETE /profile/:id          # Eliminar perfil
```

### 🔗 Eventos y Webhooks
```http
POST /events/webhook         # Webhook genérico de eventos
GET  /events/status          # Estado del sistema de eventos
```

## 🔧 Configuración Avanzada

### Sistema de Créditos
```typescript
// Configuración de límites de crédito
const creditConfig = {
  defaultLimit: 100000,      // Límite por defecto
  maxLimit: 1000000,         // Límite máximo
  trustedMultiplier: 2,      // Multiplicador para clientes de confianza
  minimumPayment: 10000      // Pago mínimo
};
```

### Integración Wompi
```typescript
// Configuración de planes de suscripción
const subscriptionPlans = {
  basic: { price: 29900, frequency: 'monthly' },
  premium: { price: 99900, frequency: 'monthly' },
  enterprise: { price: 299900, frequency: 'monthly' }
};
```

### Webhooks y Eventos
```bash
# Configuración de webhooks
WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_TIMEOUT=30000
RETRY_ATTEMPTS=3
```

## 🔗 Integraciones del Ecosistema

### Graf E-commerce
- Pagos a crédito en checkout
- Gestión de límites por cliente
- Notificaciones de transacciones
- Reportes de crédito

### EMW Marketing
- Notificaciones de pagos vencidos
- Comunicación de límites de crédito
- Promociones de suscripciones

### MeraVuelta Entregas
- Pagos contra entrega con crédito
- Verificación de límites antes de despacho

## 📊 Swagger Documentation

La documentación completa e interactiva de la API está disponible en:
- **Desarrollo**: [http://localhost:3004/api](http://localhost:3004/api)
- **Producción**: [https://api.fiar.humanizar.com/api](https://api.fiar.humanizar.com/api)

## 🧪 Testing

### Ejecutar Tests
```bash
# Tests unitarios
npm run test

# Tests con watch mode
npm run test:watch

# Tests con cobertura
npm run test:cov

# Tests E2E
npm run test:e2e
```

### Calidad de Código
```bash
# Linting
npm run lint

# Formateo
npm run format

# Build check
npm run build
```

## 🚀 Despliegue

### Producción con Docker
```bash
# Build de producción
docker build -f Dockerfile -t fiar-api:prod .

# Ejecutar en producción
docker run -d \
  --name fiar-api \
  -p 3004:3004 \
  --env-file .env.production \
  fiar-api:prod
```

### Variables por Ambiente
```bash
# Desarrollo
cp .env.development .env

# Staging
cp .env.staging .env

# Producción
cp .env.production .env
```

## 🤝 Contribución

### Proceso de Desarrollo
1. **Fork** del repositorio
2. **Branch** específico: `feature/nueva-funcionalidad`
3. **Desarrollo** siguiendo estándares del proyecto
4. **Tests** para nuevas funcionalidades
5. **Pull request** con descripción detallada

### Estándares de Código
- **TypeScript strict mode**
- **ESLint** para linting
- **Prettier** para formateo
- **Conventional commits**
- **NestJS best practices**

## 📞 Soporte

### Enlaces Útiles
- [FIAR Frontend Documentation](../credito-front/README.md)
- [Ecosistema Humanizar](../../README.md)
- [NestJS Documentation](https://docs.nestjs.com)
- [Wompi API Docs](https://docs.wompi.co)

### Contacto
- **Maintainer**: Steven Vallejo Ortiz
- **Email**: stevenvallejo780@gmail.com
- **Issues**: GitHub Issues del repositorio

### Troubleshooting

#### Error de conexión a base de datos
```bash
# Verificar PostgreSQL
pg_isready -h localhost -p 5432

# Verificar credenciales
psql -h localhost -U fiar_user -d fiar_database
```

#### Problemas con Wompi
```bash
# Verificar configuración
curl -X GET "https://production.wompi.co/v1/merchants" \
  -H "Authorization: Bearer YOUR_PRIVATE_KEY"
```

---

<div align="center">

**FIAR API v0.0.1**  
*Sistema de Créditos - Ecosistema Humanizar*

![Humanizar](https://img.shields.io/badge/Humanizar-Ecosystem-orange?style=for-the-badge)

</div>







