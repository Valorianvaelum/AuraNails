# Manifiesto de cambios — demo real AuraNails

## Objetivo

Agregar un comando Django seguro para crear una cuenta de demostración aislada, con datos ficticios coherentes y fechas relativas al momento de ejecución.

## Archivos nuevos

- `backend/aplicaciones/usuarios/management/__init__.py`
- `backend/aplicaciones/usuarios/management/commands/__init__.py`
- `backend/aplicaciones/usuarios/management/commands/seed_demo.py`
- `backend/aplicaciones/usuarios/test_seed_demo.py`

## Comportamiento

- Cuenta: `demo.auranails@example.com`.
- Contraseña: argumento `--password` o variable `AURANAILS_DEMO_PASSWORD`.
- Primera ejecución: crea cuenta y datos.
- Segunda ejecución sin `--reset`: se detiene sin modificar.
- Ejecución con `--reset`: elimina y reconstruye solo los datos de la cuenta demo.
- No crea migraciones.
- No modifica API, frontend, permisos ni reglas de negocio.
- Usa los servicios existentes de Caja y Cobros.
- Crea snapshots históricos de servicios en cada turno.

## Datos generados

- 10 clientas.
- 7 servicios.
- 10 turnos con los seis estados disponibles.
- 3 cobros.
- 1 caja histórica cerrada.
- 1 caja actual abierta.
- gasto, retiro y aporte demostrativos.

## Riesgos

- `--reset` borra cualquier dato creado manualmente bajo la cuenta demo.
- Los precios son ficticios y deben revisarse antes de una presentación comercial.
- Los horarios futuros se calculan desde el momento de ejecución y pueden continuar al día siguiente.

## Reversión

Antes del commit:

```powershell
git clean -fd -- backend/aplicaciones/usuarios/management backend/aplicaciones/usuarios/test_seed_demo.py
```

Después del commit:

```powershell
git revert <SHA_DEL_COMMIT>
```

La cuenta y sus datos pueden eliminarse posteriormente con un comando de limpieza específico; no se incluye eliminación automática para evitar acciones destructivas accidentales.
