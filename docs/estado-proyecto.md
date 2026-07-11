# Estado del proyecto

## Producto

AuraNails es una web app simple para manicuras y pequeños estudios de uñas. El producto usa lenguaje cercano: Turnos, Clientas, Servicios, Productos, Dinero y Fotos.

## Capas

- Capa 0 documental: completada.
- Capa 1 setup técnico inicial: completada.
- Capa 2 usuarios y autenticación: completada.
- Capa 3 clientas: implementada.
- Capa 4 servicios: implementada.
- Capa 5 — Turnos: **cerrada y estable**.

## Capa 5 — Turnos

Commits de referencia:

```text
525d416 feat: agregar modulo de turnos
bc574fb fix: mejorar consulta y experiencia de turnos
```

El módulo incluye listado global, filtro opcional por fecha, búsqueda por nombre de clienta, filtros por estado combinables, alta, detalle, edición, reprogramación, detección de superposiciones y snapshot histórico de servicios, duración y precio. Los datos están aislados por propietaria y las transiciones de estado se controlan en backend, incluyendo `confirmar`, `cancelar`, `realizar` y `no_vino`.

El frontend integra los flujos de Turnos, el saludo personalizado del dashboard y la aclaración de Servicios “Posición en la lista”.

Validaciones registradas: `manage.py check`, migraciones sin cambios pendientes, tests de Turnos 9/9, suite backend 42/42, lint y build frontend, `docker-compose config` y `git diff --check`, todos correctos.

El smoke test con contenedores en ejecución queda pendiente por falta de acceso local al daemon de Docker. Compose fue validado; esto es una verificación operativa pendiente y no un defecto confirmado del módulo.

## Próxima etapa

**Capa 6 — Cobros de turnos**. El contrato previo a su implementación está en [capa-6-cobros.md](capa-6-cobros.md). La futura rama única será `capa-6-cobros`; no se creó todavía.
