# Reglas de negocio

Este documento define reglas funcionales que AuraNails debe respetar.

Las reglas están escritas en lenguaje simple para mantener claridad durante el desarrollo.

## Reglas de turnos

1. Un turno debe tener fecha y hora.
2. Un turno debe estar asociado a una clienta.
3. Un turno debe estar asociado al menos a un servicio.
4. No se deben borrar turnos finalizados.
5. Un turno cancelado debe conservarse en el historial.
6. Un turno puede tener observaciones.
7. Un turno puede tener una seña asociada.
8. Un turno puede cambiar de estado.

Estados iniciales:

- Pendiente.
- Confirmado.
- Finalizado.
- Cancelado.
- No vino.

Correspondencia técnica actual de Capa 5:

- Finalizado / Realizado → `realizado`.
- No vino → `no_vino`.

`cancelado` y `no_vino` son estados distintos: el primero registra una cancelación y el segundo que la clienta no se presentó. `realizado` registra que el servicio fue efectuado.

## Reglas de clientas

1. Una clienta debe tener nombre.
2. El teléfono es recomendado, pero puede no estar cargado al inicio.
3. Una clienta puede tener observaciones.
4. Una clienta puede tener preferencias.
5. Una clienta puede tener historial de turnos.
6. Una clienta puede tener deudas o saldos pendientes.
7. No se debe borrar una clienta con historial importante; debe poder marcarse como inactiva.
8. Para una misma propietaria, el correo y el teléfono informados deben ser únicos. El correo se compara sin espacios exteriores ni mayúsculas; el teléfono se compara solo por sus dígitos.

## Reglas de servicios

1. Un servicio debe tener nombre.
2. Un servicio debe tener precio base.
3. Un servicio puede tener duración estimada.
4. Un servicio puede estar activo o inactivo.
5. Un servicio inactivo no debe aparecer como opción principal al crear nuevos turnos.
6. Cambiar el precio de un servicio no debe modificar cobros históricos.

## Reglas de cobros y señas

1. Un cobro debe estar asociado a una clienta o a un turno.
2. Un turno puede tener seña.
3. Una seña se descuenta del total a cobrar.
4. Puede existir saldo pendiente.
5. El sistema debe diferenciar cobro total, seña y pago parcial.
6. Los pagos no deberían eliminarse sin dejar rastro; a futuro deberían anularse o corregirse.

### Reglas implementadas en Capa 6 — Cobros

1. Solo los turnos `realizado` podrán cobrarse.
2. Un turno tendrá como máximo un cobro activo.
3. Un cobro anulado se conservará históricamente, no se eliminará físicamente y no se incluirá en totales.
4. La anulación requerirá motivo; si no queda otro cobro activo, podrá registrarse uno nuevo.

La integración visual con Turnos está implementada. Totales económicos y extensiones de caja siguen fuera del alcance de Capa 6.

## Reglas de caja diaria

### Reglas implementadas en Capa 7A — Caja

1. Una propietaria puede tener una sola caja `abierta` a la vez. El saldo inicial debe ser mayor o igual que cero.
2. Una caja puede estar `abierta` o `cerrada`. Una caja cerrada no admite gastos, aportes, retiros, anulaciones ni un nuevo cierre.
3. Todo cobro nuevo requiere una caja propia `abierta` y queda vinculado a ella automáticamente. Si no existe, se rechaza con “Debés abrir la caja antes de registrar un cobro.” La propietaria no puede elegir ni cambiar la caja.
4. El saldo físico teórico se calcula en backend: saldo inicial + cobros en efectivo + aportes - gastos en efectivo - retiros. Transferencia, tarjeta y otro se informan por método, pero no modifican el efectivo físico.
5. Los gastos y movimientos manuales usan los estados `registrado` y `anulado`; la anulación conserva motivo, fecha y responsable. No hay eliminación física ni reactivación.
6. Los movimientos manuales son `aporte` o `retiro`, requieren importe positivo y motivo, y solo pueden registrarse en una caja abierta.
7. El cierre requiere saldo contado. La diferencia es saldo contado - saldo teórico; si no es cero, requiere observación.
8. Al cerrar se conserva el resumen calculado para que el resultado histórico de la caja no cambie por anulaciones posteriores de cobros.
9. Los totales consultan cobros `registrado` vinculados a la caja, no ventanas horarias. Los cobros históricos sin caja se conservan sin asignación arbitraria y no se incorporan a cajas nuevas.
10. Cada propietaria solo puede consultar y operar sus propios registros; los recursos ajenos responden `404`.

## Reglas de productos

1. Un producto debe tener nombre.
2. Un producto puede tener categoría.
3. Un producto puede tener stock actual.
4. Un producto puede tener stock mínimo.
5. Si el stock actual es menor o igual al stock mínimo, debe mostrarse aviso.
6. El sistema debe evitar stock negativo, salvo ajuste autorizado en una etapa futura.
7. Las compras aumentan stock.
8. Los consumos disminuyen stock.

## Reglas de gastos

1. Un gasto debe tener fecha.
2. Un gasto debe tener monto.
3. Un gasto puede tener categoría.
4. Un gasto afecta la ganancia aproximada del mes.
5. Los gastos deben poder filtrarse por fecha y categoría.

## Reglas de fotos de trabajos

1. Una foto puede asociarse a una clienta.
2. Una foto puede asociarse a un turno.
3. Una foto puede tener observaciones.
4. Una foto debe conservarse como historial visual.

## Regla general de simplicidad

Si una regla o función obliga a la usuaria a pensar demasiado, debe revisarse.

AuraNails debe priorizar claridad por encima de sofisticación.
