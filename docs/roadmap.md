# Roadmap por capas

AuraNails se desarrollará por capas para mantener control técnico y funcional.

Cada capa debe dejar el proyecto en un estado entendible, revisable y estable.

## Capa 0 - Base documental

Estado: en curso.

Objetivo:

- Definir visión.
- Definir alcance.
- Definir módulos.
- Definir reglas de negocio.
- Definir stack técnico.
- Definir roadmap.
- Definir estado inicial del proyecto.

Resultado esperado:

- Documentación base lista antes de escribir código.

## Capa 1 - Setup técnico inicial

Objetivo:

- Crear estructura backend.
- Crear estructura frontend.
- Configurar Docker.
- Configurar PostgreSQL.
- Crear variables de entorno de ejemplo.
- Verificar que backend y frontend levanten localmente.

Resultado esperado:

- Proyecto ejecutable en entorno local.

## Capa 2 - Usuarios y autenticación

Objetivo:

- Crear login.
- Crear autenticación JWT.
- Crear usuario administrador.
- Proteger rutas privadas.

Resultado esperado:

- La usuaria puede iniciar sesión y acceder al sistema.

## Capa 3 - Clientas

Objetivo:

- Crear modelo de clienta.
- Crear API de clientas.
- Crear pantallas de listado, alta, edición y detalle.

Resultado esperado:

- La usuaria puede gestionar clientas.

## Capa 4 - Servicios

Objetivo:

- Crear modelo de servicio.
- Crear API de servicios.
- Crear pantallas de servicios.
- Permitir activar/inactivar servicios.

Resultado esperado:

- La usuaria puede definir qué servicios ofrece y cuánto cobra.

## Capa 5 - Turnos

Objetivo:

- Crear modelo de turno.
- Crear estados de turno.
- Asociar turno con clienta y servicio.
- Crear agenda básica.
- Permitir crear, editar, cancelar, confirmar y finalizar turnos.

Resultado esperado:

- La usuaria puede organizar su agenda.

## Capa 6 - Cobros y señas

Objetivo:

- Registrar seña.
- Registrar cobro.
- Registrar saldo pendiente.
- Asociar pagos a turnos.
- Mostrar deudas o pendientes.

Resultado esperado:

- La usuaria puede controlar qué cobró y qué falta pagar.

## Capa 7 - Dashboard básico

Objetivo:

- Mostrar turnos del día.
- Mostrar próximo turno.
- Mostrar cobros del mes.
- Mostrar señas pendientes.
- Mostrar avisos simples.

Resultado esperado:

- La usuaria entiende su día y su mes desde la pantalla de inicio.

## Capa 8 - Productos

Objetivo:

- Crear productos.
- Registrar stock actual.
- Definir stock mínimo.
- Mostrar productos por terminarse.
- Registrar compras y consumos simples.

Resultado esperado:

- La usuaria puede saber qué productos tiene y qué necesita comprar.

## Capa 9 - Gastos y ganancias

Objetivo:

- Registrar gastos.
- Categorizar gastos.
- Mostrar ingresos del mes.
- Mostrar gastos del mes.
- Mostrar ganancia aproximada.

Resultado esperado:

- La usuaria puede entender cuánto entró, cuánto salió y cuánto quedó.

## Capa 10 - Fotos de trabajos

Objetivo:

- Subir fotos.
- Asociar fotos a clientas.
- Asociar fotos a turnos.
- Ver galería de trabajos.

Resultado esperado:

- La usuaria puede consultar historial visual de trabajos.

## Capas futuras

Estas funciones quedan para una etapa posterior:

- WhatsApp automático.
- Mercado Pago.
- Recordatorios programados.
- Reportes PDF/Excel.
- Multiusuario avanzado.
- Galería de inspiración.
- Publicaciones para redes.

## Criterio de pausa

Si el desarrollo empieza a sentirse pesado, confuso o lleno de funciones decorativas, se debe pausar y revisar:

- Qué problema real se está resolviendo.
- Si la función pertenece al MVP.
- Si la usuaria la entendería fácilmente.
- Si conviene simplificar antes de continuar.
