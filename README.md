# AuraNails

AuraNails es una web app simple para manicuras y pequeños estudios de uñas.

## Cómo levantar el proyecto localmente

1. Crear un archivo `.env` desde `.env.example` si se quieren ajustar variables de desarrollo.
2. Levantar los servicios:

```bash
docker-compose up --build
```

URLs locales:

- Backend: http://localhost:8000/api/health/
- Frontend: http://localhost:5173

## Autenticación

No existe registro público. Las cuentas se crean desde el administrador de Django o mediante el siguiente comando, que solicita el correo y la contraseña de forma interactiva:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Rutas disponibles:

- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`
- `GET /api/health/`

Para ejecutar las pruebas del backend dentro de Docker:

```bash
docker-compose exec backend python manage.py test
```

En desarrollo local, usar el entorno virtual de `backend`:

```bash
cd backend
.\.venv\Scripts\python.exe manage.py test
```

La sesión inicial se conserva en el almacenamiento del navegador mediante access y refresh tokens. Esta decisión está documentada en `docs/capa-2-autenticacion.md` y podrá evolucionar en capas posteriores.

## Clientas

La Capa 3 incorpora el módulo privado de Clientas: alta, búsqueda, edición, detalle, desactivación y reactivación. Cada cuenta solamente puede consultar y modificar sus propias clientas.

Rutas privadas del frontend:

- `/clientas`
- `/clientas/nueva`
- `/clientas/:id`
- `/clientas/:id/editar`

API de clientas:

- `GET` y `POST /api/clientas/`
- `GET` y `PATCH /api/clientas/:id/`
- `POST /api/clientas/:id/desactivar/`
- `POST /api/clientas/:id/reactivar/`

No se expone eliminación física. Los módulos de Turnos, Servicios, Cobros, Productos y Fotos siguen fuera de alcance.
