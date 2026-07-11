# Capa 6 — Cobros de turnos

## Estado

La **Capa 6A — Modelo, reglas de negocio y API** está implementada. La **Capa 6B — Frontend e integración con Turnos** está implementada y pendiente de validación final. La Capa 6C (validación integral y recorrido manual) sigue pendiente. Capa 6 no está cerrada.

La implementación 6A incorpora un modelo de Cobro, migración, API privada de listado, creación, detalle y anulación explícita. Mantiene un único cobro activo por turno mediante constraint condicional y creación transaccional. Los importes y el nombre de clienta se conservan desde los datos históricos del turno.

La implementación 6B incorpora cliente API, listado global con filtros opcionales, detalle, registro desde un turno realizado, anulación con motivo e integración del estado de cobro en el detalle de Turnos. No agrega estados financieros al Turno ni modifica las reglas backend de Cobros.

## Objetivo

Cerrar el flujo operativo básico:

```text
Clienta → Servicio → Turno → Turno realizado → Cobro
```

El módulo registrará el resultado económico de un turno realizado usando la información histórica preservada en ese turno.

## Alcance funcional

### 1. Cobro vinculado a un turno

Cada cobro pertenecerá a una propietaria y a un turno propio. La clienta, los servicios históricos y el importe se derivarán del snapshot del turno; un cambio posterior en el precio de un servicio no modificará cobros históricos.

### 2. Condición para cobrar

Solo podrá cobrarse un turno `realizado`. Se rechazarán turnos `pendiente`, `confirmado`, `reprogramado`, `cancelado` y `no_vino`.

### 3. Un cobro activo por turno

- Un turno tendrá como máximo un cobro activo.
- Se bloquearán cobros duplicados.
- Un cobro anulado no se eliminará físicamente.
- Si el único cobro previo está anulado, podrá registrarse un nuevo cobro activo.
- No se implementarán pagos parciales.

### 4. Importe

El importe base provendrá del total histórico del turno y no podrá modificarse libremente. Quedan fuera descuentos, promociones, cupones, recargos, edición manual arbitraria y división del pago.

### 5. Métodos de pago

Métodos iniciales:

```text
efectivo
transferencia
tarjeta
otro
```

Para `otro` podrá guardarse una observación breve. No habrá integración con pasarelas de pago.

### 6. Estados del cobro

```text
registrado
anulado
```

`registrado` será el cobro activo y se incluirá en totales. `anulado` se conservará históricamente, no se incluirá en totales y deberá registrar motivo, fecha de anulación y la propietaria o usuario responsable según la arquitectura existente. No existirá `DELETE`.

### 7. Listado global

La pantalla funcionará sin fecha obligatoria. Sin filtros mostrará todos los cobros de la propietaria, ordenados por los más recientes primero. Admitirá búsqueda por nombre de clienta y filtros opcionales por fecha, método de pago y estado, combinados por intersección, con una acción clara para limpiarlos.

No deberá repetirse el problema anterior de Turnos: una fecha no podrá restringir silenciosamente el listado.

### 8. Detalle del cobro

El detalle mostrará identificador interno, clienta, turno relacionado, fecha y horario del turno, fecha y hora del cobro, servicios y duración históricos si están disponibles, importe, método, estado, observaciones y datos de anulación. Permitirá volver al turno relacionado.

### 9. Integración con Turnos

En un turno `realizado` sin cobro activo se mostrará una acción equivalente a “Registrar cobro”. Con cobro activo se mostrará “Cobrado” y “Ver cobro”. Si el cobro previo fue anulado y no existe otro activo, se podrá registrar uno nuevo.

El Turno mantendrá su estado `realizado`: la prestación y el pago son conceptos separados. No se agregarán estados financieros al modelo de Turnos.

### 10. Resumen económico básico

Podrán mostrarse únicamente total cobrado hoy, cantidad de cobros de hoy y total correspondiente al listado filtrado. Solo incluirán cobros activos; no se transformará esta capa en una caja o módulo de estadísticas.

## Seguridad y aislamiento

- Autenticación obligatoria.
- Cada propietaria accederá solo a sus cobros y turnos.
- Recursos ajenos, incluidos turnos usados para registrar cobros, responderán `404`.
- Clienta, servicios e importe no se seleccionarán libremente para reemplazar datos del turno.
- No habrá exposición cruzada entre propietarias.

## Datos y auditoría mínima

El futuro modelo contemplará, según las convenciones reales del proyecto: propietaria, turno, importe, método de pago, observación, estado, fecha de registro, actualización, anulación y motivo de anulación. No se diseñará aún una auditoría general si no existe.

## Pantallas y API esperadas

Pantallas futuras: listado de cobros, flujo de registro desde el turno, detalle, confirmación de anulación e integración visual con Turnos.

La API se definirá respetando la arquitectura real al implementarse: listado, creación controlada desde un turno realizado, detalle, anulación mediante acción explícita, filtros y búsqueda. No contemplará `DELETE`.

## Pruebas mínimas futuras

- Creación válida desde turno realizado y rechazo de turnos no realizados.
- Bloqueo de cobro duplicado y nuevo cobro después de una anulación.
- Aislamiento por propietaria y `404` en recursos ajenos.
- Importe proveniente del snapshot y anulación con motivo.
- Exclusión de anulados en totales.
- Listado global sin fecha obligatoria, filtros combinados e integración con Turnos.
- Validación frontend, lint, build, suite backend y configuración Docker.

## Fuera de alcance

- Caja diaria, apertura/cierre de caja, gastos, compras y proveedores.
- Señas, anticipos, pagos parciales, cuentas corrientes, deudas, financiación, cuotas y pagos combinados.
- Descuentos, promociones, cupones y comisiones de tarjeta.
- Conciliación bancaria, Mercado Pago u otras pasarelas.
- Facturación ARCA, comprobantes fiscales, recibos PDF y exportación Excel.
- Estadísticas avanzadas, cierres mensuales, notificaciones automáticas y agenda mensual.
- Cambios al mecanismo de autenticación.

## Subdivisión de trabajo

```text
Capa 6A — Modelo, reglas de negocio y API
Capa 6B — Frontend e integración con Turnos
Capa 6C — Validación integral, documentación y recorrido manual
```

Se utilizará posteriormente una sola rama: `capa-6-cobros`. No se crea durante esta tarea.

## Criterios de aceptación

1. Se puede registrar un cobro desde un turno realizado con importe histórico.
2. No existe más de un cobro activo por turno ni se cobran turnos no realizados.
3. Cobros y turnos están aislados por propietaria.
4. El listado es global con filtros opcionales y se consulta el detalle.
5. Se puede anular con motivo; los anulados no se incluyen en totales ni se eliminan físicamente.
6. El turno muestra claramente su estado de cobro sin dejar de estar realizado.
7. Tests, validaciones, documentación y recorrido manual confirman un comportamiento claro.
