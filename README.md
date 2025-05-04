# Total Pedidos API

La **Total Pedidos API** es el backend de un e-commerce enfocado en gestionar pedidos y productos. Implementado con [NestJS](https://nestjs.com/), ofrece diversos endpoints para la administración del sistema de ventas en línea.

## Descripción del Proyecto

Esta API incluye funcionalidades para gestionar pedidos, productos, usuarios, y pagos en línea. Está diseñada con Arquitectura Modular usando NestJS y soporta bases de datos relacionales mediante TypeORM y PostgreSQL. Adicionalmente, cuenta con documentación automática usando Swagger y pruebas automatizadas con Jest.

### Tecnologías Utilizadas

- **NestJS**: Un framework para construir aplicaciones del lado del servidor de manera eficiente.
- **TypeORM**: ORM que simplifica la interacción con bases de datos.
- **PostgreSQL**: Base de datos relacional.
- **Swagger**: Genera automáticamente la documentación de la API.
- **Jest**: Framework de pruebas para Node.js.

## Documentación de la API

La documentación completa de la API está disponible en el siguiente enlace:

[https://total-pedidos-api.example.com/api](https://total-pedidos-api.example.com/api)

## Comenzando

### Prerrequisitos

- Node.js >= 14.x
- npm >= 6.x o yarn >= 1.x
- PostgreSQL

### Instalación

1. Clona el repositorio:

    ```bash
    git clone https://github.com/stevenvo780/total-pedidos-api.git
    cd total-pedidos-api
    ```

2. Instala las dependencias:

    ```bash
    npm install
    ```

    o

    ```bash
    yarn install
    ```

3. Configura las variables de entorno creando un archivo `.env` en el directorio raíz del proyecto. Asegúrate de incluir la configuración de tu base de datos PostgreSQL y otras variables necesarias:

    ```bash
    DATABASE_URL=postgres://user:password@localhost:5432/cafeteriadelcaos
    ```

### Variables de Entorno y Secretos

#### Desarrollo Local
Crea un archivo `.env` en el directorio raíz con las siguientes variables:
```bash
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=cafeteria-del-caos
DB_SYNCHRONIZE=true

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key


# Frontend
FRONT_URL=http://localhost:3000
```

### Ejecutando la Aplicación

Puedes ejecutar la aplicación en diferentes modos según tus necesidades:

```bash
# Modo desarrollo
npm run start

# Modo watch (con recarga automática)
npm run start:dev

# Modo producción
npm run start:prod
```

### Usando Docker (Opcional)

Si prefieres usar Docker, asegúrate de tener Docker instalado y sigue estos pasos:

1. Construye la imagen de Docker:

    ```bash
    docker build -t total-pedidos-api .
    ```

2. Ejecuta el contenedor:

    ```bash
    docker run -p 3000:3000 total-pedidos-api
    ```

3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación ejecutándose en Docker.

### Variables de Entorno y Secretos
Para configurar variables de entorno en Docker, puedes pasar el archivo `.env` al contenedor usando la opción `--env-file`:
```bash
docker run --env-file .env -p 3000:3000 total-pedidos-api
```

#### Google Cloud Build
Para configurar variables de entorno en Google Cloud Build, puedes usar `secretManager` para gestionar tus secretos de manera segura. Aquí tienes un ejemplo de configuración en el archivo `cloudbuild.yaml`:
```yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/total-pedidos-api', '.']
  secretEnv: ['DATABASE_URL']
secrets:
- kmsKeyName: projects/$PROJECT_ID/locations/global/keyRings/$KEYRING/cryptoKeys/$KEY
  secretEnv:
    DATABASE_URL: 'projects/$PROJECT_ID/secrets/DATABASE_URL/versions/latest'
```

## Pruebas
La API incluye pruebas automatizadas. Puedes ejecutarlas usando los siguientes comandos:
```bash
# Pruebas unitarias
npm run test

# Pruebas de extremo a extremo (e2e)
npm run test:e2e

# Cobertura de pruebas
npm run test:cov
```

## Soporte
Si encuentras útil la Total Pedidos API, considera apoyar el proyecto contribuyendo código, reportando problemas o compartiendo el proyecto.

## Documentación de la API
https://total-pedidos-api.example.com/api



## Pasos

**Instala la dependencia:**
npm install

**Configura las variables de entorno en .env:**

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=cafeteria-del-caos
DB_SYNCHRONIZE=true

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

FRONT_URL=http://localhost:3000

**Ejecución**

npm run start

npm run start:dev

npm run start:prod

Docker y Despliegue

1. Construye la imagen:

docker build -t total-pedidos-api .

2. ejecuta el contenedor:

docker run --env-file .env -p 3000:3000 total-pedidos-api

3. Accede a http://localhost:3000.

## Licencia
Este proyecto está licenciado bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

