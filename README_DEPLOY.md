# Guía de Despliegue (Deployment Guide)

Este proyecto está configurado para ser desplegado fácilmente utilizando **Docker** y **Docker Compose**. Esta es la forma recomendada para ponerlo en producción en un VPS (Servidor Privado Virtual) como DigitalOcean, AWS EC2, Hetzner, etc.

## Requisitos Previos

1.  Un servidor (VPS) con Linux (Ubuntu recomendado).
2.  Un dominio (ej: `mi-calculadora.com`) apuntando a la IP de tu servidor.
3.  **Docker** y **Docker Compose** instalados en el servidor.

## Estructura de Despliegue

El archivo `docker-compose.yml` levanta 4 servicios:
1.  **db**: Base de datos PostgreSQL.
2.  **backend**: Tu API FastAPI (Python).
3.  **frontend**: Tu aplicación Next.js.
4.  **nginx**: Un servidor web que recibe las peticiones del usuario y las dirige al frontend o al backend según corresponda.

## Pasos para Desplegar

### 1. Preparar el Servidor
Conéctate a tu servidor vía SSH y clona tu repositorio:

```bash
git clone <url-de-tu-repo>
cd crushing-calculator
```

### 1.1 Instalación de Docker en Oracle Linux 9
Si estás usando Oracle Linux (como parece ser tu caso), ejecuta estos comandos para instalar Docker:

```bash
# 1. Añadir el repositorio oficial de Docker
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo

# 2. Instalar Docker y sus plugins
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 3. Iniciar el servicio de Docker
sudo systemctl start docker
sudo systemctl enable docker

# 4. Dar permisos a tu usuario (para no usar sudo con docker)
sudo usermod -aG docker $USER

# 5. Aplicar los cambios de grupo (o cierra sesión y vuelve a entrar)
newgrp docker
```

### 2. Configurar Variables de Entorno
El archivo `docker-compose.yml` tiene valores por defecto para la base de datos. Para producción, deberías cambiarlos.

Puedes editar el `docker-compose.yml` o crear un archivo `.env` y referenciarlo.

### 3. Ejecutar
Para iniciar todos los servicios en segundo plano:

```bash
docker compose up -d --build
```

Esto construirá las imágenes de Docker para el frontend y backend, y levantará todo el sistema.

### 4. Verificar
Visita `http://<tu-ip-o-dominio>` en tu navegador. Deberías ver la aplicación funcionando.

## Notas Importantes

### HTTPS (Candado de seguridad)
La configuración actual de Nginx (`nginx/nginx.conf`) sirve el sitio en HTTP (puerto 80). Para producción real, necesitas HTTPS.
La forma más fácil es usar **Certbot** en el servidor host o configurar Nginx para usar certificados SSL de Let's Encrypt.

### Base de Datos
Los datos de la base de datos se guardan en un volumen de Docker llamado `postgres_data`. Esto asegura que los datos persistan aunque reinicies los contenedores.

### Actualizaciones
Si haces cambios en el código, para actualizar el servidor ejecuta:

```bash
git pull
docker compose up -d --build
```
