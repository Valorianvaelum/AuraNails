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

La Capa 8A queda implementada. La Capa 8B y la Capa 8C quedan pendientes de sus etapas de validación; la Capa 8 completa no está cerrada.

## Capa 8B — Interfaz diaria y semanal

La interfaz incorpora la ruta privada `/agenda`, con selector Día/Semana, navegación por fechas, vuelta a Hoy, filtros opcionales por estado, clienta y búsqueda parcial. Reutiliza la API de 8A y los datos históricos del turno; no crea disponibilidad ni horarios laborales.

La vista diaria muestra tarjetas completas y la semanal organiza de lunes a domingo en columnas adaptables. Desde la Agenda se abre el detalle, se permite editar o reprogramar turnos abiertos y se inicia el formulario existente con la fecha seleccionada. Las acciones sensibles y los cobros permanecen centralizados en el detalle.

La Capa 8B está implementada y pendiente de validación final. La Capa 8C y el cierre total de Capa 8 siguen pendientes.
