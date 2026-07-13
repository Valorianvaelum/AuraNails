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

No incluye todavía interfaz visual, grilla horaria, rutas o navegación de Agenda, arrastrar y soltar, calendario mensual, Google Calendar, recordatorios, WhatsApp, múltiples profesionales, disponibilidad avanzada, turnos recurrentes, reservas públicas, notificaciones ni cambios a Caja o Cobros.

La Capa 8A queda implementada y pendiente de revisión. Las Capas 8B y 8C quedan pendientes; la Capa 8 completa no está cerrada.
