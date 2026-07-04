# AuraNails

AuraNails es una aplicación pensada para manicuras, profesionales independientes y pequeños estudios de uñas que necesitan organizar su trabajo diario sin depender de planillas, mensajes sueltos o anotaciones dispersas.

La idea central no es construir un sistema administrativo complejo, sino una herramienta simple, visual y fácil de usar para responder preguntas concretas del negocio:

- ¿Qué turnos tengo hoy?
- ¿Quién es mi próxima clienta?
- ¿Qué servicio se va a realizar?
- ¿La clienta dejó seña?
- ¿Cuánto cobré este mes?
- ¿Qué productos se están terminando?
- ¿Qué trabajos hice anteriormente para esta clienta?

## Objetivo del proyecto

Crear una web app responsive, cómoda para usar desde celular, que permita gestionar:

- Turnos.
- Clientas.
- Servicios.
- Cobros y señas.
- Productos.
- Gastos.
- Ganancias.
- Fotos de trabajos realizados.

## Enfoque de diseño

AuraNails debe sentirse como una app para una persona común, no como un sistema técnico.

Por eso se prioriza:

- Lenguaje simple.
- Pantallas limpias.
- Botones claros.
- Flujos cortos.
- Información útil a primera vista.
- Diseño visual acorde al rubro de uñas y belleza.

Ejemplo de criterio:

- Usar “Productos” en lugar de “Inventario”.
- Usar “Dinero” en lugar de “Finanzas”.
- Usar “Clientas” en lugar de “Clientes/Usuarios”.
- Usar “No vino” en lugar de “Inasistencia registrada”.

## Módulos iniciales

1. Inicio / Dashboard.
2. Turnos.
3. Clientas.
4. Servicios.
5. Cobros y señas.
6. Productos.
7. Gastos y ganancias.
8. Fotos de trabajos.
9. Configuración.

## Stack técnico propuesto

### Backend

- Django.
- Django REST Framework.
- PostgreSQL.
- Autenticación JWT.

### Frontend

- React.
- Vite.
- Tailwind CSS.
- React Router.

### Entorno

- Docker.
- Docker Compose.

### Integraciones futuras

- WhatsApp Business API para recordatorios y confirmaciones.
- Mercado Pago para señas/prepagos.
- Cloudinary o Supabase Storage para fotos.

## Roadmap por capas

### Capa 0 - Base documental

Definición de visión, alcance, módulos, reglas de negocio, roadmap y estado del proyecto.

### Capa 1 - Setup técnico inicial

Estructura base del backend, frontend, base de datos y entorno local.

### Capa 2 - Usuarios y autenticación

Login, sesión y permisos básicos.

### Capa 3 - Clientas

Alta, edición, listado, detalle e historial inicial.

### Capa 4 - Servicios

Servicios ofrecidos, precios, duración y estado activo/inactivo.

### Capa 5 - Turnos

Agenda, creación de turnos, estados, cancelación, reprogramación y finalización.

### Capa 6 - Cobros y señas

Pagos, señas, saldos pendientes y métodos de pago.

### Capa 7 - Dashboard

Resumen de turnos, ingresos, pendientes y avisos importantes.

### Capa 8 - Productos

Control básico de productos, stock bajo y movimientos.

### Capa 9 - Gastos y ganancias

Registro de gastos, ingresos y cálculo simple de ganancia.

### Capa 10 - Fotos de trabajos

Galería asociada a clientas y turnos.

## Estado actual

Proyecto en etapa inicial.

- Repositorio creado.
- Capa 0 en preparación.
- Todavía no hay código productivo.

Ver detalles en [`docs/estado-proyecto.md`](docs/estado-proyecto.md).

## Regla principal del proyecto

Toda funcionalidad debe resolver un problema real de una manicura o estudio de uñas.

No se agregan funciones solo porque parecen interesantes, modernas o decorativas.
