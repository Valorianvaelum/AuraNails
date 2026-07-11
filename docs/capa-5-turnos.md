# Capa 5: Turnos

## Objetivo y alcance

Permite a cada usuaria administrar sus propios turnos: listado diario, filtros, alta, detalle, edición, reprogramación y los cambios de estado habilitados. No incluye calendario avanzado, recordatorios, pagos, señas ni notificaciones.

## Datos y reglas aplicadas

Cada turno pertenece a una propietaria y a una clienta de esa misma propietaria. Debe incluir uno o más servicios propios y activos al crearse. Se guarda una copia del nombre, duración y precio de los servicios elegidos para conservar el historial aunque el servicio cambie después.

La duración y el precio estimado se calculan en el backend. Al crear no se admite una fecha pasada. Dos turnos no cancelados de la misma propietaria no pueden ocupar intervalos que se superpongan; los horarios consecutivos sí están permitidos. Un turno cancelado conserva su información y deja libre su horario.

Los estados implementados son `pendiente`, `confirmado`, `reprogramado`, `cancelado`, `realizado` y `no_vino`. La correspondencia visible es Finalizado / Realizado → `realizado` y No vino → `no_vino`. Solo el backend puede aplicar las siguientes transiciones:

- Pendiente o reprogramado a confirmado.
- Pendiente, confirmado o reprogramado a cancelado.
- Confirmado o reprogramado a realizado.
- Pendiente, confirmado o reprogramado a no vino, únicamente cuando su inicio ya ocurrió.
- Un turno cancelado, realizado o no vino no se puede editar ni reprogramar, ni cambiar nuevamente de estado.

No se puede marcar como realizado ni como no vino un turno cuyo inicio todavía es futuro.

La reprogramación recibe únicamente `inicio`; recalcula el fin con la duración ya guardada y no modifica clienta, servicios ni notas.

## API y aislamiento

- `GET /api/turnos/` admite `fecha`, `desde`, `hasta`, `estado`, `search` y `ordering=-inicio`.
- `POST /api/turnos/`
- `GET`, `PATCH /api/turnos/:id/`
- `POST /api/turnos/:id/confirmar/`
- `POST /api/turnos/:id/cancelar/`
- `POST /api/turnos/:id/realizar/`
- `POST /api/turnos/:id/no-vino/`
- `POST /api/turnos/:id/reprogramar/`

Todos los endpoints requieren sesión. El queryset se limita siempre a `propietaria=request.user`, por lo que un identificador ajeno responde `404`. No se expone `DELETE`.

## Frontend

Las rutas privadas son `/turnos`, `/turnos/nuevo`, `/turnos/:id`, `/turnos/:id/editar` y `/turnos/:id/reprogramar`. El listado permite navegar por día y filtrar por estado o clienta. Formularios, detalle y reprogramación informan carga, errores de API y estados sin resultados.

Al editar, se muestran también las clientas inactivas y servicios pausados ya disponibles para no ocultar datos vinculados a un turno existente. Al crear, sólo se ofrecen clientas activas y servicios activos.
