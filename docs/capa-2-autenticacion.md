# Capa 2: usuarios y autenticación

## Objetivo

Permitir que cada usuaria autorizada inicie y cierre sesión, mantenga su sesión al recargar y acceda únicamente a las rutas privadas de AuraNails.

## Alcance implementado

- Usuario personalizado `usuarios.Usuario` basado en `AbstractUser`.
- Inicio de sesión y renovación de tokens JWT.
- Consulta de la usuaria autenticada.
- Rutas frontend `/login` e `/inicio`, con protección de acceso y redirecciones por sesión.
- Persistencia centralizada de sesión y recuperación automática al cargar la aplicación.
- Pruebas de modelo y API de autenticación.

No existe registro público, recuperación o verificación de correo, OAuth, roles complejos, permisos por módulo ni módulos de negocio.

## Modelo de usuario

El modelo usa `email` como identificador único e inicio de sesión; no conserva un campo `username`. Incluye los campos `nombre`, `apellido` y `telefono`, además de los campos propios de Django como `is_active` y `date_joined`.

El manager normaliza el correo y gestiona `create_user` y `create_superuser`. El comando seguro e interactivo para crear una cuenta administradora es:

```bash
docker-compose exec backend python manage.py createsuperuser
```

## Endpoints

| Método | Ruta | Acceso | Resultado |
| --- | --- | --- | --- |
| POST | `/api/auth/login/` | Público | Recibe `email` y `password`; devuelve `access`, `refresh` y datos públicos de la usuaria. |
| POST | `/api/auth/refresh/` | Público | Recibe `refresh` y devuelve un nuevo `access`. |
| GET | `/api/auth/me/` | JWT requerido | Devuelve `id`, `email`, `nombre`, `apellido` y `telefono`. |
| GET | `/api/health/` | Público | Conserva la comprobación técnica del servicio. |

El access token dura 15 minutos y el refresh token 7 días. Los secretos no se definen en la configuración JWT: Django toma `DJANGO_SECRET_KEY` desde el entorno.

## Flujo y almacenamiento

El cliente Axios centralizado adjunta el access token a las solicitudes. Ante un `401` de una solicitud privada intenta una sola renovación con el refresh token, guarda el access actualizado y repite la solicitud. Si la renovación falla, elimina la sesión y redirige al login; así no hay ciclos de renovación.

Para esta capa, ambos tokens se guardan centralizadamente en `localStorage`. Es una solución inicial para la aplicación local: el cierre de sesión elimina ambos tokens. Una alternativa con cookies `httpOnly` podrá evaluarse si el producto requiere una política de seguridad más estricta.

`AuthContext` expone `user`, `isAuthenticated`, `isLoading`, `login` y `logout`. Antes de renderizar una ruta privada valida la sesión mediante `/api/auth/me/`, por lo que no muestra contenido privado de forma transitoria.

## Validaciones previstas

```bash
cd backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check
.\.venv\Scripts\python.exe manage.py test

cd ..\frontend
npm.cmd run lint
npm.cmd run build

cd ..
docker-compose config
docker-compose up --build
```

Las pruebas cubren creación de usuaria y superusuaria, correo obligatorio y único, login válido e inválido, `/api/auth/me/` autenticado y anónimo, refresh y el carácter público de `/api/health/`.

## Criterio de cierre

La capa queda cerrada cuando las validaciones anteriores pasan en el entorno disponible y una usuaria creada manualmente puede iniciar sesión, recargar, acceder a `/inicio` y cerrar sesión. Quedan deliberadamente fuera de esta capa cualquier función de negocio y el registro público.
