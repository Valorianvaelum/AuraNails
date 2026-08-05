# Gate P2 — Copias de seguridad y restauración verificada

## Estado

Este documento define el procedimiento del piloto para crear backups lógicos de PostgreSQL y comprobarlos mediante una restauración completa en un entorno aislado.

El procedimiento nunca restaura sobre `auranails-prod`. La validación utiliza el proyecto Docker independiente `auranails-restore` y un volumen temporal propio.

## Alcance protegido

En el MVP actual, los datos operativos se encuentran en PostgreSQL:

- cuentas y autenticación;
- clientas;
- servicios;
- turnos y snapshots históricos;
- cobros;
- cajas, gastos y movimientos.

No existen archivos subidos por usuarias ni un volumen de medios que requiera respaldo en este momento. Los assets del frontend y los archivos estáticos de Django se reconstruyen desde el repositorio y las imágenes Docker.

## Formato del backup

`scripts/backup-production.ps1` genera:

- un archivo PostgreSQL en formato custom: `auranails-AAAAMMDD-HHMMSSZ.dump`;
- un checksum SHA-256: `.dump.sha256`;
- un manifiesto JSON con fecha UTC, tamaño, versión de PostgreSQL y commit Git: `.dump.json`.

El script ejecuta `pg_restore --list` antes de copiar el archivo fuera del contenedor. Esto detecta archivos vacíos o archivos custom ilegibles, pero no sustituye una restauración completa.

La carpeta `backups/` y los archivos `.dump` están ignorados por Git porque pueden contener información personal y financiera.

## Crear un backup

Requisitos:

- estar en la raíz del repositorio;
- tener el stack `auranails-prod` en ejecución y saludable;
- conservar `.env.production` fuera de Git.

```powershell
.\scripts\backup-production.ps1
```

Parámetros opcionales:

```powershell
.\scripts\backup-production.ps1 `
  -EnvFile .env.production `
  -ComposeFile docker-compose.production.yml `
  -OutputDirectory backups
```

El procedimiento no detiene la aplicación. `pg_dump` obtiene una copia lógica consistente de la base mientras PostgreSQL continúa disponible.

## Verificar una restauración

Seleccionar el backup más reciente:

```powershell
$Backup = Get-ChildItem .\backups\*.dump |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
```

Restaurarlo y verificarlo:

```powershell
.\scripts\verify-restore.ps1 -BackupPath $Backup.FullName
```

Para comprobar además que una cuenta conocida está presente:

```powershell
.\scripts\verify-restore.ps1 `
  -BackupPath $Backup.FullName `
  -ExpectedUserEmail demo.auranails@example.com
```

La verificación realiza estos controles:

1. valida el checksum SHA-256 cuando existe;
2. destruye únicamente un entorno anterior llamado `auranails-restore`;
3. crea un PostgreSQL nuevo con volumen separado;
4. valida el catálogo del archivo con `pg_restore --list`;
5. restaura con `--exit-on-error`, sin propietarios ni privilegios del servidor original;
6. ejecuta `manage.py check`;
7. exige que no existan migraciones pendientes;
8. comprueba tablas administradas, migraciones registradas y restricciones de base;
9. verifica opcionalmente una cuenta conocida;
10. elimina el entorno temporal al finalizar correctamente.

Si la restauración falla, el entorno temporal se conserva para diagnóstico y el stack productivo no se modifica.

Para conservar una restauración exitosa y revisarla manualmente:

```powershell
.\scripts\verify-restore.ps1 `
  -BackupPath $Backup.FullName `
  -KeepEnvironment
```

Limpieza posterior:

```powershell
docker compose `
  --env-file .env.production `
  -f docker-compose.restore.yml `
  down -v --remove-orphans
```

## Criterio de cierre del Gate P2

El gate se considera cerrado únicamente cuando:

- CI valida ambos Compose, los scripts y el comando Django;
- se genera un backup real desde `auranails-prod`;
- el SHA-256 coincide;
- la restauración termina en un volumen nuevo;
- el comando `verify_restore` informa estado correcto;
- una cuenta conocida y los datos demostrativos aparecen en la restauración;
- se registra la duración aproximada del backup y de la recuperación.

## Política provisional del piloto

Hasta definir el proveedor definitivo:

- crear un backup antes de cada actualización;
- crear al menos un backup diario durante el piloto;
- conservar una copia adicional fuera del equipo que ejecuta AuraNails;
- no enviar dumps por canales públicos ni subirlos al repositorio;
- borrar copias antiguas solo después de confirmar que existe otra copia verificable.

La automatización, cifrado externo, retención definitiva y almacenamiento fuera del servidor se definirán junto con el alojamiento real.
