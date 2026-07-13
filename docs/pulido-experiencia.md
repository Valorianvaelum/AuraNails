# Pulido de experiencia de uso

## Objetivo

Mejorar el acompañamiento de la usuaria sin alterar reglas de negocio, modelos, permisos ni flujos existentes.

## Avisos globales

Se incorporó un proveedor de notificaciones reutilizable, sin dependencias externas. Admite éxito, información, advertencia y error; limita los avisos simultáneos, evita duplicados equivalentes, permite cierre manual, anuncia mediante `aria-live` y respeta la preferencia de movimiento reducido.

Se usa para informar inicio de sesión y vencimiento de sesión. Los errores de campos siguen siendo mensajes inline.

## Seguridad y experiencia de acceso

- La contraseña nunca se guarda en almacenamiento persistente: solo existen tokens de sesión.
- El formulario inicia con contraseña y error vacíos; limpia la contraseña luego de un fallo o acceso exitoso y conserva el correo escrito.
- Se usa `autocomplete="username"` y `autocomplete="current-password"`, para permitir gestores de contraseñas sin que AuraNails complete valores por su cuenta.
- Se agregaron mostrar/ocultar contraseña, aviso de Bloq Mayús, foco inicial y estado `Ingresando…`.
- Las credenciales inválidas usan una respuesta genérica.

## Sesión vencida

Al fallar la renovación de token, la sesión local se limpia y el contexto de autenticación invalida a la usuaria. La ruta protegida redirige al acceso y se muestra una única advertencia: “Tu sesión venció. Iniciá sesión nuevamente.”

## Accesibilidad y pendientes

El acceso asocia el error a los campos mediante `aria-invalid` y `aria-describedby`. Los formularios existentes ya bloquean varios envíos duplicados durante operaciones asíncronas.

Pendientes de una revisión manual posterior: normalizar progresivamente los atributos ARIA de cada formulario, sustituir confirmaciones nativas por un diálogo accesible reutilizable y evaluar advertencias de cambios sin guardar sin interceptar navegación de forma frágil.

## Confirmaciones y errores de formulario

Se incorporó `ConfirmDialog`, un diálogo reutilizable con foco inicial seguro, Escape cuando no procesa, trampa de foco, restauración de foco y controles accesibles. Se aplica a cancelar o marcar ausencia en Turnos, desactivar Clientas, pausar Servicios y anular Cobros.

La misma base de errores se aplica a Clientas, Servicios, Turnos, Reprogramación, Cobros y Acceso: cada campo inválido se anuncia, recibe foco y conserva el mensaje específico que entrega el backend. En Turnos, los conflictos de superposición y las reglas temporales se muestran junto a fecha y hora.

En Caja, las operaciones irreversibles o sensibles (cierre, retiro y anulaciones) requieren confirmación mediante el diálogo reutilizable; apertura, gasto y aporte se conservan como acciones directas. El registro de un cobro tampoco agrega una confirmación extra. Los cambios sin guardar se posponen deliberadamente.

## Unificación visual de Caja y Cobros

Caja y Cobros comparten ahora un sistema visual localizado de acciones, tarjetas financieras y estados vacíos. Caja separa los movimientos cotidianos del cierre de jornada, destaca el saldo esperado y ordena cobros, gastos, aportes y retiros en secciones compactas. Cobros prioriza importe, método, estado, fecha y acciones mediante la misma jerarquía visual.

El detalle e historial de Caja reutilizan estas superficies de forma acotada. La validación manual final de esta unificación visual permanece pendiente.
