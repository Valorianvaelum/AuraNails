# Capa 3: Clientas

## Objetivo

Incorporar una ficha simple de clientas para que cada usuaria de AuraNails pueda guardar datos y preferencias útiles durante su jornada, sin acceder a la información de otras cuentas.

## Alcance

La capa implementa alta, listado, búsqueda, detalle, edición, desactivación y reactivación. La interfaz incluye las rutas protegidas `/clientas`, `/clientas/nueva`, `/clientas/:id` y `/clientas/:id/editar`.

No se implementan turnos, servicios realizados, cobros, deudas, productos, fotos, estadísticas, notificaciones, WhatsApp, importación, exportación ni eliminación física.

## Modelo

`Clienta` pertenece obligatoriamente a una `propietaria` (`AUTH_USER_MODEL`). Sus campos son:

- `nombre` obligatorio, limpio de espacios exteriores.
- `apellido`, `telefono`, `email`, `fecha_nacimiento`, `color_favorito`, `estilo_favorito` y `notas` opcionales.
- `activa`, inicialmente en `True`.
- `creada_en` y `actualizada_en`.

El correo se normaliza a minúsculas si existe y la fecha de nacimiento no puede ser futura. Por cada propietaria, un correo informado y un teléfono informado deben ser únicos: el correo se compara sin espacios ni mayúsculas y el teléfono solo por sus dígitos. Las claves normalizadas tienen constraints condicionales de base de datos. Los duplicados históricos previos a esta regla no se eliminan ni fusionan automáticamente; quedan sin clave normalizada cuando existe conflicto y el alta o edición posterior los sigue detectando. El orden de listado es activas primero, luego nombre y apellido.

## Aislamiento y reglas

El queryset de la API se filtra siempre por `request.user`. La propietaria se asigna en el servidor durante el alta y no se expone como campo editable ni de respuesta. Las rutas de detalle, edición y acciones consultan ese mismo queryset, por lo que una clienta ajena responde `404` y no revela su existencia.

La desactivación conserva toda la información. Por defecto el listado muestra activas; `estado=inactivas` y `estado=todas` cambian ese filtro. El parámetro `search` busca por nombre, apellido, teléfono o email.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/clientas/?search=&estado=activas` | Lista las clientas propias. |
| POST | `/api/clientas/` | Crea una clienta para la usuaria autenticada. |
| GET | `/api/clientas/:id/` | Muestra la ficha propia. |
| PATCH | `/api/clientas/:id/` | Edita la ficha propia. |
| POST | `/api/clientas/:id/desactivar/` | La conserva como inactiva. |
| POST | `/api/clientas/:id/reactivar/` | La vuelve a mostrar entre las activas. |

`DELETE` no está habilitado. Todas las rutas requieren JWT mediante la autenticación configurada en Capa 2.

## Frontend

El módulo reutiliza `apiClient`, incluidos el access token y el refresh controlado. Las páginas no acceden a tokens directamente. El listado usa tarjetas responsivas, buscador y filtro de estado; la ficha permite editar y confirma antes de desactivar. Se muestran estados de carga, validaciones del backend, errores de red y estados vacíos sin datos ficticios.

## Pruebas y decisiones técnicas

Las pruebas cubren creación autenticada y anónima, asignación de propietaria, aislamiento entre cuentas, detalle, edición, acciones de estado, validaciones, búsqueda, filtros, `DELETE` bloqueado, autenticación y salud. Para no depender de servicios externos, la suite Django usa la base SQLite en memoria ya configurada solo para comandos de prueba; la aplicación continúa configurada para PostgreSQL.

No se agregó `django-filter`: los filtros necesarios se resuelven con parámetros simples y `Q` de Django, sin sumar dependencias.

## Criterio de cierre

La capa queda implementada cuando las pruebas backend, lint y build frontend pasan, y queda pendiente de validación manual completa con Docker disponible antes del commit. No avanza a ningún módulo de negocio adicional.
