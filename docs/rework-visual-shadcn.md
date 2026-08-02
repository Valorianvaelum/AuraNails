# Rework visual basado en shadcn/ui

## Objetivo

Usar shadcn/ui como referencia de composición, jerarquía, estados y accesibilidad sin reemplazar el stack existente ni alterar reglas de negocio.

## Stack conservado

- React 19.
- Vite 6.
- JavaScript.
- Tailwind CSS 3.4.

La migración a Tailwind 4 queda fuera de alcance. La integración se realiza manualmente para evitar sobrescribir el sistema visual previo de AuraNails.

## Fuente de verdad

- Primitivas reutilizables: `frontend/src/components/ui`.
- Composición de clases: `frontend/src/lib/utils.js`.
- Tokens actuales: variables CSS de `frontend/src/index.css`, expuestas mediante `tailwind.config.js`.
- Configuración shadcn: `frontend/components.json`.

## Reglas de adopción

1. Las pantallas migradas deben usar tokens semánticos y primitivas UI.
2. No agregar nuevos colores hexadecimales locales salvo estados no cubiertos por tokens.
3. El CSS `.ui-*` actual es una capa de compatibilidad temporal, no la solución final.
4. No reemplazar confirmaciones accesibles por modales caseros.
5. Dialog, AlertDialog, Sheet, Tooltip y similares deben incorporarse con primitivas accesibles robustas cuando el bloque funcional los necesite.
6. Cada migración debe preservar rutas, API, permisos, validaciones y mensajes de negocio.
7. Las clases de opacidad de Tailwind no deben aplicarse sobre tokens definidos como variables hexadecimales; usar tokens sólidos o variables específicas.

## Componentes iniciales

Button, Card, Badge, Input, Label, Textarea, Field, Separator, Skeleton y Spinner.

## Bloques

### Bloque 1 — Fundaciones

Configuración, tokens, utilidades y primitivas. Validado con lint y build de producción.

### Bloque 2 — Estructura general e Inicio

- `AppHeader` migrado a tokens y componentes del sistema.
- Navegación adaptable con desplazamiento horizontal en anchos reducidos.
- Inicio reorganizado en encabezado operativo, métricas, próximos turnos y accesos rápidos.
- Estados de carga con Skeleton.
- Estados de caja y turnos con Badge.
- Eliminación de colores hexadecimales incrustados en la pantalla.
- Consultas, filtros, rutas y reglas funcionales preservadas.

## Validación visual requerida

Revisar Inicio y navegación a 1440 px, 1024 px, 768 px y 390 px. Confirmar foco de teclado, desplazamiento de navegación, estados de carga, caja abierta/cerrada, próximos turnos y estado vacío.
