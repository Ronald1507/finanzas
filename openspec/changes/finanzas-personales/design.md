# Design

## Backend

### Alcance y stack

API REST para gestión de finanzas personales de un solo usuario (sin login multi-usuario). Módulos: GestionCuentas, Movimientos, Pendientes, SaldosDashboard, CierreMensual.

- **Stack:** Laravel 11+ (PHP 8.2+), SQLite en desarrollo, patrón CSR (Controller → Service → Repository).
- **Ubicación:** `<PROJECT_PATH>/backend/` (monorepo junto a `frontend/`).
- **Proyecto nuevo:** no existe código previo; el plan incluye scaffolding completo.

### Scaffolding inicial

1. `composer create-project laravel/laravel backend` (Laravel 11+).
2. `.env` de desarrollo con placeholders (sin credenciales reales):
   - `APP_NAME=<PROJECT_NAME>`, `APP_TIMEZONE=America/Santiago` (obligatorio por estándar).
   - `DB_CONNECTION=sqlite`, `DB_DATABASE=<ruta absoluta a database/database.sqlite>` (crear archivo vacío).
3. Habilitar rutas API en `bootstrap/app.php` → `withRouting(api: __DIR__.'/../routes/api.php', apiPrefix: 'api')`. **Sin Sanctum ni middleware de autenticación** (app personal de un solo usuario; no se ejecuta `install:api` para no arrastrar auth).
4. Copiar **completos y sin modificar** los templates de `SKILL_DIR/templates/laravel/` a `app/Utils/`: `ResponseUtils.php`, `ValidacionUtils.php`, `ErrorsBag.php`, `PaginationUtils.php`, `PermissionControl.php`, `Helpers.php`, `DebugLog.php` (no se copia `RabbitMQAgent.php`: no hay mensajería en el scope).
5. `php artisan migrate` contra SQLite.

### Modelo de datos

Montos en `decimal(15,2)` (cast `decimal:2`). Convención de nombres de tablas en plural snake_case.

**`meses`** — un registro por mes calendario gestionado.

| Columna | Tipo | Notas |
|---|---|---|
| id | bigIncrements | PK |
| anio | unsignedSmallInteger | |
| mes | unsignedTinyInteger | 1–12 |
| estado | string | `abierto` \| `cerrado` |
| fecha_cierre | datetime nullable | seteada al cerrar |
| timestamps | | |

Índices: `UNIQUE(anio, mes)`; índice en `estado`.

**Invariante clave:** los meses forman una secuencia contigua; **existe exactamente un mes abierto a la vez y es siempre el último**. Los meses solo se crean por: (a) bootstrap del primer mes (mes calendario actual, al primer uso) y (b) cierre del mes anterior. Esto hace trivial la secuencialidad de cierres.

**`cuentas`**

| Columna | Tipo | Notas |
|---|---|---|
| id | bigIncrements | PK |
| nombre | string | unicidad entre activas se valida en Service (no UNIQUE de BD: una inactiva puede compartir nombre) |
| banco | string nullable | |
| tipo | string | `corriente` \| `vista` \| `ahorro` \| `credito` \| `efectivo` |
| activa | boolean default true | cast booleano |
| timestamps | | |

Índices: índice en `nombre`, índice en `activa`.

**`cuenta_mes`** — saldo inicial/final de cada cuenta en cada mes (la participación de una cuenta en un mes existe si y solo si hay fila aquí).

| Columna | Tipo | Notas |
|---|---|---|
| id | bigIncrements | PK |
| cuenta_id | FK → cuentas | cascade restrict |
| mes_id | FK → meses | cascade restrict |
| saldo_inicial | decimal(15,2) | |
| saldo_final | decimal(15,2) nullable | solo no-null en meses cerrados (congelado al cierre) |
| timestamps | | |

Índices: `UNIQUE(cuenta_id, mes_id)`; índice en `mes_id`.

**`movimientos`**

| Columna | Tipo | Notas |
|---|---|---|
| id | bigIncrements | PK |
| cuenta_id | FK → cuentas | |
| mes_id | FK → meses | derivado de `fecha` por el Service |
| tipo | string | `ingreso` \| `egreso` |
| monto | decimal(15,2) | > 0 (validación) |
| fecha | date | |
| descripcion | string | |
| categoria | string | |
| pendiente_id | FK nullable → pendientes | seteado si el movimiento nació al concretar un pendiente |
| movimiento_relacionado_id | FK nullable → movimientos | vincula el par de una transferencia (referencia cruzada en ambos) |
| timestamps | | |

Índices: compuesto `(mes_id, cuenta_id)`, índice en `fecha`, índice en `tipo`, índice en `categoria`.

**`pendientes`**

| Columna | Tipo | Notas |
|---|---|---|
| id | bigIncrements | PK |
| cuenta_id | FK → cuentas | |
| mes_id | FK → meses | mes donde el pendiente está vigente |
| tipo | string | `por_pagar` \| `por_recibir` |
| monto | decimal(15,2) | > 0 |
| descripcion | string | |
| fecha_estimada | date | |
| estado | string | `pendiente` \| `realizado` \| `anulado` |
| movimiento_id | FK nullable → movimientos | movimiento real generado al concretar |
| pendiente_origen_id | FK nullable → pendientes | si la fila es un arrastre creado por un cierre, apunta al pendiente del mes cerrado |
| timestamps | | |

Índices: compuesto `(mes_id, estado)`, índice en `tipo`.

**Decisión — arrastre por clonación:** al cerrar un mes, cada pendiente en estado `pendiente` se **clona** al mes nuevo (`pendiente_origen_id` → original); el original queda intacto en el mes cerrado como registro histórico ("al cierre esto seguía pendiente"). Ventajas: el mes cerrado es 100% inmutable, el arrastre encadena correctamente entre múltiples cierres, y la reapertura se revierte borrando los clones (identificables porque su `pendiente_origen_id` apunta a pendientes del mes reabierto). El saldo potencial solo se calcula con pendientes `pendiente` del mes consultado, así que no hay doble conteo.

### Estructura CSR

```
backend/
├── app/
│   ├── Http/Controllers/
│   │   ├── CuentaController.php
│   │   ├── MovimientoController.php
│   │   ├── PendienteController.php
│   │   ├── DashboardController.php
│   │   └── MesController.php
│   ├── Services/
│   │   ├── CuentaService.php
│   │   ├── MovimientoService.php
│   │   ├── PendienteService.php
│   │   ├── SaldoService.php
│   │   └── MesService.php
│   ├── Repositories/
│   │   ├── CuentaRepository.php
│   │   ├── CuentaMesRepository.php
│   │   ├── MovimientoRepository.php
│   │   ├── PendienteRepository.php
│   │   └── MesRepository.php
│   ├── Models/
│   │   ├── Cuenta.php
│   │   ├── CuentaMes.php
│   │   ├── Movimiento.php
│   │   ├── Pendiente.php
│   │   └── Mes.php
│   └── Utils/            ← templates copiados, NO modificar
├── database/migrations/  ← 5 migraciones (meses, cuentas, cuenta_mes, movimientos, pendientes)
└── routes/api.php        ← nombres de ruta en kebab-case
```

Asignación módulo → clases:

| Módulo | Controller | Service(s) | Repositories principales |
|---|---|---|---|
| GestionCuentas | CuentaController | CuentaService | CuentaRepository, CuentaMesRepository, PendienteRepository |
| Movimientos | MovimientoController | MovimientoService | MovimientoRepository, MesRepository, CuentaRepository |
| Pendientes | PendienteController | PendienteService | PendienteRepository, MovimientoRepository, MesRepository |
| SaldosDashboard | DashboardController | SaldoService | CuentaMesRepository, MovimientoRepository, PendienteRepository, MesRepository |
| CierreMensual | MesController | MesService (usa SaldoService) | MesRepository, CuentaMesRepository, PendienteRepository |

Cumplimiento CSR transversal:
- **Controllers:** constructor inyecta Service(s) + `ResponseUtils` + `ValidacionUtils` (siempre, incluso read-only). Validación inline con `$this->validacion->validate()` (campo a campo, nunca `$request->all()` directo a create/update; **prohibido FormRequest**). try-catch solo aquí, con `fileScript`/`lineScript`. Respuestas vía `ResponseUtils`.
- **Services:** constructor inyecta Repository(es) + `ErrorsBag` (siempre) + `PermissionControl`. Errores de dominio con `$this->errors->throwFast($campo, $mensaje, $codigoHTTP)` — nunca `throw new`. `hasPermission()` antes de cada escritura. Cero `request()`/HTTP. Cero queries directas (`Modelo::`, `DB::table()`, `DB::select()`) — todo dato sale de Repositories. `DB::transaction()` para escrituras múltiples. Retornos Eloquent con `->toArray()`.
- **Repositories:** solo queries; modelo inyectado en constructor (nunca estáticos); prefijos `find*` (?Model) / `get*` (Collection) / `paginate*` (array vía `PaginationUtils`) / `create|update|delete`; sin transacciones ni lógica de negocio.
- **PHPDoc** completo en clases (`@package`), métodos y constructores; relaciones Eloquent con `@return HasMany<X>` / `@return BelongsTo<X, self>`.

### Endpoints REST

Prefijo `/api`. Respuestas con el envelope estándar de `ResponseUtils` (éxito: `{status, data}`; error: `{status, errors}` con código HTTP correspondiente). Nombres de ruta kebab-case (ej.: `'cuentas.listar-cuentas'`).

**GestionCuentas**

| Método | Ruta | Payload | Respuesta |
|---|---|---|---|
| GET | `/api/cuentas` | query: `activa?` (bool) | lista de cuentas |
| GET | `/api/cuentas/{id}` | — | cuenta |
| POST | `/api/cuentas` | `{nombre, banco?, tipo, saldo_inicial}` | cuenta creada (crea su `cuenta_mes` en el mes abierto; bootstrap del primer mes si no existe ninguno) |
| PUT | `/api/cuentas/{id}` | `{nombre, banco?, tipo}` | cuenta actualizada |
| PUT | `/api/cuentas/{id}/saldo-inicial` | `{saldo_inicial}` | cuenta_mes actualizado (solo mes abierto) |
| POST | `/api/cuentas/{id}/desactivar` | — | cuenta desactivada (rechaza si tiene pendientes `pendiente` en el mes abierto) |

**Movimientos**

| Método | Ruta | Payload | Respuesta |
|---|---|---|---|
| GET | `/api/movimientos` | query: `mes_id`, `cuenta_id?`, `tipo?`, `categoria?`, `page?`, `per_page?` | paginado (PaginationUtils), orden `fecha` desc |
| POST | `/api/movimientos` | `{cuenta_id, tipo, monto, fecha, descripcion, categoria}` | movimiento creado |
| PUT | `/api/movimientos/{id}` | `{cuenta_id, tipo, monto, fecha, descripcion, categoria}` | movimiento actualizado (solo mes abierto) |
| DELETE | `/api/movimientos/{id}` | — | eliminado (solo mes abierto) |
| POST | `/api/movimientos/transferencia` | `{cuenta_origen_id, cuenta_destino_id, monto, fecha, descripcion}` | par egreso/ingreso vinculado |

**Pendientes**

| Método | Ruta | Payload | Respuesta |
|---|---|---|---|
| GET | `/api/pendientes` | query: `mes_id`, `tipo?`, `estado?` | lista de pendientes |
| POST | `/api/pendientes` | `{cuenta_id, tipo, monto, descripcion, fecha_estimada}` | pendiente creado (estado `pendiente`, en el mes abierto) |
| PUT | `/api/pendientes/{id}` | `{cuenta_id, tipo, monto, descripcion, fecha_estimada}` | actualizado (solo estado `pendiente` y mes abierto) |
| POST | `/api/pendientes/{id}/concretar` | `{fecha}` | pendiente `realizado` + movimiento real generado y vinculado |
| POST | `/api/pendientes/{id}/anular` | — | pendiente `anulado` (solo desde `pendiente`, mes abierto) |

**SaldosDashboard**

| Método | Ruta | Payload | Respuesta |
|---|---|---|---|
| GET | `/api/dashboard` | query: `anio`, `mes` | `{mes: {id, anio, mes, estado}, consolidado: {saldo_inicial, ingresos, egresos, saldo_temporal, por_pagar, por_recibir, saldo_potencial, saldo_final?}, cuentas: [mismos campos por cuenta]}` — si el mes no existe: respuesta que lo indique (`mes: null`) para que el front ofrezca el cierre del mes anterior |

**CierreMensual**

| Método | Ruta | Payload | Respuesta |
|---|---|---|---|
| GET | `/api/meses` | — | lista de meses con estado (navegación) |
| POST | `/api/meses/{id}/cerrar` | — | mes cerrado + mes siguiente creado |
| POST | `/api/meses/{id}/reabrir` | — | mes reabierto + inicialización del siguiente revertida |

### Reglas de negocio clave (en Services)

**Fórmulas de saldo (SaldoService):**
- `saldo_temporal = saldo_inicial + Σ ingresos del mes − Σ egresos del mes` (por cuenta; agregados vía métodos `get*` de los Repositories, nunca sumando en loops PHP sobre colecciones completas).
- `saldo_potencial = saldo_temporal + Σ por_recibir(estado=pendiente) − Σ por_pagar(estado=pendiente)`.
- `saldo_final = saldo_temporal` congelado al cierre (persistido en `cuenta_mes.saldo_final`; solo existe en meses cerrados).
- Consolidado = suma de los valores por cuenta de las cuentas con fila en `cuenta_mes` del mes.
- Los pendientes afectan **solo** el potencial; al concretarse, el movimiento generado afecta el temporal y el pendiente deja de contar en el potencial (estado `realizado`).

**Inmutabilidad de meses cerrados:** toda escritura (movimientos, pendientes, saldo inicial) valida primero que el mes objetivo esté `abierto`; si está `cerrado` → `throwFast('mes', 'El mes está cerrado', 409)`.

**Derivación del mes de un movimiento:** `mes_id` se deriva de `fecha` (anio/mes). Si ese mes no existe → `throwFast` (mes no inicializado); si existe cerrado → `throwFast` (mes cerrado). Mismo criterio para la fecha de concreción de un pendiente.

**Cierre mensual (MesService::cerrar) — atómico en `DB::transaction()`:**
1. Validar que el mes es el último y está `abierto` (por el invariante, esto garantiza la secuencialidad; cerrar un mes que no es el abierto → `throwFast` indicando cuál debe cerrarse primero).
2. Calcular saldo temporal de cada cuenta del mes (SaldoService) y persistirlo en `cuenta_mes.saldo_final`.
3. Crear el mes siguiente (`estado=abierto`).
4. Crear `cuenta_mes` del mes nuevo **solo para cuentas activas**, con `saldo_inicial = saldo_final` (las desactivadas dejan de aparecer desde el mes siguiente, conservando historial).
5. Clonar al mes nuevo los pendientes en estado `pendiente` (con `pendiente_origen_id`).
6. Marcar el mes como `cerrado` con `fecha_cierre`.

**Reapertura (MesService::reabrir) — atómica en `DB::transaction()`:**
- Condiciones: el mes es el **último cerrado** y su mes siguiente está `abierto`, sin movimientos y sin pendientes nuevos (pendientes cuyo `pendiente_origen_id` no apunte a un pendiente del mes a reabrir). Si falla → `throwFast` con el motivo.
- Reversión: borrar los pendientes clonados del mes siguiente, borrar sus `cuenta_mes`, borrar el registro del mes siguiente, poner `saldo_final = null` en el mes reabierto y volverlo a `estado=abierto` (`fecha_cierre = null`).

**Cuentas:**
- Nombre único entre cuentas **activas** (validado en CuentaService vía CuentaRepository).
- Desactivar: rechazada si la cuenta tiene pendientes `pendiente` en el mes abierto (`throwFast`). No elimina historial (soft mediante flag `activa`).
- Crear cuenta: genera `cuenta_mes` en el mes abierto con el `saldo_inicial` dado; si no existe ningún mes, MesService bootstrapea el mes calendario actual.
- Corregir saldo inicial: solo del mes abierto; los saldos derivados se recalculan solos (son calculados, no persistidos, salvo `saldo_final`).

**Transferencias (MovimientoService::transferir) — `DB::transaction()`:** cuentas origen y destino activas y distintas, monto > 0, fecha en mes abierto. Crea egreso (origen) + ingreso (destino) con `movimiento_relacionado_id` cruzado. El consolidado no cambia. Eliminar un movimiento de transferencia elimina su par en la misma transacción; no se permite editar el monto de un movimiento vinculado a transferencia (se corrige eliminando el par y recreando).

**Pendientes:**
- Concretar (`DB::transaction()`): solo desde estado `pendiente` en mes abierto; crea el movimiento real (egreso si `por_pagar`, ingreso si `por_recibir`) con la fecha de concreción, vincula ambos (`pendiente.movimiento_id` y `movimiento.pendiente_id`) y marca `realizado`.
- Editar/anular: solo en estado `pendiente` y mes abierto; un `realizado` no se edita ni anula (`throwFast` indicando corregir vía su movimiento).
- Si se elimina el movimiento generado por un pendiente, el pendiente vuelve a estado `pendiente` (desvinculación en la misma transacción) — es la vía de corrección que exige el spec.

### Decisiones de arquitectura

1. **Un solo mes abierto (el último):** simplifica secuencialidad de cierres, derivación de "mes en curso" y validaciones de inmutabilidad. La reapertura preserva el invariante (el siguiente se elimina).
2. **Saldos calculados, no persistidos** (salvo `saldo_final` congelado): evita inconsistencias por ediciones/eliminaciones; los agregados se resuelven con queries `SUM(...) GROUP BY cuenta_id` en los Repositories (sin N+1).
3. **Arrastre de pendientes por clonación** con `pendiente_origen_id` (ver Modelo de datos): inmutabilidad del mes cerrado + reapertura reversible.
4. **`PermissionControl` del template sin modificar:** los Services llaman `hasPermission()` antes de cada escritura para cumplir el estándar; al ser app de un solo usuario sin login, se usa el comportamiento por defecto del template (sin pantallas de permisos en el scope).
5. **SQLite en desarrollo:** las migraciones usan tipos portables (compatible MySQL futuro); `foreign_key_constraints=true` en la conexión SQLite.

### Riesgos y dependencias

- **Concurrencia en cierre/reapertura:** mono-usuario reduce el riesgo; la transacción + validación del invariante dentro de la transacción lo cubre.
- **Bootstrap del primer mes:** definido como responsabilidad de MesService al crear la primera cuenta (o primer acceso al dashboard del mes actual); evitar duplicados con el UNIQUE(anio, mes).
- **Frontend dependiente del contrato:** el dashboard y la navegación de meses consumen `/api/dashboard` y `/api/meses` tal como se definen aquí; cualquier cambio debe sincronizarse con el Arquitecto Front.
- Validaciones de request detalladas (Controler), tests (Tester) y documentación (Documentador) se delegan en fases posteriores; este plan deja los puntos de inserción definidos.

### Autovalidación CSR (verificada antes de entrega)

- [x] Services sin queries directas — todos los datos via Repositories (incl. agregados SUM en MovimientoRepository/PendienteRepository).
- [x] Errores de negocio con `throwFast($campo, $mensaje, $codigoHTTP)` — ningún `throw new` propuesto.
- [x] Validación inline con `$this->validacion->validate()` — ningún FormRequest propuesto.
- [x] Ningún `$request->all()` directo a `create()`/`update()` — payloads campo a campo.
- [x] Sin valores hardcodeados — `.env` con placeholders (`<PROJECT_NAME>`, ruta SQLite), `APP_TIMEZONE=America/Santiago`.

## Frontend

### Alcance y stack

SPA React + Vite standalone (NO single-spa) en `<PROJECT_PATH>/frontend/`, que consume exactamente los 20 endpoints REST de la sección Backend. Módulos: GestionCuentas, Movimientos, Pendientes, SaldosDashboard, CierreMensual. App personal de un solo usuario: **sin login, sin token Bearer, sin rutas protegidas**.

- **Stack:** React 18+, Vite, MUI (`@mui/material` + Emotion + `@mui/icons-material`), axios, react-router-dom, zustand.
- **Convenciones:** componentes funcionales con hooks, named exports PascalCase, un componente por archivo `.jsx`, JSDoc en español obligatorio, colores solo con tokens del tema MUI (nunca hex en componentes).
- **Proyecto nuevo:** `frontend/` no existe; el plan incluye scaffolding completo.

### Scaffolding inicial

1. `npm create vite@latest frontend -- --template react` (desde `<PROJECT_PATH>`).
2. Dependencias base: `npm install @mui/material @emotion/react @emotion/styled @mui/icons-material axios react-router-dom zustand`.
3. `.env`, `.env.production` (no versionados) y `.env.example` (versionado) con: `VITE_API_URL=<API_URL>` (dev: `http://localhost:8000/api`), `VITE_API_TIMEOUT=30000`, `VITE_APP_NAME=<PROJECT_NAME>`, `VITE_APP_VERSION=1.0.0`. Acceso solo vía `config/env.js` — nunca hardcodear URLs ni puertos.
4. Crear estructura de carpetas estándar (abajo), tema MUI en `styles/theme.js` y entry `main.jsx` con `CssBaseline`.

### Estructura de carpetas

```
frontend/
├── app/
│   ├── App.jsx                 # Providers + AppRoutes
│   ├── providers.jsx           # ThemeProvider + BrowserRouter
│   ├── routes.jsx              # rutas lazy (React.lazy + Suspense)
│   └── bootstrap.js            # carga inicial de meses (useMesStore)
├── features/
│   ├── GestionCuentas/
│   │   ├── CuentasModule.jsx           # orquestador
│   │   ├── views/CuentasListView.jsx
│   │   ├── components/CuentaDialog.jsx
│   │   ├── components/SaldoInicialDialog.jsx
│   │   ├── services/cuentasService.js
│   │   └── index.js
│   ├── Movimientos/
│   │   ├── MovimientosModule.jsx
│   │   ├── views/MovimientosListView.jsx
│   │   ├── components/MovimientoDialog.jsx
│   │   ├── components/TransferenciaDialog.jsx
│   │   ├── services/movimientosService.js
│   │   └── index.js
│   ├── Pendientes/
│   │   ├── PendientesModule.jsx
│   │   ├── views/PendientesListView.jsx
│   │   ├── components/PendienteDialog.jsx
│   │   ├── components/ConcretarPendienteDialog.jsx
│   │   ├── services/pendientesService.js
│   │   └── index.js
│   ├── SaldosDashboard/
│   │   ├── DashboardModule.jsx
│   │   ├── views/DashboardView.jsx
│   │   ├── components/ConsolidadoCards.jsx
│   │   ├── components/CuentasSaldosTable.jsx
│   │   ├── components/MesSinDatos.jsx   # estado vacío + CTA cerrar mes anterior
│   │   ├── hooks/useDashboard.js
│   │   ├── services/dashboardService.js
│   │   └── index.js
│   └── CierreMensual/
│       ├── MesesModule.jsx
│       ├── views/MesesListView.jsx
│       ├── components/CerrarMesDialog.jsx
│       ├── components/ReabrirMesDialog.jsx
│       ├── hooks/useMeses.js
│       ├── services/mesesService.js
│       └── index.js
├── shared/
│   ├── components/   # AppLayout, PageHeader, FilterToolbar, DataTable,
│   │                 # ConfirmDialog, SuccessSnackbar, ErrorSnackbar, MonthNavigator
│   ├── hooks/        # useCrudList, useFlatList, useDialogState, useMesStore (zustand)
│   ├── utils/        # formatearMoneda.js (CLP), formatearFecha.js
│   └── constants/
├── services/
│   ├── httpClient.js          # axios.create + interceptors
│   ├── getEnvUrl.js
│   └── apiResponseMapper.js   # normaliza envelope ResponseUtils → {success, data}
├── config/
│   ├── env.js                 # getApiUrl(), getTimeout()
│   ├── apisUrl.js             # las 20 rutas centralizadas (API_URLS)
│   └── app.config.js          # DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS, ROUTES
├── permissions/               # estructura estándar; guards con acceso total (single-user)
├── assets/
├── styles/                    # theme.js, global.css
├── tests/
├── main.jsx
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── .gitignore
```

### Capa HTTP y store

- **`services/httpClient.js`:** `axios.create({ baseURL: getApiUrl(), timeout: getTimeout(), headers JSON })`. **Sin interceptor de token ni redirección 401 a login** (no hay autenticación). Interceptor de response: éxito → devuelve `response.data` normalizada con `apiResponseMapper`; error → `Promise.reject(error)` sin alterar, para que los hooks lean `err.response.data.errors` (formato Laravel `{campo: ['mensaje']}` que produce `ValidacionUtils`/`ErrorsBag`).
- **`services/apiResponseMapper.js`:** adapta el envelope de `ResponseUtils` del backend (`{status, data}`) al formato uniforme que consumen los hooks compartidos (`{success: true, data}`). Para listados paginados, adapta la salida de `PaginationUtils` a `{data: [...], meta: {last_page, current_page, total}}` esperado por `useCrudList`.
- **`config/apisUrl.js`:** centraliza las 20 rutas (`CUENTAS`, `CUENTAS_SALDO_INICIAL`, `CUENTAS_DESACTIVAR`, `MOVIMIENTOS`, `MOVIMIENTOS_TRANSFERENCIA`, `PENDIENTES`, `PENDIENTES_CONCRETAR`, `PENDIENTES_ANULAR`, `DASHBOARD`, `MESES`, `MESES_CERRAR`, `MESES_REABRIR`) — prohibido strings de ruta dispersos en services.
- **Store global — `shared/hooks/useMesStore.js` (zustand):** única fuente de verdad de la navegación temporal. Estado: `meses` (lista con estado abierto/cerrado), `mesSeleccionado` (default: el mes abierto — siempre el último por invariante del back), `cargando`, `error`. Acciones: `cargarMeses()` (GET `/api/meses` vía mesesService), `seleccionarMes(id)`, `irMesAnterior()`, `irMesSiguiente()`. Dashboard, Movimientos y Pendientes derivan su `mes_id`/`anio`+`mes` de este store. Tras cerrar/reabrir un mes se invoca `cargarMeses()` para resincronizar.
- **`permissions/`:** se crea la estructura estándar (`permisos.js`, `roles.js`, `permissionGuards.js`) con guards que devuelven acceso total — app de un solo usuario sin login; no hay pantallas de permisos en el scope.

### Hooks

| Hook | Tipo | Responsabilidad |
|---|---|---|
| `useCrudList` | shared | Listados con paginación de servidor, búsqueda con debounce 500 ms, filtros por `params`; expone `{items, loading, page, setPage, totalPages, searchQuery, setSearchQuery, refresh, handleDelete}` |
| `useFlatList` | shared | Listas planas para selectores (cuentas activas en dialogs); expone `{items, loading, fetch}` |
| `useDialogState` | shared | Estado de dialogs crear/editar: `{open, formData, errors, openNew, openEdit, close, setField, save}` con mapeo de errores de validación del servidor |
| `useMesStore` | shared (zustand) | Navegación por mes (ver arriba) |
| `useDashboard` | SaldosDashboard | GET `/api/dashboard?anio=&mes=` según `mesSeleccionado`; expone `{mes, consolidado, cuentas, loading, error, refresh}`; detecta `mes: null` para el estado MesSinDatos |
| `useMeses` | CierreMensual | Lista de meses + acciones `cerrar(id)` / `reabrir(id)` con loading/error propios; al éxito refresca `useMesStore` |

Los componentes vista NO contienen lógica de estado ni llamadas API: reciben datos y callbacks por props. Los hooks NUNCA llaman axios directo: siempre pasan por el service de la feature.

### Módulos: orquestador → views → dialogs

Cada módulo sigue el patrón: **orquestador delgado** (compone hooks + views + dialogs + snackbars, sin JSX de UI directa) → **view de listado** (PageHeader + FilterToolbar + DataTable, todo por props) → **dialogs** (reciben `dialogState` por props, cierre SOLO por botón explícito).

**GestionCuentas (`/cuentas`):**
- `CuentasModule`: `useCrudList(cuentasService)` + `useDialogState` (crear/editar) + estado del `SaldoInicialDialog` + `ConfirmDialog` para desactivar.
- `CuentasListView`: FilterToolbar (búsqueda + filtro activa/inactiva), DataTable con columnas nombre/banco/tipo/estado (Chip activa/inactiva) y acciones: editar, corregir saldo inicial (solo si mes abierto), desactivar.
- `CuentaDialog`: nombre, banco (opcional), tipo (Select: corriente/vista/ahorro/credito/efectivo), saldo_inicial (solo en creación). Error de nombre duplicado llega como error de validación del back.
- `SaldoInicialDialog`: corrige `saldo_inicial` del mes abierto (PUT `/cuentas/{id}/saldo-inicial`).
- Desactivar: `ConfirmDialog` previo → POST `/cuentas/{id}/desactivar`; si el back rechaza por pendientes abiertos (409), se muestra el motivo en ErrorSnackbar.

**Movimientos (`/movimientos`):**
- `MovimientosModule`: `useCrudList(movimientosService, params: {mes_id, cuenta_id, tipo, categoria})` con `mes_id` desde `useMesStore` + `useFlatList(cuentasService)` para selectores + dialogs de movimiento y transferencia.
- `MovimientosListView`: MonthNavigator + FilterToolbar (búsqueda + selects cuenta/tipo/categoría) + DataTable paginada orden fecha desc; columnas fecha, descripción, categoría, cuenta, tipo (Chip ingreso/egreso), monto formateado CLP; indicador visual de movimientos de transferencia (vinculados).
- `MovimientoDialog`: cuenta (Select de activas), tipo, monto, fecha, descripción, categoría (texto libre). En movimientos vinculados a transferencia el monto queda deshabilitado con aviso (regla del back: se corrige eliminando el par).
- `TransferenciaDialog`: cuenta_origen, cuenta_destino, monto, fecha, descripción → POST `/movimientos/transferencia`.
- Eliminar: `ConfirmDialog`; si el movimiento es de transferencia, el texto advierte que se eliminará también su par.
- Si `mesSeleccionado` está cerrado: botones crear/editar/eliminar/transferir deshabilitados con aviso "mes cerrado" (el back valida igual con 409 — doble barrera).

**Pendientes (`/pendientes`):**
- `PendientesModule`: `useCrudList(pendientesService, params: {mes_id, tipo, estado})` + `useFlatList(cuentasService)` + `useDialogState` + estado de `ConcretarPendienteDialog` + `ConfirmDialog` para anular.
- `PendientesListView`: MonthNavigator + FilterToolbar (filtros tipo por_pagar/por_recibir y estado pendiente/realizado/anulado) + DataTable: descripción, cuenta, tipo, monto, fecha estimada, estado (Chip por estado); acciones editar/concretar/anular visibles solo en estado `pendiente` y mes abierto.
- `PendienteDialog`: cuenta, tipo, monto, descripción, fecha_estimada.
- `ConcretarPendienteDialog`: pide la fecha de concreción → POST `/pendientes/{id}/concretar` `{fecha}`; al éxito refresca el listado y muestra SuccessSnackbar (se generó el movimiento real).
- Anular: `ConfirmDialog` → POST `/pendientes/{id}/anular`.

**SaldosDashboard (`/dashboard`, ruta raíz):**
- `DashboardModule`: `useDashboard` (sobre `useMesStore`) + composición de views.
- `DashboardView`: MonthNavigator + chip de estado del mes; `ConsolidadoCards` (saldo inicial, ingresos, egresos, saldo temporal, por pagar, por recibir, saldo potencial; en mes cerrado además saldo final); `CuentasSaldosTable` (mismos campos por cuenta, responsive).
- `MesSinDatos`: cuando `/api/dashboard` responde `mes: null` (mes futuro sin inicializar), muestra el aviso y un CTA "Cerrar <mes anterior>" que navega a `/meses` (vía del spec para inicializarlo).

**CierreMensual (`/meses`):**
- `MesesModule`: `useMeses` + dialogs de cierre/reapertura.
- `MesesListView`: DataTable de meses (anio/mes, estado, fecha de cierre); acción "Cerrar" solo en el mes abierto; acción "Reabrir" solo en el último cerrado.
- `CerrarMesDialog`: confirmación explícita que explica las consecuencias (congela saldos finales, crea mes siguiente, arrastra pendientes) → POST `/meses/{id}/cerrar`.
- `ReabrirMesDialog`: confirmación explícita → POST `/meses/{id}/reabrir`; si el back rechaza (mes siguiente con datos), el motivo se muestra al usuario.

### Mapeo componente → endpoint

| Componente / hook | Service | Endpoint |
|---|---|---|
| CuentasListView (vía useCrudList) | cuentasService.getList | GET `/api/cuentas?activa=` |
| Selectores de cuenta (useFlatList) | cuentasService.getActivas | GET `/api/cuentas?activa=1` |
| CuentaDialog (crear) | cuentasService.create | POST `/api/cuentas` |
| CuentaDialog (editar) | cuentasService.update | PUT `/api/cuentas/{id}` |
| SaldoInicialDialog | cuentasService.updateSaldoInicial | PUT `/api/cuentas/{id}/saldo-inicial` |
| ConfirmDialog desactivar | cuentasService.desactivar | POST `/api/cuentas/{id}/desactivar` |
| MovimientosListView (useCrudList) | movimientosService.getList | GET `/api/movimientos?mes_id=&cuenta_id=&tipo=&categoria=&page=&per_page=` |
| MovimientoDialog (crear/editar) | movimientosService.create / update | POST / PUT `/api/movimientos(/{id})` |
| Eliminar movimiento (handleDelete) | movimientosService.delete | DELETE `/api/movimientos/{id}` |
| TransferenciaDialog | movimientosService.transferir | POST `/api/movimientos/transferencia` |
| PendientesListView (useCrudList) | pendientesService.getList | GET `/api/pendientes?mes_id=&tipo=&estado=` |
| PendienteDialog (crear/editar) | pendientesService.create / update | POST / PUT `/api/pendientes(/{id})` |
| ConcretarPendienteDialog | pendientesService.concretar | POST `/api/pendientes/{id}/concretar` |
| ConfirmDialog anular | pendientesService.anular | POST `/api/pendientes/{id}/anular` |
| useDashboard | dashboardService.getDashboard | GET `/api/dashboard?anio=&mes=` |
| useMesStore / useMeses | mesesService.getList | GET `/api/meses` |
| CerrarMesDialog | mesesService.cerrar | POST `/api/meses/{id}/cerrar` |
| ReabrirMesDialog | mesesService.reabrir | POST `/api/meses/{id}/reabrir` |

Los services envían los parámetros **planos** tal como los define el contrato del back (`mes_id`, `cuenta_id`, `tipo`, `categoria`, `page`, `per_page`) — el service es la capa que adapta la firma genérica de `useCrudList` al contrato real.

### Navegación por mes

- Rutas (react-router-dom, lazy con `React.lazy` + `Suspense`): `/` → redirect `/dashboard`; `/dashboard`, `/cuentas`, `/movimientos`, `/pendientes`, `/meses`. `AppLayout` con navegación lateral a los 5 módulos.
- `app/bootstrap.js` dispara `useMesStore.cargarMeses()` al inicio; el mes seleccionado por defecto es el mes abierto. Si no existe ningún mes (primer uso), el dashboard muestra el estado vacío invitando a crear la primera cuenta (el back bootstrapea el primer mes al crearla).
- `MonthNavigator` (shared): botones anterior/siguiente + etiqueta "Mes Año" + Chip `abierto`/`cerrado`; presente en Dashboard, Movimientos y Pendientes; permite avanzar un mes más allá del último (mes futuro → MesSinDatos en dashboard).
- Mes cerrado = modo solo lectura en toda la UI (acciones de escritura deshabilitadas con tooltip explicativo). La fuente de verdad sigue siendo el backend (409).

### Estados de carga y error (reglas UX obligatorias)

- **Carga:** `loading` de los hooks → indicador en DataTable y Skeleton en las cards del dashboard; botones de guardado deshabilitados durante el submit.
- **Éxito:** toda acción API exitosa (crear, editar, eliminar, transferir, concretar, anular, cerrar, reabrir) muestra `SuccessSnackbar` (Alert `severity="success"`).
- **Error:** errores de validación → Alert dentro del dialog (`errors.general` + `helperText` por campo desde `err.response.data.errors`); errores fuera de dialog → `ErrorSnackbar` con el mensaje del back. Nunca silenciar errores.
- **Dialogs:** `onClose` del MUI Dialog sin acción de cierre — solo se cierran con botón explícito (Cancelar / Guardar exitoso).
- **Grillas responsivas:** contenedor con `overflowX: 'auto'`, columnas secundarias ocultas en mobile, columna de acciones siempre visible.

### Decisiones de arquitectura

1. **Mes como estado global (zustand):** Dashboard, Movimientos y Pendientes comparten el mes seleccionado; evita prop-drilling y desincronización entre módulos al navegar.
2. **Adaptación de envelope en `apiResponseMapper`:** el back responde `{status, data}` (ResponseUtils); los hooks compartidos esperan `{success, data}` — la normalización vive en un solo punto (services layer), los hooks no conocen el formato del back.
3. **Sin autenticación:** httpClient sin token ni manejo de 401→login; `permissions/` mantiene la estructura del estándar con acceso total (single-user). No se agrega ninguna pantalla de login (fuera de scope).
4. **Doble barrera para meses cerrados:** la UI deshabilita acciones de escritura en meses cerrados (mejor UX), pero la validación autoritativa es la del backend — la UI siempre muestra el error 409 si llega.
5. **Atributos `id` y `data-testid`** en todo elemento interactivo, formato `[modulo]-[elemento]-[calificador]` kebab-case (ej.: `cuentas-btn-nueva`, `movimientos-select-tipo`, `meses-btn-cerrar`) — requerido por el estándar y por el Tester Front (Playwright).
6. **Categoría como texto libre:** el back no expone catálogo de categorías; el front usa TextField (sin inventar endpoints fuera del contrato).

### Riesgos y dependencias

- **Forma exacta del meta de paginación de `PaginationUtils`:** el mapper asume `{data, meta: {last_page, ...}}`; confirmar los nombres reales del template en FASE 3 (el Interconector lo valida en FASE 5).
- **CORS:** el backend debe permitir el origen del dev server de Vite (config CORS de Laravel) — coordinación con el Arquitecto Back en FASE 3.
- **Contrato del dashboard con `mes: null`:** MesSinDatos depende de esa señal exacta; cualquier cambio debe sincronizarse con el Arquitecto Back.
- Tests E2E (Tester Front) y documentación (Documentador) se delegan a fases posteriores; los `data-testid` quedan definidos desde la implementación para no bloquear al Tester.

### Autovalidación react-vite (verificada antes de entrega)

- [x] Hooks encapsulan toda la lógica de estado y llamadas API — las views solo reciben datos y callbacks por props, sin lógica interna.
- [x] Orquestadores delgados — solo composición de hooks, views, dialogs y snackbars; sin JSX de UI directa.
- [x] Sin lógica de filtros ad-hoc en componentes — `FilterToolbar` centralizado en todos los listados con filtros (Cuentas, Movimientos, Pendientes); estado de filtros en `useCrudList`/orquestador.
- [x] Operaciones destructivas con confirmación previa explícita: eliminar movimiento (advirtiendo eliminación del par de transferencia), anular pendiente, desactivar cuenta, cerrar mes y reabrir mes (ConfirmDialog / dialogs de confirmación dedicados).
