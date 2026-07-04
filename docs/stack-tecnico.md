# Stack técnico recomendado

Este documento define la base técnica recomendada para AuraNails.

La tecnología debe permitir construir una app sólida, escalable y mantenible, sin volver el proyecto innecesariamente complejo.

## Enfoque general

AuraNails será inicialmente una web app responsive.

Esto significa que podrá usarse desde:

- Celular.
- Tablet.
- Notebook.
- PC.

No se desarrollará una app nativa Android/iOS en la primera etapa.

## Backend

Tecnologías recomendadas:

- Django.
- Django REST Framework.
- PostgreSQL.
- JWT para autenticación.

Motivo:

Django es una buena opción para sistemas de gestión porque permite trabajar con modelos, reglas de negocio, panel administrativo, seguridad y APIs de manera ordenada.

## Frontend

Tecnologías recomendadas:

- React.
- Vite.
- Tailwind CSS.
- React Router.
- TanStack Query, en una etapa posterior si hace falta mejorar el manejo de datos.

Motivo:

React con Vite permite construir una interfaz moderna y rápida. Tailwind ayuda a crear pantallas limpias, responsive y coherentes visualmente.

## Base de datos

Tecnología recomendada:

- PostgreSQL.

Motivo:

PostgreSQL es robusto y adecuado para manejar clientas, turnos, cobros, productos, gastos y relaciones entre datos.

## Entorno local

Tecnologías recomendadas:

- Docker.
- Docker Compose.

Servicios iniciales:

- Backend.
- Frontend.
- PostgreSQL.

## Integraciones futuras

Estas integraciones no pertenecen al MVP inicial, pero se contemplan para futuras capas:

### WhatsApp Business API

Para:

- Confirmación de turnos.
- Recordatorios.
- Avisos de seña pendiente.
- Mensajes post-atención.

### Mercado Pago

Para:

- Señales.
- Prepagos.
- Confirmación automática de pagos.

### Almacenamiento de imágenes

Opciones:

- Cloudinary.
- Supabase Storage.
- S3 compatible.

Para:

- Fotos de trabajos.
- Galería por clienta.

## Criterio técnico

La tecnología debe acompañar el producto, no dominarlo.

Si una herramienta agrega complejidad sin resolver un problema concreto, se pospone.

## Stack inicial sugerido

```text
Backend: Django + DRF + PostgreSQL
Frontend: React + Vite + Tailwind
Entorno: Docker + Docker Compose
Autenticación: JWT
```
