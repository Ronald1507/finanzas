# Tasks — finanzas-personales

## Backend

### 1. Scaffolding

- [x] Crear proyecto Laravel 11+ en `backend/` con `composer create-project laravel/laravel backend`
- [x] Configurar `.env` de desarrollo: SQLite (`database/database.sqlite`), `APP_TIMEZONE=America/Santiago`, placeholders sin credenciales reales; crear el archivo SQLite vacío
- [x] Habilitar `routes/api.php` en `bootstrap/app.php` (`withRouting`, prefijo `api`, sin autenticación/Sanctum)
- [x] Copiar templates completos desde `SKILL_DIR/templates/laravel/` a `app/Utils/` (ResponseUtils, ValidacionUtils, ErrorsBag, PaginationUtils, PermissionControl, Helpers, DebugLog) sin modificarlos

### 2. Base de datos y modelos

- [x] Migración `meses` (anio, mes, estado, fecha_cierre; UNIQUE(anio, mes), índice estado)
- [x] Migración `cuentas` (nombre, banco, tipo, activa; índices nombre y activa)
- [x] Migración `cuenta_mes` (cuenta_id, mes_id, saldo_inicial, saldo_final nullable; UNIQUE(cuenta_id, mes_id))
- [x] Migración `movimientos` (cuenta_id, mes_id, tipo, monto, fecha, descripcion, categoria, pendiente_id nullable, movimiento_relacionado_id nullable; índices (mes_id, cuenta_id), fecha, tipo, categoria)
- [x] Migración `pendientes` (cuenta_id, mes_id, tipo, monto, descripcion, fecha_estimada, estado, movimiento_id nullable, pendiente_origen_id nullable; índices (mes_id, estado), tipo)
- [x] Modelos `Mes`, `Cuenta`, `CuentaMes`, `Movimiento`, `Pendiente` con `$fillable`, `$casts` (booleanos, decimal:2, fechas) y relaciones Eloquent con PHPDoc `@return` tipado genérico
- [x] Ejecutar `php artisan migrate` y verificar el esquema en SQLite

### 3. Capa Repository

- [x] `MesRepository` (findUltimoMes, findMesPorAnioMes, findMesAbierto, getMeses, create, update, delete)
- [x] `CuentaRepository` (findCuenta, findCuentaActivaPorNombre, getCuentas, getCuentasActivas, create, update)
- [x] `CuentaMesRepository` (findPorCuentaYMes, getPorMes, create, update, delete, bulkInsert para el cierre)
- [x] `MovimientoRepository` (findMovimiento, paginateMovimientos con PaginationUtils y filtros, getTotalesPorMes — SUM ingresos/egresos GROUP BY cuenta, create, update, delete)
- [x] `PendienteRepository` (findPendiente, getPorMes con filtros tipo/estado, getPendientesAbiertosPorCuentaYMes, getTotalesPendientesPorMes — SUM por tipo GROUP BY cuenta, getClonadosDesdeMes, create, update, delete)

### 4. Módulo GestionCuentas

- [x] `CuentaService`: crear (unicidad de nombre entre activas, bootstrap del primer mes vía MesService, cuenta_mes inicial), editar datos básicos, corregir saldo inicial (solo mes abierto), desactivar (rechazo si hay pendientes abiertos); `hasPermission()` antes de cada escritura
- [x] `CuentaController` (inyecta CuentaService + ResponseUtils + ValidacionUtils): endpoints GET/POST/PUT cuentas, PUT saldo-inicial, POST desactivar, con validación inline y try-catch
- [x] Rutas de cuentas en `routes/api.php` con nombres kebab-case

### 5. Módulo Movimientos

- [x] `MovimientoService`: crear/editar/eliminar con derivación de mes desde fecha y validación de mes abierto, reglas de transferencia (par vinculado, eliminación en par, edición de monto bloqueada en vinculados) y desvinculación de pendiente al eliminar movimiento generado; transacciones donde hay escrituras múltiples
- [x] `MovimientoController`: GET paginado con filtros, POST, PUT, DELETE, POST transferencia, con validación inline y try-catch
- [x] Rutas de movimientos en `routes/api.php` con nombres kebab-case

### 6. Módulo Pendientes

- [x] `PendienteService`: crear (mes abierto, cuenta activa, monto > 0), editar/anular (solo estado pendiente y mes abierto), concretar en transacción (genera movimiento real vinculado y marca realizado)
- [x] `PendienteController`: GET con filtros, POST, PUT, POST concretar, POST anular, con validación inline y try-catch
- [x] Rutas de pendientes en `routes/api.php` con nombres kebab-case

### 7. Módulo SaldosDashboard

- [x] `SaldoService`: cálculo de saldo temporal/potencial/final por cuenta y consolidado del mes a partir de agregados de los Repositories (sin N+1), manejo de mes inexistente
- [x] `DashboardController`: GET `/api/dashboard?anio=&mes=` con validación inline y try-catch
- [x] Ruta del dashboard en `routes/api.php` con nombre kebab-case

### 8. Módulo CierreMensual

- [x] `MesService`: listar meses, bootstrap del primer mes, cierre atómico en `DB::transaction()` (congelar saldos finales vía SaldoService, crear mes siguiente, cuenta_mes solo de cuentas activas, clonar pendientes con pendiente_origen_id, marcar cerrado) con validación de secuencialidad
- [x] `MesService`: reapertura atómica del último mes cerrado (validar mes siguiente sin movimientos ni pendientes nuevos; revertir clones, cuenta_mes y mes siguiente; descongelar saldo final)
- [x] `MesController`: GET meses, POST cerrar, POST reabrir, con validación inline y try-catch
- [x] Rutas de meses en `routes/api.php` con nombres kebab-case

### 9. Verificación final backend

- [x] `php artisan migrate:fresh` limpio y `php artisan route:list` con todas las rutas y nombres kebab-case
- [x] Smoke manual del flujo completo: crear cuenta → movimientos → pendiente → concretar → dashboard → cierre → dashboard mes nuevo → reapertura

## Frontend

### 10. Scaffolding frontend

- [x] Crear proyecto Vite en `frontend/` con `npm create vite@latest frontend -- --template react` e instalar dependencias base (@mui/material, @emotion/react, @emotion/styled, @mui/icons-material, axios, react-router-dom, zustand)
- [x] Crear `.env`, `.env.production` y `.env.example` con `VITE_API_URL`, `VITE_API_TIMEOUT`, `VITE_APP_NAME`, `VITE_APP_VERSION` (placeholders, sin hardcodear) y `.gitignore` que excluya los `.env` locales
- [x] Crear estructura de carpetas estándar: `app/`, `features/`, `shared/`, `services/`, `config/`, `permissions/`, `assets/`, `styles/`, `tests/`
- [x] Crear `config/env.js`, `config/apisUrl.js` (las 20 rutas del backend centralizadas) y `config/app.config.js` (DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS, ROUTES)
- [x] Crear `services/httpClient.js` (axios sin token/401, interceptor de response con normalización), `services/apiResponseMapper.js` (envelope ResponseUtils → `{success, data}` y adaptación de PaginationUtils a `{data, meta}`) y `services/getEnvUrl.js`
- [x] Crear `permissions/` estándar (permisos.js, roles.js, permissionGuards.js) con guards de acceso total (single-user, sin login)
- [x] Crear `styles/theme.js` (tema MUI, colores solo por tokens), `styles/global.css` y `main.jsx` con CssBaseline
- [x] Crear `app/` (App.jsx, providers.jsx, routes.jsx con React.lazy + Suspense para los 5 módulos, bootstrap.js que carga meses) y `shared/components/AppLayout.jsx` con navegación a `/dashboard`, `/cuentas`, `/movimientos`, `/pendientes`, `/meses`

### 11. Shared (hooks, store y componentes comunes)

- [x] Hooks compartidos: `useCrudList` (paginación servidor, debounce 500 ms, filtros), `useFlatList`, `useDialogState` (con mapeo de errores de validación del back)
- [x] Store de mes: `shared/hooks/useMesStore.js` (zustand) con meses, mesSeleccionado (default mes abierto), cargarMeses, seleccionarMes, irMesAnterior/irMesSiguiente
- [x] Componentes compartidos: `PageHeader`, `FilterToolbar` (búsqueda + slot de filtros extra), `DataTable` (responsive con overflowX auto, paginación, acciones siempre visibles en mobile), `ConfirmDialog`, `SuccessSnackbar`, `ErrorSnackbar`
- [x] `MonthNavigator` (anterior/siguiente + chip estado abierto/cerrado, conectado a useMesStore)
- [x] Utils: `formatearMoneda` (CLP) y `formatearFecha`

### 12. Módulo GestionCuentas

- [x] `cuentasService` (getList con filtro activa, getById, create, update, updateSaldoInicial, desactivar) usando apisUrl
- [x] `CuentasListView` (FilterToolbar con filtro activa/inactiva + DataTable con chips de estado y acciones editar/saldo inicial/desactivar) — solo props, sin estado propio
- [x] `CuentaDialog` (nombre, banco, tipo en Select, saldo_inicial solo en creación) y `SaldoInicialDialog` (solo mes abierto)
- [x] `CuentasModule` orquestador delgado: useCrudList + useDialogState + ConfirmDialog de desactivación (muestra motivo 409 si hay pendientes abiertos) + snackbars; export en `index.js` y ruta `/cuentas`

### 13. Módulo Movimientos

- [x] `movimientosService` (getList con params planos mes_id/cuenta_id/tipo/categoria/page/per_page, create, update, delete, transferir)
- [x] `MovimientosListView`: MonthNavigator + FilterToolbar (selects cuenta/tipo/categoría) + DataTable paginada orden fecha desc, montos en CLP, indicador de movimientos de transferencia; acciones deshabilitadas con aviso si el mes está cerrado
- [x] `MovimientoDialog` (cuenta de useFlatList, tipo, monto, fecha, descripción, categoría texto libre; monto deshabilitado si es movimiento vinculado a transferencia)
- [x] `TransferenciaDialog` (cuenta origen/destino distintas, monto, fecha, descripción → POST /movimientos/transferencia)
- [x] `MovimientosModule` orquestador: useCrudList con mes_id del store + useFlatList(cuentas) + dialogs + ConfirmDialog de eliminación (advierte eliminación del par si es transferencia) + snackbars; ruta `/movimientos`

### 14. Módulo Pendientes

- [x] `pendientesService` (getList con mes_id/tipo/estado, create, update, concretar, anular)
- [x] `PendientesListView`: MonthNavigator + FilterToolbar (filtros tipo y estado) + DataTable con chips de estado; acciones editar/concretar/anular solo en estado pendiente y mes abierto
- [x] `PendienteDialog` (cuenta, tipo, monto, descripción, fecha_estimada) y `ConcretarPendienteDialog` (fecha de concreción → POST /concretar)
- [x] `PendientesModule` orquestador: useCrudList + useFlatList(cuentas) + dialogs + ConfirmDialog de anulación + snackbars; ruta `/pendientes`

### 15. Módulo SaldosDashboard

- [x] `dashboardService.getDashboard(anio, mes)` y hook `useDashboard` (consume mesSeleccionado del store; expone mes/consolidado/cuentas/loading/error/refresh; detecta `mes: null`)
- [x] `ConsolidadoCards` (saldo inicial, ingresos, egresos, saldo temporal, por pagar, por recibir, saldo potencial; saldo final si mes cerrado) con Skeleton de carga
- [x] `CuentasSaldosTable` (mismos campos por cuenta, responsive) y `MesSinDatos` (estado vacío con CTA "Cerrar mes anterior" → `/meses`)
- [x] `DashboardView` (MonthNavigator + chip estado + composición de cards/tabla) y `DashboardModule` orquestador; rutas `/` → `/dashboard`

### 16. Módulo CierreMensual

- [x] `mesesService` (getList, cerrar, reabrir) y hook `useMeses` (lista + acciones con loading/error; refresca useMesStore al éxito)
- [x] `MesesListView`: DataTable de meses (anio/mes, estado, fecha de cierre); acción Cerrar solo en el mes abierto, Reabrir solo en el último cerrado
- [x] `CerrarMesDialog` (confirmación explícita con consecuencias: congela saldos, crea mes siguiente, arrastra pendientes) y `ReabrirMesDialog` (confirmación; muestra motivo de rechazo del back)
- [x] `MesesModule` orquestador + ruta `/meses`

### 17. Verificación final frontend

- [x] Atributos `id` y `data-testid` en todos los elementos interactivos con formato `[modulo]-[elemento]-[calificador]` kebab-case
- [x] JSDoc en español en todos los hooks, services, stores y componentes exportados; colores solo con tokens del tema MUI
- [x] `npm run build` limpio (sin errores ni warnings de imports)
- [ ] Smoke manual contra el backend: crear cuenta → registrar movimientos → transferencia → pendiente → concretar → dashboard → cerrar mes → dashboard mes nuevo → reabrir

## GastosFijos (módulo post-spec — formalizado 2026-10-26)

### 18. Módulo GastosFijos — Backend

- [x] Migración `gastos_fijos` (nombre, categoria, cuenta_id nullable, monto_estimado nullable, activo)
- [x] Migración `add_gasto_fijo_id_to_movimientos` (FK nullable → gastos_fijos, nullOnDelete)
- [x] Modelo `GastoFijo` con `$fillable`, `$casts` (decimal:2, boolean) y relaciones Eloquent
- [x] `GastoFijoRepository` (findGastoFijo, paginate con search/activo, getActivos, getActivosConEstadoMes LEFT JOIN, findMovimientoDelMes, create, update)
- [x] `GastoFijoService` (listar, crear, editar, desactivar, listarPorMes, registrarPago, deshacerPago)
- [x] `GastoFijoController` (index, store, update, desactivar, indexPorMes, pagar, deshacerPago) con validación inline
- [x] Rutas en `routes/api.php` con nombres kebab-case (`gastos-fijos.*`)
- [ ] Spec formalizada en `specs/gastos-fijos/spec.md` — creada 2026-10-26

### 19. Módulo GastosFijos — Frontend

- [x] `gastosFijosService` (getPorMes, getList, create, update, desactivar, pagar, deshacerPago)
- [x] Hook `useGastosFijosMes` (lista mensual con estado de pago y totales; re-fetch al cambiar mesId)
- [x] `GastoFijoDialog` (crear/editar: nombre, categoría, cuenta, monto estimado)
- [x] `RegistrarPagoDialog` (monto real, fecha, cuenta → POST /gastos-fijos/{id}/pagar)
- [x] `GastosFijosModule` orquestador + ruta `/gastos-fijos`
- [ ] Smoke manual del módulo: crear gasto fijo → listar por mes → registrar pago → verificar egreso en Movimientos → deshacer pago → desactivar
