# Capa 1 - Setup técnico inicial

## Alcance

Esta capa deja preparada la base técnica de AuraNails sin crear módulos de negocio.

## Incluye

- Backend Django 5 con Django REST Framework.
- PostgreSQL como base de datos.
- CORS habilitado para el frontend local.
- Simple JWT instalado, sin implementar login todavía.
- Endpoint técnico `GET /api/health/`.
- Frontend React con Vite, Tailwind CSS, React Router y Axios.
- Docker Compose con servicios `db`, `backend` y `frontend`.
- Variables de entorno de ejemplo para desarrollo.

## No incluye todavía

- Modelos de Clientas, Turnos, Servicios, Productos ni Pagos.
- Autenticación o login.
- Integraciones con WhatsApp o Mercado Pago.
- Funcionalidades de negocio.

## Validación esperada

```bash
docker compose up --build
```

- Backend: http://localhost:8001/api/health/
- Frontend: http://localhost:5174
