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

No existe registro público. Las cuentas se crean desde el administrador de Django o con:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Rutas disponibles:

- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`
- `GET /api/health/`

Para las pruebas locales del backend:

```bash
cd backend
.\.venv\Scripts\python.exe manage.py test
```

## Módulos disponibles

- Clientas: gestión privada por usuaria.
- Servicios: duración, precio, estado y posición en la lista.
- Turnos: Capa 5 cerrada y estable. Incluye listado global, filtros opcionales, alta, detalle, edición, reprogramación y acciones de estado controladas. Consultá [Capa 5](docs/capa-5-turnos.md).

No existe eliminación física de Clientas, Servicios ni Turnos. Cobros, Productos y Fotos siguen fuera de la implementación actual.

## Próxima etapa

La **Capa 6A — Cobros de turnos** incorpora el backend de modelo, reglas de negocio y API. La **Capa 6B** incorpora listado, detalle, registro, anulación e integración visual con Turnos; queda pendiente de validación final. El alcance completo está en [Capa 6](docs/capa-6-cobros.md).
