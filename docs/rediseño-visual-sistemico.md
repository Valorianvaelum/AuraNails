# Rediseño visual sistémico

## Problema inicial

La interfaz funcionaba correctamente, pero acumulaba colores locales, botones de distinta silueta, superficies demasiado próximas al fondo y selectores globales frágiles. Esto reducía la jerarquía y hacía que los módulos operativos se sintieran más administrativos que acompañantes.

## Principios del sistema

- Canvas greige cálido y superficies marfil-rosadas claramente diferenciadas.
- Contraste contenido mediante bordes, tonos y espaciado; sin sombras dominantes.
- Geometría precisa: controles de 44 px, radios reutilizables y tarjetas con acento lateral discreto.
- Tipografía editorial sobria: títulos compactos, etiquetas atenuadas y valores principales destacados.
- Retro-futurismo japonés reinterpretado mediante orden, líneas y ritmo, sin neón ni recursos literales.

## Tokens y capas

`index.css` define tokens semánticos para canvas, superficies, bordes, texto, marca y estados. Las cinco capas son canvas, página, secciones, tarjetas y controles. Las primitivas `ui-surface`, `ui-section`, `ui-card`, `ui-card-muted`, `ui-value` y `ui-value-primary` expresan esta jerarquía.

## Acciones, estados y formularios

La familia `ui-button` establece variantes primaria, secundaria, contextual, destructiva y de advertencia; `ui-badge` reúne estados neutro, marca, éxito, advertencia y destructivo. Los campos conservan ARIA, errores inline, foco y prevención de doble envío, con borde y foco común.

## Decisiones por módulo

- Navbar: marca estable, etiqueta de identidad `Estudio`, navegación activa integrada y acciones legibles.
- Inicio: bienvenida, resumen y accesos rápidos organizados en superficies y acciones consistentes.
- Turnos y Agenda: tarjetas con horario, clienta y estado legibles; filtros y navegación permanecen separados funcionalmente.
- Caja y Cobros: conservan la jerarquía financiera, acciones y confirmaciones de la auditoría previa, ahora bajo los tokens generales.
- Clientas, Servicios, formularios y detalles: heredan controles, superficies, foco y contraste del sistema sin alterar su lógica.

## Elementos conservados

No se modifican backend, API, rutas, reglas, datos, permisos, cálculos, mensajes de negocio, callbacks, validaciones ni flujos de confirmación.

## Validación pendiente

La revisión manual en navegador para 1440 px, 1024 px, 768 px y 390 px permanece pendiente. Este rediseño no constituye una nueva capa funcional.

## Ajustes derivados de auditoría UI/UX

La auditoría en navegador indicó cinco correcciones puntuales: los badges de Turnos y Agenda ahora diferencian pendiente, confirmado, reprogramado, realizado, cancelado y no vino mediante variantes semánticas con borde; las acciones de las tarjetas de Agenda alcanzan un área táctil mínima de 44 px; el detalle de Turno separa acción principal, secundarias y de consecuencia sin alterar condiciones ni confirmaciones.

Inicio filtra localmente los próximos turnos usando los datos existentes: día actual, hora futura y estados abiertos, ordenados cronológicamente. El contraste de `ui-eyebrow` se reforzó de forma centralizada y Caja conserva un único acceso estable a Historial en su encabezado. El recorrido manual de estos ajustes permanece pendiente.
