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

- Clientas: gestión privada por usuaria, con correo y teléfono normalizados sin duplicados por propietaria.
- Servicios: duración, precio, estado y posición en la lista.
- Turnos: Capa 5 cerrada y estable. Incluye listado global, filtros opcionales, alta, detalle, edición, reprogramación y acciones de estado controladas. Consultá [Capa 5](docs/capa-5-turnos.md).
- Cobros: Capa 6 cerrada y estable. Incluye registro desde turnos realizados, historial, anulación con motivo, listado global e integración con Turnos. Consultá [Capa 6](docs/capa-6-cobros.md).
- Agenda: Capa 8 en progreso. Las Capas 8A y 8B disponen de una API privada y una vista diaria/semanal de los mismos turnos; falta la validación final. Consultá [Capa 8](docs/capa-8-agenda.md).

No existe eliminación física de Clientas, Servicios, Turnos ni Cobros. Productos y Fotos siguen fuera de la implementación actual.

## Caja diaria

La Capa 7 está en progreso. La Capa 7A incorpora el backend privado de apertura, cierre, gastos y movimientos manuales; la Capa 7B incorpora sus pantallas, historial e integración con Cobros e Inicio. Cada cobro nuevo exige y se vincula automáticamente a una caja abierta propia. Consultá [Capa 7](docs/capa-7-caja.md).

No existe eliminación física de registros de Caja; las anulaciones conservan su historial. La Capa 7 completó validaciones técnicas y smoke runtime, pero sigue en progreso hasta realizar el recorrido visual autenticado pendiente.

## Estado de Cobros

La Capa 6 está cerrada con validación técnica completa. El smoke test Docker y recorrido manual quedan pendientes por falta de acceso local al daemon; la configuración Compose fue validada.
