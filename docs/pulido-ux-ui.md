# Pulido UX/UI

## Objetivo y alcance

Tres rondas de mejora visual y de textos sobre la aplicación existente. No incorpora funcionalidades, dependencias ni cambios en reglas de negocio.

## Dirección estética aplicada

La interfaz combina una base marfil cálida, superficies casi blancas y acentos malva/ciruela de baja saturación. La referencia retro-futurista se traduce en precisión geométrica, contraste cuidado y detalles luminosos muy sutiles, sin llevar el producto hacia una estética cyberpunk, oscura o saturada.

Principios aplicados: calma visual, jerarquía clara, superficies livianas, bordes suaves, foco accesible y transiciones breves que no interrumpen la tarea.

## Problemas detectados

- Filtros y acciones secundarias tenían estilos dispares entre pantallas.
- Los elementos sin clases compartidas repetían una jerarquía visual débil.
- El encabezado se compactaba al reunir todas las secciones en anchos intermedios.
- Listados como Turnos necesitaban una separación más clara entre filtros, tarjetas y estados.

## Mejoras aplicadas

- Foco visible y consistente para enlaces, botones y campos.
- Tipografía coherente para `select` y `textarea`.
- Acciones secundarias sin clase con borde, radio y estado hover suaves.
- Encabezado con ancho útil mayor y navegación adaptable.
- Filtros de Turnos con mayor separación visual y tarjetas con jerarquía de lectura más clara.
- Fondo general marfil neutro y superficies cálidas para reducir la presencia del rosa de base.
- Navbar semitransparente, con módulo activo en píldora malva, borde y sombra delicados.
- Botón principal malva/ciruela con elevación mínima; controles secundarios con hover suave.
- Campos con borde, fondo, foco y transición consistentes.
- Tarjetas y paneles con separación ligera, sombras controladas y elevación mínima al interactuar.
- Inicio reequilibrado: tarjetas de resumen, próximos turnos y accesos rápidos con una jerarquía más respirada.
- Agenda de día y semana con controles, tarjetas y estados activos más claros.
- Respeto de `prefers-reduced-motion` para anular animaciones y transiciones no esenciales.
- Última ronda quirúrgica: marca AuraNails con trazo geométrico mínimo y subtítulo contextual, sin logo externo.
- Foco global más contenido; no hay borde superior deliberado en `body`, `#root` ni navbar.
- Listados de Clientas, Servicios, Turnos y Cobros con acento lateral, estado/dato relevante visible y hover preciso.
- Detalles de Clienta, Servicio y Cobro con estado, bloques de información, importes/duración destacados y acciones separadas.
- Formularios de Servicio con navegación de retorno uniforme, agrupación visual y cierre de acciones diferenciado.
- Caja conserva su estructura; sus acciones se separan visualmente del resumen para evitar competir con los importes.
- Corrección cromática final: canvas greige-malva más profundo, superficies blanco cálido y paneles secundarios rosa grisáceo tenue.
- La separación entre fondo, tarjetas, formularios y estados vacíos ahora depende principalmente de capas tonales y bordes suaves, sin intensificar sombras.

## Decisiones visuales

Se conserva la identidad de AuraNails: fondo greige-malva cálido, tarjetas blanco cálido, bordes suaves, baja saturación y acciones principales malva/ciruela. La Agenda, Caja, Cobros, rutas y flujos de formularios se mantienen sin cambios funcionales.

## Pendiente de validación

El pulido visual queda pendiente únicamente de confirmación manual final del contraste ambiental en escritorio, tablet y móvil. El navegador integrado no estuvo disponible durante esta ronda.
