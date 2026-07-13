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
- Capa 6 — Cobros: **cerrada y estable**.

## Capa 7 — Caja diaria

**En progreso.** La Capa 7A backend incorpora apertura y cierre de caja, gastos, aportes y retiros. La Capa 7B frontend incorpora la pantalla de caja abierta, apertura, cierre, gastos, movimientos, historial, detalle, navegación, acceso desde Inicio e integración visual con Cobros. Cada cobro nuevo se asocia automáticamente a la caja abierta de su propietaria; sin caja abierta se rechaza. El saldo teórico se calcula en servidor a partir de cobros vinculados y separa los ingresos informativos por método de pago del efectivo físico. Las cajas cerradas preservan su resumen de cierre y no admiten nuevas operaciones.

La Capa 7C completó validaciones técnicas, smoke runtime y regresión de Caja, Cobros y Turnos. El recorrido visual autenticado queda pendiente porque el navegador de validación no estuvo disponible en este entorno. Reportes, conciliación, pagos parciales e integraciones externas siguen fuera de alcance. La Capa 7 no está cerrada plenamente en runtime.

Correcciones posteriores al recorrido manual: el detalle de Turno ahora agrupa las acciones permitidas y orienta el cobro desde un turno realizado; Inicio muestra el resumen diario usando filtros existentes; Clientas bloquea correo y teléfono duplicados por propietaria mediante normalización y constraints. La Capa 7 sigue pendiente de otro recorrido manual antes del cierre.

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

**Capa 6 — Cobros de turnos: cerrada y estable.**

Commits de referencia:

```text
a5554d6 feat: agregar backend de cobros
6df2dbe feat: agregar frontend de cobros
```

Incluye cobro desde turno realizado, importe histórico, un cobro activo por turno, anulación con motivo, nuevo cobro posterior a una anulación, aislamiento por propietaria, listado global con filtros opcionales, detalle histórico e integración con Turnos. No expone edición ni eliminación de cobros.

Las validaciones técnicas de Cobros, Turnos, suite backend, lint, build, migraciones y Compose config finalizaron correctamente. El recorrido manual y el runtime Docker quedan pendientes por falta de acceso local al daemon, sin defecto funcional confirmado.
