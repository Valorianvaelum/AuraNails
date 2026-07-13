# Capa 8 — Agenda visual

## Objetivo

Permitir que la propietaria consulte y organice sus turnos mediante una agenda diaria y semanal clara, sin modificar las reglas de negocio consolidadas.

## Alcance general

La agenda permitirá visualizar turnos por día y semana, navegar fechas, identificar estados, abrir el detalle de un turno, iniciar su alta desde una fecha y hora y filtrar por estado y clienta. Mostrará bloques ocupados y espacios sin turnos, siempre aislados por propietaria.

## Subcapas

- Capa 8A — Datos y API de Agenda.
- Capa 8B — Interfaz diaria y semanal.
- Capa 8C — Validación, pulido y cierre.

## Capa 8A — Datos y API

La fuente única es el modelo `Turno`; no se crea una tabla de agenda. La API privada `GET /api/turnos/agenda/` permite consultar:

- un día: `?fecha=YYYY-MM-DD`;
- una semana de lunes a domingo: `?semana=YYYY-MM-DD`;
- un rango inclusivo de hasta siete días: `?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`.

Los filtros opcionales `estado`, `search` y `clienta_id` se combinan por intersección. La respuesta conserva inicio, fin, duración, servicios y precio históricos, estado técnico y etiqueta humana, notas y estado de cobro ya expuesto de forma segura. No supone horarios laborales: entrega solamente los bloques ocupados.

## Fuera de alcance

No incluye grilla horaria compleja, arrastrar y soltar, calendario mensual, Google Calendar, recordatorios, WhatsApp, múltiples profesionales, disponibilidad avanzada, turnos recurrentes, reservas públicas, notificaciones ni cambios a Caja o Cobros.

La Capa 8A quedó completada como fuente de datos de la Agenda.

## Capa 8B — Interfaz diaria y semanal

La interfaz incorpora la ruta privada `/agenda`, con selector Día/Semana, navegación por fechas, vuelta a Hoy, filtros opcionales por estado, clienta y búsqueda parcial. Reutiliza la API de 8A y los datos históricos del turno; no crea disponibilidad ni horarios laborales.

La vista diaria muestra tarjetas completas y la semanal organiza de lunes a domingo en columnas adaptables. Desde la Agenda se abre el detalle, se permite editar o reprogramar turnos abiertos y se inicia el formulario existente con la fecha seleccionada. Las acciones sensibles y los cobros permanecen centralizados en el detalle.

La Capa 8B quedó completada con la interfaz diaria y semanal.

## Correcciones detectadas durante 8C

La creación de un turno del mismo día conserva la regla existente: se permite si su inicio no pasó y no se superpone con otro turno propio. El formulario ahora conserva los mensajes específicos enviados por backend, incluso cuando un error de campo llega como texto simple.

Clientas valida en backend que un teléfono informado contenga entre 7 y 15 dígitos y solo use números, espacios, guiones, paréntesis y un `+` inicial. La normalización y unicidad por propietaria se conservan; los registros históricos no se alteran automáticamente y deberán corregirse al volver a editarse si no cumplen la nueva validación. El correo se recorta, normaliza y muestra mensajes claros ante formato inválido o duplicado.

## Cierre de Capa 8

**Estado: cerrada y estable.**

Subcapas completadas:

- Capa 8A — Datos y API de Agenda.
- Capa 8B — Interfaz diaria y semanal.
- Capa 8C — Validación manual, manejo de errores y cierre.

Capacidades validadas:

- consulta diaria y semanal de lunes a domingo;
- navegación entre fechas y semanas, incluida la acción Hoy;
- filtros por estado, clienta y búsqueda;
- creación desde fecha seleccionada y precarga del formulario existente;
- detalle, edición y reprogramación según corresponda;
- estados visuales, cobro visible en turnos realizados y diseño responsive;
- aislamiento por propietaria;
- turnos del mismo día cuando son futuros y no se superponen;
- mensajes específicos ante superposición, turno pasado y errores de formulario;
- validación, normalización y detección de duplicados de teléfono y email.

La Agenda muestra solamente turnos existentes. No afirma disponibilidad ni horarios libres porque todavía no existen horarios laborales configurados; la disponibilidad avanzada queda fuera del alcance de Capa 8.

Commits de referencia:

- `42607f5 feat: agregar api de agenda`;
- `b1761ec feat: agregar agenda visual`;
- el cierre documental final queda pendiente de commit.
