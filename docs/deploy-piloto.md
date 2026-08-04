# Preparación de piloto — Stack productivo

## Estado

Este documento describe el Gate P1 de preparación para piloto. Su objetivo es ejecutar AuraNails con imágenes y procesos de producción reproducibles antes de elegir proveedor, dominio o mecanismo definitivo de copias de seguridad.

Este gate no declara que AuraNails esté publicada en Internet.

## Arquitectura

El stack productivo utiliza tres servicios aislados:

- `frontend`: compila React con Vite y sirve los archivos estáticos mediante Nginx. También funciona como gateway único para `/api/`, `/admin/` y `/static/`.
- `backend`: ejecuta Django con Gunicorn, aplica migraciones al arrancar una única réplica y publica estáticos administrativos mediante WhiteNoise.
- `db`: ejecuta PostgreSQL con volumen persistente y sin publicar el puerto hacia el host.

Solo Nginx expone un puerto. Gunicorn y PostgreSQL permanecen dentro de la red interna de Docker.

## Archivos

- `docker-compose.production.yml`: orquestación productiva.
- `backend/Dockerfile.prod`: imagen del backend sin bind mounts ni `runserver`.
- `backend/entrypoint.prod.sh`: migraciones, `collectstatic` y arranque de Gunicorn.
- `frontend/Dockerfile.prod`: build multietapa y servidor Nginx.
- `frontend/nginx.conf`: SPA, gateway a Django y cabeceras básicas.
- `.env.production.example`: plantilla para un servidor real con HTTPS.
- `.env.production.smoke.example`: plantilla exclusiva para probar localmente por HTTP.

## Prueba local del stack productivo

La prueba utiliza una base independiente de la utilizada por `docker-compose.yml`.

Desde la raíz del repositorio en PowerShell:

```powershell
Copy-Item .env.production.smoke.example .env.production

docker compose `
  --env-file .env.production `
  -f docker-compose.production.yml `
  up -d --build
```

Comprobar el estado:

```powershell
docker compose `
  --env-file .env.production `
  -f docker-compose.production.yml `
  ps
```

Validar el gateway y la API:

```powershell
Invoke-WebRequest http://localhost:8080/healthz -UseBasicParsing
Invoke-WebRequest http://localhost:8080/api/health/ -UseBasicParsing
```

La aplicación queda disponible en:

```text
http://localhost:8080
```

## Crear una cuenta para el smoke test

```powershell
docker compose `
  --env-file .env.production `
  -f docker-compose.production.yml `
  exec backend python manage.py createsuperuser
```

## Revisar logs

```powershell
docker compose `
  --env-file .env.production `
  -f docker-compose.production.yml `
  logs --tail=200 backend frontend db
```

## Detener sin borrar datos

```powershell
docker compose `
  --env-file .env.production `
  -f docker-compose.production.yml `
  down
```

No agregar `-v` salvo que se quiera destruir deliberadamente la base del smoke test.

## Uso en un servidor real

Para un piloto real:

1. copiar `.env.production.example` como `.env.production`;
2. reemplazar todas las credenciales y dominios de ejemplo;
3. mantener `DJANGO_DEBUG=false`;
4. publicar el puerto de Nginx detrás de un proxy confiable con HTTPS;
5. conservar PostgreSQL y Gunicorn sin puertos públicos;
6. utilizar SMTP real y un remitente controlado;
7. ejecutar la validación de producción y el recorrido autenticado antes de habilitar usuarios reales.

El frontend utiliza `VITE_API_URL=/api`, por lo que navegador y API comparten origen. Esto evita depender de dos dominios para el piloto.

## Restricciones del Gate P1

- Se asume una sola réplica del backend; por eso las migraciones se aplican durante el arranque.
- No se implementan todavía backups automáticos, restauración, monitoreo externo ni despliegue continuo.
- No se elige todavía un proveedor de alojamiento.
- No se cargan datos reales ni credenciales reales en Git.

Los backups validados y la restauración constituyen el siguiente gate de infraestructura.
