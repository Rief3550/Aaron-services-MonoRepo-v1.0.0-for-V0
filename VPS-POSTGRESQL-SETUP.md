# Configuración de PostgreSQL en VPS (Producción)

Esta guía explica cómo configurar PostgreSQL en el VPS de Hostinger para que los servicios en Docker se conecten a la base de datos externa.

## Arquitectura

```
VPS (Hostinger)
├── PostgreSQL (Puerto 5432) ← Instalado directamente en el VPS
│   └── Database: postgres
│       ├── Schema: auth
│       ├── Schema: operations
│       └── Schema: tracking
│
└── Docker Containers
    ├── App Container ──────→ Conecta a PostgreSQL vía host.docker.internal:5432
    └── Redis Container
```

## Paso 1: Instalar PostgreSQL en el VPS

Conéctate al VPS por SSH y ejecuta:

```bash
# Actualizar paquetes
sudo apt update

# Instalar PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16

# Verificar que esté corriendo
sudo systemctl status postgresql
```

## Paso 2: Configurar Usuario y Base de Datos

```bash
# Cambiar a usuario postgres
sudo -u postgres psql

# Dentro de psql, ejecutar:
```

```sql
-- Crear usuario root con contraseña segura
CREATE USER root WITH PASSWORD 'TU_CONTRASEÑA_SEGURA_AQUI';

-- Darle permisos de superuser
ALTER USER root WITH SUPERUSER CREATEDB CREATEROLE LOGIN;

-- Crear los schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS operations;
CREATE SCHEMA IF NOT EXISTS tracking;

-- Dar permisos sobre los schemas
GRANT ALL ON SCHEMA auth TO root;
GRANT ALL ON SCHEMA operations TO root;
GRANT ALL ON SCHEMA tracking TO root;

GRANT USAGE ON SCHEMA auth TO root;
GRANT USAGE ON SCHEMA operations TO root;
GRANT USAGE ON SCHEMA tracking TO root;

GRANT CREATE ON SCHEMA auth TO root;
GRANT CREATE ON SCHEMA operations TO root;
GRANT CREATE ON SCHEMA tracking TO root;

-- Dar permisos por defecto en tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO root;
ALTER DEFAULT PRIVILEGES IN SCHEMA operations GRANT ALL ON TABLES TO root;
ALTER DEFAULT PRIVILEGES IN SCHEMA tracking GRANT ALL ON TABLES TO root;

-- Dar permisos por defecto en secuencias futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO root;
ALTER DEFAULT PRIVILEGES IN SCHEMA operations GRANT ALL ON SEQUENCES TO root;
ALTER DEFAULT PRIVILEGES IN SCHEMA tracking GRANT ALL ON SEQUENCES TO root;

-- Salir
\q
```

## Paso 3: Configurar Acceso desde Docker

Editar el archivo de configuración de PostgreSQL:

```bash
# Editar pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Agregar esta línea al final del archivo:

```
# Permitir conexiones desde Docker (host.docker.internal)
host    postgres    root    172.17.0.0/16    md5
host    postgres    root    127.0.0.1/32     md5
```

Editar postgresql.conf:

```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Buscar y modificar:

```
listen_addresses = 'localhost,172.17.0.1'
```

Reiniciar PostgreSQL:

```bash
sudo systemctl restart postgresql
```

## Paso 4: Actualizar .env.production en el Proyecto

En tu archivo `.env.production`, actualiza la contraseña:

```bash
DATABASE_URL=postgresql://root:TU_CONTRASEÑA_SEGURA_AQUI@host.docker.internal:5432/postgres
```

## Paso 5: Ejecutar Migraciones en el VPS

Una vez que tengas el código en el VPS, ejecuta las migraciones:

```bash
# Opción 1: Usar el script de migraciones
./run-migrations.sh

# Opción 2: Ejecutar SQL directamente
psql -U root -d postgres -f create-all-tables.sql
```

## Paso 6: Verificar Conexión

Desde el VPS, verifica que puedes conectarte:

```bash
psql -U root -d postgres -h localhost

# Dentro de psql:
\dn  # Listar schemas
\dt auth.*  # Listar tablas del schema auth
\dt operations.*  # Listar tablas del schema operations
\dt tracking.*  # Listar tablas del schema tracking
```

## Paso 7: Iniciar Docker en Producción

```bash
# Construir e iniciar los contenedores
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## Troubleshooting

### Error: "connection refused"

Verifica que PostgreSQL esté escuchando en la interfaz correcta:

```bash
sudo netstat -plnt | grep 5432
```

### Error: "authentication failed"

Verifica las credenciales en `.env.production` y que el usuario `root` tenga los permisos correctos.

### Error: "schema does not exist"

Ejecuta el script de inicialización de schemas:

```bash
psql -U root -d postgres -f init-schemas.sql
```

## Seguridad

> [!CAUTION]
> **Importante para Producción:**
> 1. Usa una contraseña fuerte y única para el usuario `root`
> 2. Configura un firewall para limitar el acceso al puerto 5432
> 3. Considera usar SSL/TLS para las conexiones a PostgreSQL
> 4. Haz backups regulares de la base de datos

## Backups

Crear un backup:

```bash
pg_dump -U root -d postgres -F c -f backup_$(date +%Y%m%d).dump
```

Restaurar un backup:

```bash
pg_restore -U root -d postgres backup_20250126.dump
```
