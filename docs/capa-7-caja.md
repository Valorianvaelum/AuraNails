# Capa 7 — Caja diaria

## Estado

**Capa 7 en progreso.** Esta entrega implementa solamente la Capa 7A: modelo, reglas de negocio, API privada, migración y pruebas backend. No incluye frontend ni cierra la capa.

## Alcance implementado

### Caja

- Apertura con saldo inicial mayor o igual que cero y observación opcional.
- Una única caja `abierta` por propietaria, garantizada por validación transaccional y constraint condicional de base de datos.
- Historial global de cajas propias, ordenado por apertura más reciente, con filtros opcionales por `estado` y `fecha`.
- Detalle con resumen por método de pago, total de cobros, total de gastos, aportes, retiros y saldo teórico.
- Cierre con saldo contado. La diferencia se calcula como `saldo_contado - saldo_teorico`; una diferencia distinta de cero exige observación.
- La caja cerrada guarda el resumen de cierre y queda inmutable mediante la API.

### Cobros automáticos

Cada cobro nuevo se vincula automáticamente, dentro de la misma transacción, a la única caja `abierta` de su propietaria. La propietaria no puede enviar ni cambiar una caja manualmente. Si no existe una caja abierta, el cobro se rechaza con: `Debés abrir la caja antes de registrar un cobro.`

El resumen consulta exclusivamente los cobros `registrado` vinculados mediante esa relación; no compara fechas u horarios. Los cobros históricos existentes antes de esta migración quedan con caja `NULL`: se conservan intactos, no se asignan arbitrariamente y no participan en una caja nueva.

Los cuatro métodos son: `efectivo`, `transferencia`, `tarjeta` y `otro`.

- Todos aparecen discriminados en el resumen.
- Solo `efectivo` afecta el saldo físico teórico.
- Los cobros `anulado` no se incluyen.

### Gastos y movimientos manuales

- Los gastos requieren concepto, importe positivo y método de pago. Para `otro`, la observación es obligatoria.
- Los movimientos manuales son `aporte` o `retiro`; ambos requieren importe positivo y motivo.
- Gastos y movimientos tienen estados `registrado` y `anulado`.
- La anulación requiere motivo, conserva fecha y responsable, y no permite reactivación.
- Solo pueden registrarse o anularse dentro de una caja abierta.

## Regla de cálculo

```text
saldo teórico = saldo inicial
              + cobros activos en efectivo
              + aportes activos
              - gastos activos en efectivo
              - retiros activos
```

Transferencias, tarjetas y otros medios se exponen en los totales por método, pero no se suman ni restan del efectivo físico.

## API privada

Todas las rutas requieren autenticación y solo exponen recursos de la propietaria autenticada. Un identificador ajeno responde `404`.

- `GET /api/cajas/` — historial; filtros opcionales `estado` y `fecha`.
- `POST /api/cajas/` — abrir caja.
- `GET /api/cajas/:id/` — detalle y resumen.
- `POST /api/cajas/:id/cerrar/` — cerrar caja.
- `POST /api/cajas/:id/gastos/` — registrar gasto.
- `POST /api/cajas/:id/gastos/:gasto_id/anular/` — anular gasto.
- `POST /api/cajas/:id/aportes/` — registrar aporte.
- `POST /api/cajas/:id/retiros/` — registrar retiro.
- `POST /api/cajas/:id/movimientos/:movimiento_id/anular/` — anular movimiento.

No se exponen `PUT`, `PATCH` ni `DELETE`.

## Migración

`aplicaciones/caja/migrations/0001_initial.py` crea `Caja`, `GastoCaja` y `MovimientoCaja`, sus índices y constraints. `aplicaciones/cobros/migrations/0002_cobro_caja.py` agrega la relación nullable de Cobro con Caja para preservar los datos existentes sin asignación arbitraria. No modifica migraciones previas.

## Pruebas implementadas

- autenticación, apertura válida, saldo inicial inválido y una caja abierta por propietaria;
- historial sin fecha obligatoria, filtros y aislamiento con `404`;
- rechazo de cobro sin caja abierta, asociación automática, no selección de caja ajena o cerrada y separación entre cajas de distintas propietarias;
- cálculo separado de efectivo, transferencia, tarjeta y cobros anulados;
- gastos, aportes, retiros y anulaciones con motivo;
- bloqueo de operaciones sobre cajas cerradas;
- cierre con y sin diferencia, observación obligatoria y preservación del resumen de cierre;
- rechazo de edición y eliminación genéricas.

## Fuera de alcance

- Pantallas, navegación e integración visual de Caja.
- Reportes, estadísticas, conciliación bancaria, arqueos avanzados y exportaciones.
- Pagos parciales, señas, cuentas corrientes, proveedores, compras y productos.
- Notificaciones, pasarelas de pago, comprobantes fiscales y cambios en Cobros o Turnos.
