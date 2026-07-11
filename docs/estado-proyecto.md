# Estado del proyecto

## Producto

AuraNails es una web app simple para manicuras y pequeños estudios de uñas. El enfoque del producto usa lenguaje cercano: Turnos, Clientas, Servicios, Productos, Dinero y Fotos.

## Capas

- Capa 0 documental: completada.
- Capa 1 setup técnico inicial: completada.
- Capa 2 usuarios y autenticación: completada.
- Capa 3 clientas: implementada, pendiente de validación y commit.

## Estado actual

La base técnica usa Django, Django REST Framework, PostgreSQL, CORS, React, Vite, Tailwind CSS, React Router, Axios y Docker Compose. La autenticación está resuelta con un usuario personalizado basado en email y JWT.

El módulo Clientas permite crear, buscar, ver, editar, desactivar y reactivar clientas de la usuaria autenticada. Los datos están aislados por propietaria tanto en listado como en detalle y modificación.

No existe registro público. No se crearon módulos para Turnos, Servicios, Productos, Pagos, Dinero o Fotos.

## Pendientes próximos

- Validar el módulo Clientas con Docker y un recorrido manual cuando el daemon esté disponible.
- Definir el alcance funcional de la Capa 4 antes de crear nuevos modelos de negocio.
