# AuraNails

AuraNails es una web app simple para manicuras y pequeños estudios de uñas.

## Cómo levantar el proyecto localmente

1. Crear un archivo `.env` desde `.env.example` si se quieren ajustar variables de desarrollo.
2. Levantar los servicios:

```bash
docker compose up --build
```

URLs locales:

- Backend: http://localhost:8000/api/health/
- Frontend: http://localhost:5173

El endpoint técnico del backend responde:

```json
{"status": "ok", "project": "AuraNails"}
```

## Estado funcional

La Capa 1 contiene solamente el setup técnico inicial. Todavía no existen módulos de negocio para Turnos, Clientas, Servicios, Productos, Dinero ni Fotos.
