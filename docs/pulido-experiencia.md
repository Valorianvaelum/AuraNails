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
