# Capa 4: Servicios

## Objetivo y alcance

Permite a cada usuaria crear, buscar, editar, pausar y reactivar exclusivamente sus propios servicios. No crea turnos, cobros, descuentos, promociones, productos ni relaciones con otros módulos.

## Modelo y reglas

`Servicio` pertenece a la usuaria autenticada y contiene nombre, descripción opcional, duración estimada en minutos, precio decimal, estado activo, orden visual y fechas de creación/actualización. La duración debe estar entre 1 y 720 minutos, el precio es mayor que cero y el orden no puede ser negativo. El listado prioriza activos, luego orden y nombre.

## API y aislamiento

- `GET`, `POST /api/servicios/`
- `GET`, `PATCH /api/servicios/:id/`
- `POST /api/servicios/:id/pausar/`
- `POST /api/servicios/:id/reactivar/`

El listado admite `search`, `estado=activos|pausados|todos`. El queryset siempre se limita a `propietaria=request.user`; un recurso ajeno devuelve `404`. `DELETE` no está disponible.

## Frontend

Las rutas protegidas son `/servicios`, `/servicios/nuevo`, `/servicios/:id` y `/servicios/:id/editar`. Reutilizan el cliente Axios y el refresh de sesión de Capa 2. El precio se muestra con `Intl.NumberFormat` para pesos argentinos y la duración se entrega en formato legible desde la API.

## Validación y exclusiones

Las pruebas cubren creación, aislamiento, edición, pausa/reactivación, validaciones, búsqueda, filtros, `DELETE` y regresiones básicas. La capa está implementada, pendiente de validación completa con Docker y commit. No avanza a Turnos.
