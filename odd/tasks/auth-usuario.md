# Auth — Sistema Finanzas multi-usuario

Objetivo: agregar autenticación Sanctum + scoping de datos por usuario para soportar múltiples usuarios en web.
Branch: main
Delivery: single-pr
Test runner: Pest (backend)

---

## Specs

### S1 — Sanctum: registro, login, logout, perfil, rutas protegidas
Instalar Laravel Sanctum (tokens personales). Nuevos endpoints NO autenticados: `POST /register`, `POST /login`. Endpoints autenticados: `POST /logout`, `GET /me`. Todos los endpoints existentes pasan a requerir `Authorization: Bearer <token>`. Sin token → 401.

### S2 — user_id en tablas: cuentas, meses, movimientos, pendientes
Agregar columna `user_id` FK nullable (references users.id, nullOnDelete) a cada tabla. Artisan command `app:assign-user {userId}` que asigna todos los registros NULL al usuario indicado (migración de datos existentes).

### S3 — Scoping por usuario en repositories y ReporteService
Todos los repositories filtran por `Auth::id()`. `create*` incluye `user_id = Auth::id()`. `findById` verifica pertenencia (devuelve null si es de otro usuario → 404). ReporteService agrega `user_id` a todas las queries DB::table(). PresupuestoRepository verifica que el mes pertenezca al usuario autenticado.

### S4 — Frontend: login/registro + interceptor + ProtectedRoute + logout
`authStore` (Zustand, persiste en localStorage) con `token`, `user`, `login()`, `logout()`. `LoginPage` y `RegisterPage`. `httpClient` actualizado: interceptor request agrega `Authorization: Bearer <token>`; interceptor 401 llama `authStore.logout()` y redirige a `/login`. `ProtectedRoute` redirige a `/login` si no autenticado. Logout en AppLayout.

---

## Tasks

| ID  | Descripción                                                        | Specs | Ruta   | Estado | Commit |
|-----|--------------------------------------------------------------------|-------|--------|--------|--------|
| T1  | Install Sanctum + User HasApiTokens + AuthController + rutas auth | S1    | inline | [ ]    | —      |
| T2  | user_id migrations + app:assign-user command                       | S2    | inline | [ ]    | —      |
| T3  | Scope repositories + ReporteService + PresupuestoRepository        | S3    | inline | [ ]    | —      |
| T4  | Frontend authStore + LoginPage + RegisterPage + interceptor + ProtectedRoute + logout | S4 | inline | [ ] | — |

---

## Log

L1 (2026-11-04): "Bien, sigamos con el auth-usuario". Feature acordada según openspec/changes/auth-usuario/.
