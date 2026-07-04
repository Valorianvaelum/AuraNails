# Módulos principales

AuraNails se organiza en módulos simples, pensados desde el lenguaje cotidiano de una manicura.

La prioridad es que cada módulo responda una pregunta clara.

## 1. Inicio

Pregunta que responde:

> ¿Qué tengo que hacer hoy?

Debe mostrar:

- Turnos del día.
- Próximo turno.
- Señales pendientes.
- Cobros del día.
- Productos con bajo stock.
- Avisos importantes.

No debe estar sobrecargado con gráficos complejos en la primera versión.

## 2. Turnos

Pregunta que responde:

> ¿A quién atiendo y cuándo?

Funciones:

- Crear turno.
- Editar turno.
- Cancelar turno.
- Reprogramar turno.
- Marcar como confirmado.
- Marcar como finalizado.
- Marcar como no vino.
- Asociar clienta.
- Asociar servicio.
- Registrar seña.

Estados iniciales:

- Pendiente.
- Confirmado.
- Finalizado.
- Cancelado.
- No vino.

## 3. Clientas

Pregunta que responde:

> ¿A quién atiendo y qué necesito recordar?

Funciones:

- Registrar clienta.
- Editar datos.
- Ver historial de turnos.
- Ver servicios realizados.
- Ver señas/deudas.
- Registrar observaciones.
- Guardar preferencias.

Datos importantes:

- Nombre.
- Teléfono.
- Instagram opcional.
- Cumpleaños opcional.
- Observaciones.
- Preferencias.
- Alergias o cuidados especiales.

## 4. Servicios

Pregunta que responde:

> ¿Qué ofrezco y cuánto cobro?

Funciones:

- Crear servicio.
- Editar servicio.
- Activar/inactivar servicio.
- Definir precio base.
- Definir duración estimada.

Ejemplos:

- Esmaltado semipermanente.
- Kapping gel.
- Soft gel.
- Esculpidas.
- Retiro.
- Nail art simple.
- Nail art complejo.
- Reparación de uña.

## 5. Cobros y señas

Pregunta que responde:

> ¿Cuánto cobré y qué falta pagar?

Funciones:

- Registrar cobro total.
- Registrar seña.
- Registrar pago parcial.
- Registrar saldo pendiente.
- Registrar método de pago.
- Asociar cobro a turno.

Métodos iniciales:

- Efectivo.
- Transferencia.
- Mercado Pago.
- Tarjeta.
- Mixto.

## 6. Productos

Pregunta que responde:

> ¿Qué tengo y qué falta comprar?

Funciones:

- Registrar producto.
- Editar producto.
- Ver stock actual.
- Definir stock mínimo.
- Registrar compra.
- Registrar consumo.
- Ver productos por terminarse.

Lenguaje recomendado:

- Usar “Productos”, no “Inventario”.
- Usar “queda poco”, no “stock crítico”.

## 7. Gastos y ganancias

Pregunta que responde:

> ¿Cuánto entró, cuánto salió y cuánto quedó?

Funciones:

- Registrar gasto.
- Categorizar gasto.
- Ver ingresos del mes.
- Ver gastos del mes.
- Ver ganancia aproximada.

Cálculo simple inicial:

```text
Ganancia aproximada = Cobros registrados - Gastos registrados
```

## 8. Fotos de trabajos

Pregunta que responde:

> ¿Qué trabajos hice antes?

Funciones:

- Subir foto de trabajo.
- Asociar foto a clienta.
- Asociar foto a turno.
- Registrar servicio realizado.
- Agregar observaciones.

Este módulo es importante porque el rubro es altamente visual.

## 9. Configuración

Pregunta que responde:

> ¿Cómo trabaja mi negocio?

Funciones iniciales:

- Datos del negocio.
- Horarios de atención.
- Métodos de pago.
- Política de seña.
- Preferencias básicas de la app.

## Criterio visual para todos los módulos

Cada pantalla debe priorizar:

1. Qué está pasando.
2. Qué acción puede hacer la usuaria.
3. Qué información secundaria necesita.

No se deben mostrar datos técnicos innecesarios.
