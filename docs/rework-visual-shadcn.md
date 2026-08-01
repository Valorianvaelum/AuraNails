# Rework visual con shadcn/ui

## Objetivo

Reemplazar progresivamente la capa visual heredada por componentes reutilizables inspirados en shadcn/ui, sin alterar reglas de negocio, rutas, API, permisos ni datos.

## Estrategia técnica

- Mantener React 19, Vite 6, JavaScript y Tailwind CSS 3 durante el rework.
- Conservar temporalmente los tokens existentes de AuraNails y exponerlos mediante nombres semánticos de Tailwind.
- Incorporar componentes propios en `frontend/src/components/ui`.
- Migrar pantallas por bloques verificables.
- Evitar implementaciones caseras de componentes complejos de accesibilidad; Dialog, AlertDialog, Tooltip, Popover y similares deberán apoyarse en primitivas robustas cuando se incorporen.

## Bloque 1 — Fundaciones

Incluye:

- alias `@/` para Vite y el editor;
- `components.json` compatible con el proyecto JavaScript;
- utilidad `cn`;
- mapeo semántico de colores, radios y sombras;
- Button, Card, Badge, Input, Label, Textarea, Separator y Skeleton.

No incluye todavía:

- migración de pantallas;
- cambio de identidad visual;
- eliminación del CSS heredado;
- incorporación de Dialog, AlertDialog, Tooltip, Popover o Sheet;
- cambios en backend o reglas funcionales.

## Criterio de cierre

El bloque se considera cerrado cuando build y lint pasan, el diff queda limitado a infraestructura visual y se verifica que ninguna pantalla existente cambió su comportamiento.
