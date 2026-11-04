## Why

La app actualmente no tiene autenticación: toda la data es compartida y sin aislamiento por persona. Al desplegarse en web con múltiples usuarios, cada uno vería (y modificaría) la data de los demás. Se necesita autenticación token-based y scoping de todas las entidades por usuario antes del deploy.

## What Changes

- Instalar y configurar Laravel Sanctum (tokens de API)
- **BREAKING**: todos los endpoints existentes pasan a requerir `Authorization: Bearer <token>`
- Agregar `user_id` FK a las tablas: `cuentas`, `meses`, `movimientos`, `pendientes`, `gastos_fijos`
- Scopear todas las queries del sistema por el usuario autenticado (Services/Repositories)
- Nuevos endpoints de auth: `POST /register`, `POST /login`, `POST /logout`, `GET /me`
- Frontend: pantalla de login/registro, almacenamiento de token, interceptor axios con header `Authorization`, rutas protegidas con redirect a login

## Capabilities

### New Capabilities
- `autenticacion`: registro, login, logout y perfil del usuario autenticado (Sanctum token-based)

### Modified Capabilities
- `gestion-cuentas`: las cuentas se crean y consultan filtradas por `user_id` del usuario autenticado
- `movimientos`: los movimientos se crean y consultan filtrados por `user_id`
- `pendientes`: los pendientes se crean y consultan filtrados por `user_id`
- `saldos-dashboard`: el dashboard solo retorna datos del usuario autenticado
- `cierre-mensual`: el cierre opera solo sobre los meses del usuario autenticado
- `gastos-fijos`: los gastos fijos se crean y consultan filtrados por `user_id`

## Impact

- **Backend**: `composer require laravel/sanctum`; 6 nuevas migraciones (user_id en cada tabla); todos los repositories/services reciben el usuario como parámetro; `routes/api.php` envuelto en middleware `auth:sanctum`; nuevo `AuthController`
- **Frontend**: nueva página `LoginPage`/`RegisterPage`; `authStore` (Zustand o useState) con token + usuario; `axiosClient` actualizado con interceptor de Authorization header; `ProtectedRoute` wrapper; redirect a `/login` si 401
- **Base de datos**: data existente queda sin `user_id` — las migraciones deben ser nullable o requerir seed de usuario inicial
- **Dependencias nuevas**: `laravel/sanctum` (backend)
