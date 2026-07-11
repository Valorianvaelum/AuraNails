# Capa 5 — Turnos

## Estado

**Cerrada y estable.**

Commits de referencia:

```text
525d416 feat: agregar modulo de turnos
bc574fb fix: mejorar consulta y experiencia de turnos
```

## Capacidades cerradas

- Listado global de turnos, con próximos turnos priorizados.
- Filtro opcional por fecha, filtros por estado y búsqueda parcial por nombre de clienta.
- Combinación de filtros por intersección y acción para limpiarlos.
- Alta, detalle, edición y reprogramación controlada.
- Detección de superposiciones; los turnos cancelados liberan su horario.
- Snapshot histórico de servicios, duración y precio estimado.
- Aislamiento por propietaria y respuesta `404` para recursos ajenos.
- Transiciones controladas: `confirmar`, `cancelar`, `realizar` y `no_vino`.
- Estados terminales: `cancelado`, `realizado` y `no_vino`.
- Validaciones temporales: no se puede realizar ni marcar como no vino un turno futuro.
- Integración frontend con carga, errores, vacíos, filtros y acciones contextuales.
- Saludo personalizado seguro en el dashboard.
- Campo de Servicios aclarado como “Posición en la lista”.

## Reglas operativas

Un turno pertenece a una propietaria y a una clienta propia. Debe incluir uno o más servicios propios y activos al crearse. La duración y el precio estimado se derivan de los servicios, y su snapshot queda preservado aunque esos servicios cambien posteriormente.

Dos turnos no cancelados de la misma propietaria no pueden superponerse; los horarios consecutivos sí están permitidos. La reprogramación recibe únicamente `inicio`, recalcula `fin` con la duración guardada y no modifica clienta, servicios ni notas.

La correspondencia visible es Finalizado / Realizado → `realizado` y No vino → `no_vino`. `cancelado` y `no_vino` son estados distintos: el primero registra una cancelación y el segundo una ausencia.

## Validaciones registradas

- `manage.py check` — OK.
- Migraciones sin cambios pendientes.
- Tests específicos de Turnos — 9/9 OK.
- Suite backend — 42/42 OK.
- Lint frontend — OK.
- Build frontend — OK.
- `docker-compose config` — OK.
- `git diff --check` — OK.

## Riesgo no bloqueante

No se pudo completar el smoke test con contenedores en ejecución por falta de acceso local al daemon de Docker. La configuración Compose sí fue validada. Este punto queda como verificación operativa pendiente y no como defecto confirmado del módulo.
