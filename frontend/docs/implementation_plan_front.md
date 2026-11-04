# Plan de Implementación Frontend — auth-usuario

> **Scope:** Flujo de autenticación completo en React (login/registro, store Zustand, interceptor axios, rutas protegidas).
> **frontend_type:** react-vite · **OpenSpec change:** `auth-usuario` · **Tasks OpenSpec:** `openspec/changes/auth-usuario/tasks.md`
> **Arquitectura:** Hooks/Store → Pages (vista) → Orquestador (routes). El store Zustand encapsula TODA la lógica; las Pages solo reciben datos y callbacks.

---

## Stack técnico

- React 19 + Vite, react-router-dom v7
- Zustand v5 (store global, patrón `create((set, get) => ({...}))`)
- MUI (Emotion) para UI
- Axios vía `services/httpClient.js` (interceptors)
- Backend: Laravel Sanctum (Personal Access Token) — endpoints `POST /api/login`, `POST /api/register`, `POST /api/logout`, `GET /api/me`

---

## Mapeo Specs → Fases

| Spec (fuente de verdad) | Fase que lo cubre |
|---|---|
| Registro de usuario (`POST /api/register` → `{user, token}` 201) | Fase 1 (service) + Fase 2 (store) + Fase 4 (RegisterPage) |
| Login de usuario (`POST /api/login` → `{user, token}` 200) | Fase 1 + Fase 2 + Fase 4 (LoginPage) |
| Logout (`POST /api/logout` con `Authorization: Bearer <token>`) | Fase 1 + Fase 2 + Fase 6 (botón logout) |
| Perfil del usuario (`GET /api/me` → `{id,name,email,created_at}` 200) | Fase 1 + Fase 2 (`initAuth`) |
| Protección de rutas (401 sin/con token inválido) | Fase 3 (interceptor 401) + Fase 5 (ProtectedRoute) |

---

## Decisiones de arquitectura (relevantes y de riesgo)

1. **Token leído de forma perezosa en el interceptor** — el interceptor de request NO importa el store como valor inicial; lee `useAuthStore.getState().token` en cada request. Evita la dependencia circular `httpClient ↔ useAuthStore` (el store NO importa httpClient; las llamadas HTTP viven en `authService`, que el store consume).
2. **Fuente única del token: `localStorage` + estado del store.** El store se inicializa leyendo `localStorage` en `initAuth()`; al login/register se persiste; al logout/401 se limpia. `localStorage` es la verdad persistente, el store la verdad en memoria.
3. **Redirect en 401 sin acoplar al router** — el interceptor de response, ante 401, limpia el store y redirige con `window.location.assign('/login')` (fuera del árbol de React). Evita importar hooks de router en una capa de servicios. Guard: no redirigir si la petición que falló ya era `/login` o `/register` (para no pisar el feedback de "credenciales incorrectas").
4. **Envelope existente respetado** — el interceptor de response ya devuelve `{success, data, message}` (no `response.data`). `authService` y el store leen `res.data.user` / `res.data.token`. El manejo de 401 se agrega ANTES de ese flujo, en la rama de error.
5. **Rutas públicas fuera de `<AppLayout>`** — hoy `AppRoutes` envuelve todo en `<AppLayout>`. Se reestructura: `/login` y `/register` se renderizan sin layout; el resto se envuelve con `<ProtectedRoute>` + `<AppLayout>`.
6. **`initAuth()` reutiliza el punto de arranque existente** — se invoca dentro de `bootstrapApp()` (o en el `useEffect` de `App.jsx`) para restaurar sesión en reload ANTES de que `cargarMeses` dispare peticiones protegidas.

---

## Fase 1 — Auth Service

**Archivo nuevo:** `src/features/Auth/services/authService.js`
**Archivo modificado:** `src/config/apisUrl.js` (agregar bloque `// Auth`)

- Patrón idéntico a `mesesService`: usa `httpClient` + constantes `API_URLS`.
- Nuevas URLs en `apisUrl.js`:
  ```js
  // Auth
  AUTH_LOGIN: '/login',
  AUTH_REGISTER: '/register',
  AUTH_LOGOUT: '/logout',
  AUTH_ME: '/me',
  ```
- Funciones del service (todas `async`, retornan la promesa de `httpClient`):
  - `login(email, password)` → `httpClient.post(API_URLS.AUTH_LOGIN, { email, password })`
  - `register(name, email, password)` → `httpClient.post(API_URLS.AUTH_REGISTER, { name, email, password })`
  - `logout()` → `httpClient.post(API_URLS.AUTH_LOGOUT)`
  - `me()` → `httpClient.get(API_URLS.AUTH_ME)`
- JSDoc obligatorio en cada función (idioma español).

---

## Fase 2 — useAuthStore (Zustand)

**Archivo nuevo:** `src/shared/hooks/useAuthStore.js` — mismo patrón que `useMesStore` (`create((set, get) => ({...}))`, default export).

**Estado:**
- `user` (objeto | null)
- `token` (string | null)
- `isAuthenticated` (boolean) — derivado de la presencia de token al inicializar y de las acciones
- `loading` (boolean)
- `error` (string | null)

**Acciones:**
- `login(email, password)` — `set({loading:true, error:null})`; llama `authService.login`; si `res.success` → persiste token en `localStorage` (`localStorage.setItem('auth_token', token)`), `set({user, token, isAuthenticated:true, loading:false})`; en `catch` → `set({error: <mensaje>, loading:false})` y re-lanza/retorna un flag para que la Page sepa que falló (sin redirigir).
- `register(name, email, password)` — mismo flujo que `login` contra `authService.register` (respuesta 201 con `{user, token}`).
- `logout()` — llama `authService.logout()` (best-effort; ignora error de red), luego SIEMPRE limpia: `localStorage.removeItem('auth_token')`, `set({user:null, token:null, isAuthenticated:false})`.
- `initAuth()` — lee `localStorage.getItem('auth_token')`; si no hay token → `set({isAuthenticated:false})` y return; si hay → `set({token, isAuthenticated:true})` y llama `authService.me()` para rehidratar `user`; si `me()` devuelve 401, el interceptor de Fase 3 limpia y redirige (no duplicar lógica aquí).
- `clearError()` — helper opcional para limpiar `error` al reabrir un formulario.

**Persistencia:** clave `auth_token` en `localStorage`. (Shortcut deliberado: no se persiste `user`; se rehidrata vía `me()` en `initAuth`. Si se quisiera evitar la llamada extra en reload, persistir `user` también.)

**Mensajes de error:** mapear desde `err.response?.data?.message` (login 401 trae mensaje genérico por spec) o `err.response?.data?.errors` (422 de validación en register). La UI (Fase 4) decide cómo mostrarlos.

---

## Fase 3 — httpClient interceptor

**Archivo modificado:** `src/services/httpClient.js`

- **Interceptor de request (NUEVO):**
  ```js
  httpClient.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
  });
  ```
  Import perezoso del store a nivel de módulo es seguro porque el store NO importa httpClient (ver Decisión 1).
- **Interceptor de response (MODIFICAR la rama de error):** antes del `Promise.reject(error)`, si `error.response?.status === 401` y la URL no es `/login` ni `/register`:
  - `useAuthStore.getState().logout()` (o una acción `clearSession` que solo limpia, sin llamar a la API) → limpiar token/user del store y `localStorage`.
  - `window.location.assign('/login')`.
  - Luego `return Promise.reject(error)`.
- La normalización de éxito del envelope (`mapSuccessResponse`) queda intacta.
- Actualizar el JSDoc del módulo (hoy dice "sin token Bearer ni redirección 401"): corregir la descripción.

---

## Fase 4 — AuthPages

**Archivos nuevos:**
- `src/features/Auth/hooks/useLoginForm.js` (opcional) y `useRegisterForm.js` — encapsulan estado local del formulario (campos, validación mínima) y delegan en `useAuthStore`. **Alternativa lazy aceptable:** manejar el estado de campos con `useState` dentro de la Page si el formulario es trivial; la regla crítica es que la lógica de auth (login/register/errores de API) viva en el store, NO en la Page.
- `src/features/Auth/LoginPage.jsx` — formulario `email`/`password`. Llama `authStore.login(email, password)`. Lee `loading` y `error` del store. En éxito (`isAuthenticated`) → `navigate('/')`. Link a `/register`.
- `src/features/Auth/RegisterPage.jsx` — formulario `name`/`email`/`password`. Llama `authStore.register(...)`. En éxito → `navigate('/')`. Link a `/login`.

**Reglas UX obligatorias aplicadas:**
- Estado `loading` deshabilita el botón de submit y muestra spinner.
- Error de API mostrado con `<Alert severity="error">` dentro del formulario (credenciales incorrectas / errores de validación 422 por campo).
- `id` obligatorios en elementos interactivos: `auth-login-input-email`, `auth-login-input-password`, `auth-login-btn-submit`, `auth-register-input-name`, etc. (formato `[modulo]-[elemento]-[calificador]`).
- NO hay lógica de estado de auth en las Pages — todo delegado al store (solo estado de campos del formulario es local).

---

## Fase 5 — Rutas protegidas

**Archivo nuevo:** `src/app/ProtectedRoute.jsx`
- Lee `isAuthenticated` de `useAuthStore`. Si `!isAuthenticated` → `<Navigate to="/login" replace />`. Si sí → renderiza `children` (o `<Outlet />`).

**Archivo modificado:** `src/app/routes.jsx`
- Agregar constantes de ruta `LOGIN: '/login'` y `REGISTER: '/register'` en `app.config.js`.
- Reestructurar: las rutas públicas (`/login`, `/register`) se renderizan SIN `<AppLayout>`; las feature routes se envuelven con `<ProtectedRoute>` que a su vez monta `<AppLayout>`.
- Lazy load de `LoginPage` y `RegisterPage` con `React.lazy` + `Suspense` (consistente con las demás rutas).

**Archivo modificado:** `src/config/app.config.js` — agregar `LOGIN` y `REGISTER` a `ROUTES`.

**Restaurar sesión al reload:**
**Archivo modificado:** `src/app/bootstrap.js` (o `src/app/App.jsx`)
- Llamar `useAuthStore.getState().initAuth()` ANTES de `cargarMeses(...)` en `bootstrapApp()`, para que la sesión se rehidrate antes de disparar peticiones protegidas.

---

## Fase 6 — AppLayout ajustes

**Archivo modificado:** `src/shared/components/AppLayout.jsx`
- Mostrar el nombre del usuario autenticado (`useAuthStore` → `user.name`) en el header/drawer.
- Botón de logout accesible (ícono + label) con `id="app-layout-btn-logout"`.
- **Logout con confirmación** (operación destructiva por autovalidación): abrir un `ConfirmDialog`/`Dialog` de MUI "¿Cerrar sesión?" antes de ejecutar `authStore.logout()`. El dialog solo se cierra por botón explícito (regla UX de cierre de modales). Tras `logout()`, el estado `isAuthenticated=false` hace que `ProtectedRoute` redirija a `/login` automáticamente (o `navigate('/login')` explícito).
- Reutilizar `ConfirmDialog` de `shared/components` si existe; si no, un `Dialog` mínimo.

---

## Riesgos y dependencias

1. **Dependencia circular httpClient ↔ store** — mitigada leyendo el token con `getState()` y manteniendo las llamadas HTTP de auth en `authService` (el store no importa httpClient). **Verificar en implementación** que no haya ciclo de import.
2. **Doble manejo de 401** — `initAuth()` llama a `me()`; si el token expiró, el interceptor (Fase 3) ya limpia y redirige. No duplicar la limpieza en `initAuth` para evitar race / doble redirect.
3. **Backend aún pendiente** — este plan depende de que el Arquitecto Back exponga `/login`, `/register`, `/logout`, `/me` con el envelope `ResponseUtils` que `mapSuccessResponse` ya normaliza. Contrato de respuesta esperado: `{ user, token }`.
4. **Peticiones de arranque protegidas** — `cargarMeses` corre en bootstrap; si no hay sesión, devolverá 401 y redirigirá a `/login`. Orden correcto: `initAuth()` primero; idealmente no disparar `cargarMeses` si `!isAuthenticated`.
5. **Redirect con `window.location`** recarga la SPA. Es aceptable para 401 (sesión caída); si se quisiera navegación sin reload, inyectar un callback de navegación del router en el interceptor (mayor acoplamiento, no necesario ahora).

---

## Archivos nuevos

- `src/features/Auth/services/authService.js`
- `src/features/Auth/LoginPage.jsx`
- `src/features/Auth/RegisterPage.jsx`
- `src/features/Auth/hooks/useLoginForm.js` (opcional)
- `src/features/Auth/hooks/useRegisterForm.js` (opcional)
- `src/shared/hooks/useAuthStore.js`
- `src/app/ProtectedRoute.jsx`

## Archivos modificados

- `src/config/apisUrl.js` (URLs de auth)
- `src/config/app.config.js` (rutas `LOGIN`, `REGISTER`)
- `src/services/httpClient.js` (interceptor request + 401 en response)
- `src/app/routes.jsx` (rutas públicas + protegidas)
- `src/app/bootstrap.js` o `src/app/App.jsx` (`initAuth()` en arranque)
- `src/shared/components/AppLayout.jsx` (nombre de usuario + logout con confirmación)

---

## Autovalidación de estándar frontend

- [x] Hooks/store encapsulan toda la lógica de estado y llamadas API — las Pages solo reciben datos/callbacks (solo estado de campos del formulario es local).
- [x] Orquestador delgado — `routes.jsx` solo compone; sin JSX de UI directa.
- [x] No hay lógica de auth en LoginPage/RegisterPage — todo delegado a `useAuthStore`.
- [x] No se proponen filtros ad-hoc (no aplica: auth no tiene listados con `FilterToolbar`).
- [x] Operación destructiva (logout) con confirmación previa explícita (Fase 6).
