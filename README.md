# AuraNails

AuraNails es una web app simple para manicuras y pequeños estudios de uñas.

## Cómo levantar el proyecto localmente

1. Crear un archivo `.env` desde `.env.example` si se quieren ajustar variables de desarrollo.
2. Levantar los servicios:

```bash
docker-compose up --build
```

URLs locales:

- Backend: http://localhost:8001/api/health/
- Frontend: http://localhost:5174

## Autenticación

No existe registro público. Las cuentas se crean desde el administrador de Django o con:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Rutas disponibles:

- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`
- `POST /api/auth/password-reset/request/`
- `POST /api/auth/password-reset/confirm/`
- `GET /api/health/`

### Recuperación de contraseña por correo

Docker propaga al backend las variables `DJANGO_EMAIL_*`, `AURANAILS_FRONTEND_URL` y los límites de recuperación definidos en `.env`.

En desarrollo, el backend de correo predeterminado imprime el mensaje en la consola. Para una prueba SMTP real:

1. copiar `.env.example` como `.env`;
2. configurar `DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`;
3. completar host, puerto, usuario, contraseña, TLS/SSL y remitente según el proveedor;
4. recrear el servicio backend para aplicar las variables:

```bash
docker-compose up -d --force-recreate backend
```

El archivo `.env` está ignorado por Git. No se deben versionar contraseñas SMTP ni credenciales reales.

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
- Agenda: Capa 8 cerrada y estable. Incluye API privada, vista diaria y semanal, navegación, filtros, creación desde fecha seleccionada, estados, cobro visible y validación final. Consultá [Capa 8](docs/capa-8-agenda.md).

No existe eliminación física de Clientas, Servicios, Turnos ni Cobros. Productos y Fotos siguen fuera de la implementación actual.

## Caja diaria

La Capa 7 está en progreso. La Capa 7A incorpora el backend privado de apertura, cierre, gastos y movimientos manuales; la Capa 7B incorpora sus pantallas, historial e integración con Cobros e Inicio. Cada cobro nuevo exige y se vincula automáticamente a una caja abierta propia. Consultá [Capa 7](docs/capa-7-caja.md).

No existe eliminación física de registros de Caja; las anulaciones conservan su historial. La Capa 7 completó validaciones técnicas y smoke runtime, pero sigue en progreso hasta realizar el recorrido visual autenticado pendiente.

## Estado de Cobros

La Capa 6 está cerrada con validación técnica completa. El smoke test Docker y recorrido manual quedan pendientes por falta de acceso local al daemon; la configuración Compose fue validada.
