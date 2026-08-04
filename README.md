# AuraNails

AuraNails es una web app simple para manicuras y pequeños estudios de uñas.

## Estado del MVP

El núcleo funcional del MVP está cerrado y validado: autenticación, recuperación de contraseña, clientas, servicios, turnos, agenda, cobros y caja diaria.

El proyecto está listo para iniciar la preparación de un piloto o despliegue controlado. Todavía no se declara desplegado en producción. Productos, Fotos, reportes avanzados, pagos parciales, señas y funciones fiscales permanecen fuera del alcance actual.

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
- Caja diaria: Capa 7 cerrada y estable. Incluye apertura, cierre, gastos, aportes, retiros, anulaciones, historial, resumen por método de pago e integración transaccional con Cobros. Consultá [Capa 7](docs/capa-7-caja.md).
- Agenda: Capa 8 cerrada y estable. Incluye API privada, vista diaria y semanal, navegación, filtros, creación desde fecha seleccionada, estados, cobro visible y validación final. Consultá [Capa 8](docs/capa-8-agenda.md).

No existe eliminación física de Clientas, Servicios, Turnos, Cobros ni registros de Caja. Las anulaciones conservan su historial.

## Estado de validación

El MVP cuenta con validaciones automáticas de backend y frontend mediante GitHub Actions, comprobaciones de migraciones y configuración de producción, pruebas de integridad operativa y recorridos manuales autenticados.

La recuperación de contraseña fue validada con envío SMTP real, cambio de contraseña, inicio de sesión posterior y rechazo de reutilización del token. Las credenciales reales permanecen fuera de Git.
