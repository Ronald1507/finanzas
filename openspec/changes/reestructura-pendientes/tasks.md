# Tasks — reestructura-pendientes

> Unificar GastosFijos en Pendientes mediante el campo `recurrente`.
> Backend: Laravel CSR (Controller → Service → Repository). Frontend: React+Vite (Hooks → Vistas → Orquestador).

## 1. Backend

Proyecto: `backend/` (Laravel CSR). Runner: Pest. Orden recomendado: migraciones → Model/Repo/Service/Controller → eliminación GastosFijos → verificación.

### 1.1 Migraciones de esquema y datos

- [x] 1.1.1 Crear migración `add_recurrente_to_pendientes`: columna `recurrente` boolean default false en `pendientes` + índice compuesto `['recurrente', 'estado']`; `down()` hace `dropColumn('recurrente')`.
- [x] 1.1.2 Crear data migration `migrate_gastos_fijos_to_pendientes` con el query builder (no Eloquent): no-op si no hay gastos fijos activos; resolver mes abierto (abortar con excepción si falta y hay gastos activos); resolver cuenta activa fallback; insertar cada gasto fijo activo como pendiente según mapeo D2 (`tipo=por_pagar`, `estado=pendiente`, `recurrente=true`, `monto=monto_estimado ?? 0`, `descripcion=nombre`, `fecha_estimada=fin del mes abierto`, `cuenta_id=gf.cuenta_id ?? primera cuenta activa`); `down()` no-op documentado.
- [x] 1.1.3 En la migración 1.1.2, relinkear movimientos históricos: por cada `gf.id → pendiente.id`, `UPDATE movimientos SET pendiente_id = <pid> WHERE gasto_fijo_id = <gfid> AND pendiente_id IS NULL`.
- [x] 1.1.4 Crear migración `drop_gastos_fijos`: en `movimientos` `dropForeign(['gasto_fijo_id'])` luego `dropColumn('gasto_fijo_id')`; después `Schema::dropIfExists('gastos_fijos')`; `down()` recrea `gastos_fijos` y re-agrega `movimientos.gasto_fijo_id` con su FK (solo estructura).
- [x] 1.1.5 Ejecutar `php artisan migrate:fresh` sobre SQLite y verificar: `pendientes.recurrente` existe; `gastos_fijos` y `movimientos.gasto_fijo_id` ya no existen. → OK

### 1.2 Model Pendiente

- [x] 1.2.1 Agregar `recurrente` a `$fillable` en `app/Models/Pendiente.php`.
- [x] 1.2.2 Agregar cast `'recurrente' => 'boolean'` y `@property bool $recurrente` en el docblock.

### 1.3 PendienteRepository

- [x] 1.3.1 En `paginatePorMes`: aceptar filtro `recurrente` (nullable) vía `->when(isset($params['recurrente']), fn($q) => $q->where('recurrente', $params['recurrente']))`.
- [x] 1.3.2 En `getPorMes`: agregar parámetro opcional `?bool $recurrente = null` con `when` análogo (mantener compatibilidad con llamadas existentes).
- [x] 1.3.3 Agregar método de query `getClonablesPorCierre(int $mesId): Collection` que retorna recurrentes en cualquier estado UNIÓN no recurrentes en estado `pendiente` (criterio SQL puro, sin lógica de negocio).

### 1.4 PendienteService

- [x] 1.4.1 En `crear`: setear `'recurrente' => $datos['recurrente'] ?? false` en el array pasado a `create` (no usar `$datos` crudo).
- [x] 1.4.2 En `editar`: incluir `'recurrente' => $datos['recurrente'] ?? $pendiente->recurrente` en el array de `update`.

### 1.5 MesService — clonado diferenciado en cierre

- [x] 1.5.1 En `cerrar` paso 5: reemplazar `getPorMes($mes->id, null, 'pendiente')` por `getClonablesPorCierre($mes->id)`.
- [x] 1.5.2 Al armar `rowsPendientes`, propagar `'recurrente' => $pendiente->recurrente`; mantener `estado=pendiente`, `movimiento_id=null`, `pendiente_origen_id=$pendiente->id`.
- [x] 1.5.3 Verificar que la reapertura sigue correcta: los clones recurrentes también llevan `pendiente_origen_id`, por lo que `countPendientesNuevosPorMes` y `deleteByOrigenMesId` no requieren cambios.

### 1.6 PendienteController

- [x] 1.6.1 En `index`: agregar regla `'recurrente' => 'nullable|boolean'` y añadir `recurrente` al `$request->only([...])`.
- [x] 1.6.2 En `store`: agregar regla `'recurrente' => 'nullable|boolean'` y al `$request->only([...])`.
- [x] 1.6.3 En `update`: agregar regla `'recurrente' => 'nullable|boolean'` y al `$request->only([...])`.

### 1.7 Eliminación del módulo GastosFijos

- [x] 1.7.1 Eliminar `app/Http/Controllers/GastoFijoController.php`.
- [x] 1.7.2 Eliminar `app/Services/GastoFijoService.php`.
- [x] 1.7.3 Eliminar `app/Repositories/GastoFijoRepository.php`.
- [x] 1.7.4 Eliminar `app/Models/GastoFijo.php`.
- [x] 1.7.5 En `app/Models/Movimiento.php`: quitar `gasto_fijo_id` de `$fillable`, eliminar el método `gastoFijo()`, quitar `@property int|null $gasto_fijo_id` del docblock.
- [x] 1.7.6 En `routes/api.php`: eliminar el bloque de 7 rutas `gastos-fijos.*` y el `use App\Http\Controllers\GastoFijoController;`.
- [x] 1.7.7 Grep `gasto_fijo` en `backend/app` y `backend/tests`: eliminar/ajustar referencias residuales (p. ej. `MovimientoService::crear`, `MovimientoRepository`, factories, seeders, tests de gastos fijos).

### 1.8 Verificación backend

- [x] 1.8.1 Correr la suite Pest completa; eliminar o reescribir tests de GastosFijos que ya no apliquen. → 33 passed, 0 failed
- [x] 1.8.2 Test de cierre: pendiente recurrente `realizado`/`anulado` se clona como `pendiente`; no recurrente `realizado`/`anulado` NO se clona; no recurrente `pendiente` sí se clona. → `backend/tests/Unit/CierreMensual/MesServiceCierreTest.php` (6 tests, Mockery Mode)
- [x] 1.8.3 Test de filtro: `GET /api/pendientes?recurrente=1` retorna solo recurrentes; `recurrente=0` solo únicos; sin filtro retorna ambos. → `backend/tests/Unit/Pendientes/PendienteServiceTest.php` (6 tests, Mockery Mode)
- [ ] 1.8.4 Test de data migration (si hay infraestructura): gastos fijos activos quedan como pendientes recurrentes y sus movimientos históricos conservan `pendiente_id`.

## 2. Frontend

Proyecto: `frontend/` (raíz real de código: `frontend/src/`). Runner E2E: Playwright (`frontend/tests/`).

### Orden de ejecución (evita romper la app en pasos intermedios)

Se actualizan primero las referencias cruzadas que apuntan a GastosFijos, luego se elimina el módulo, y al final se agrega el campo `recurrente`. Así la app compila en cada paso (nunca queda un `import` colgado hacia un módulo ya borrado).

1. `apisUrl.js` — remover endpoints gastos-fijos, agregar `recurrente` a params de pendientes
2. `routes.jsx` — remover lazy import y `<Route>` de GastosFijos
3. `AppLayout.jsx` — remover nav link "Gastos Fijos"
4. `app.config.js` — remover `ROUTES.GASTOS_FIJOS`
5. Eliminar `features/GastosFijos/` completo (ya sin referencias)
6. `PendienteDialog.jsx` — agregar toggle `recurrente`
7. `pendientesService.js` — propagar `recurrente` en `getList` y en create/update
8. `PendientesModule.jsx` — estado del filtro `recurrente` + pasarlo a params/listHook
9. `PendientesListView.jsx` — ComboBox de filtro recurrente (en `FilterToolbar`) + indicador visual en columna
10. Tests Playwright de Pendientes (`recurrente`) + limpiar specs de GastosFijos

---

### T-F1 · Remover endpoints gastos-fijos y agregar `recurrente` en apisUrl
- [x] Specs: proposal (What Changes frontend)
- Ruta: inline
- Archivo: `frontend/src/config/apisUrl.js`
- Eliminar el bloque `// GastosFijos` completo: `GASTOS_FIJOS`, `GASTOS_FIJOS_BY_ID`, `GASTOS_FIJOS_DESACTIVAR`, `GASTOS_FIJOS_POR_MES`, `GASTOS_FIJOS_PAGAR`, `GASTOS_FIJOS_PAGO`.
- No se agrega URL nueva: `recurrente` viaja como query param de `/pendientes` (ya centralizado en `PENDIENTES`). El param se arma en `pendientesService.getList` (ver T-F7). Actualizar el comentario de cabecera ("Centraliza las 20 rutas") al nuevo conteo.
- Risk: item 3 (contrato consumido por `gastosFijosService`) — mitigado porque el módulo GastosFijos se elimina en T-F5; validar que ningún otro service importe `GASTOS_FIJOS_*`.

### T-F2 · Remover ruta GastosFijos de routes.jsx
- [x] Specs: proposal (What Changes frontend)
- Ruta: inline
- Archivo: `frontend/src/app/routes.jsx`
- Eliminar el `const GastosFijosModule = React.lazy(...)` y su `<Route path={APP_CONFIG.ROUTES.GASTOS_FIJOS} ... />`.
- El `<Route path="*">` ya redirige a Dashboard, así que `/gastos-fijos` cae al fallback (sin 404 roto).
- Risk: none.

### T-F3 · Remover nav link GastosFijos de AppLayout
- [x] Specs: proposal (What Changes frontend)
- Ruta: inline
- Archivo: `frontend/src/shared/components/AppLayout.jsx`
- Eliminar la entrada `{ label: 'Gastos Fijos', path: APP_CONFIG.ROUTES.GASTOS_FIJOS, icon: <ReceiptLongIcon /> }` de `NAV_ITEMS`.
- Eliminar el import `ReceiptLongIcon` si queda sin uso (verificar que no lo use otro item).
- Risk: none.

### T-F4 · Remover ROUTES.GASTOS_FIJOS de app.config
- [x] Specs: proposal (What Changes frontend)
- Ruta: inline
- Archivo: `frontend/src/config/app.config.js`
- Eliminar `GASTOS_FIJOS: '/gastos-fijos'` de `APP_CONFIG.ROUTES`.
- Hacer T-F2 y T-F3 antes para no dejar referencias al valor eliminado.
- Risk: none.

### T-F5 · Eliminar módulo features/GastosFijos
- [x] Specs: specs/gastos-fijos (REMOVED)
- Ruta: inline
- Eliminar el directorio completo `frontend/src/features/GastosFijos/` y todos sus archivos:
  - `GastosFijosModule.jsx`, `index.js`
  - `components/GastoFijoDialog.jsx`, `components/RegistrarPagoDialog.jsx`
  - `hooks/useGastosFijosMes.js`
  - `services/gastosFijosService.js`
  - `views/GastosFijosView.jsx`
- Hacer DESPUÉS de T-F1..T-F4 (ya sin imports entrantes). Verificar con un grep final `GastosFijos|gastos-fijos|gastosFijos` sobre `frontend/src/` → debe quedar en 0.
- No tocar `frontend/dist/` (build artifact, se regenera).
- Risk: item 3 (eliminación de exports consumibles) — contenido vía orden de ejecución y grep de verificación.

### T-F6 · PendienteDialog — agregar toggle `recurrente`
- [x] Specs: specs/pendientes "Pendiente puede marcarse como recurrente" (Scenario: crear recurrente=true, crear default false, editar)
- Ruta: inline
- Archivo: `frontend/src/features/Pendientes/components/PendienteDialog.jsx`
- Agregar control booleano con `FormControlLabel` + `Switch` de MUI (el proyecto no tiene componente toggle propio; se usa la primitiva MUI igual que el resto de campos del dialog):
  ```jsx
  <FormControlLabel
      sx={{ mt: 2, display: 'block' }}
      control={
          <Switch
              checked={!!formData.recurrente}
              onChange={(e) => setField('recurrente', e.target.checked)}
              id="pendientes-switch-recurrente"
              inputProps={{ 'data-testid': 'pendientes-switch-recurrente' }}
          />
      }
      label="Recurrente (se repite cada mes)"
  />
  ```
- Incluir `recurrente: !!data.recurrente` en el transform del botón Guardar (el objeto que arma `save`).
- Los valores se envían como el backend los espera (boolean); no agregar conversión extra.
- Risk: none (campo opcional nuevo, default false).

### T-F7 · pendientesService — propagar `recurrente`
- [x] Specs: specs/pendientes (filtro + persistencia del campo)
- Ruta: inline
- Archivo: `frontend/src/features/Pendientes/services/pendientesService.js`
- En `getList`: `if (filters.recurrente !== '' && filters.recurrente != null) p.set('recurrente', filters.recurrente);` (acepta `'1'`/`'0'`; `''` = todos → no se envía el param).
- `create`/`update` ya reenvían el objeto `data` tal cual, por lo que `recurrente` viaja sin cambios; actualizar solo el JSDoc de `data` para incluir `recurrente`.
- Risk: item 3 (firma de getList compartida por `useCrudList`) — el nuevo filtro es opcional y no altera params existentes.

### T-F8 · PendientesModule — estado y propagación del filtro `recurrente`
- [x] Specs: specs/pendientes "Filtrar pendientes por tipo recurrente"
- Ruta: inline
- Archivo: `frontend/src/features/Pendientes/PendientesModule.jsx`
- Agregar `const [recurrenteFilter, setRecurrenteFilter] = useState('');` (`''` todos, `'1'` recurrentes, `'0'` únicos).
- Incluir `recurrente: recurrenteFilter` en `params` de `useCrudList` (se mapea a `filters.recurrente` en el service).
- Agregar `recurrente` al `initialForm` de `useDialogState`: `{ ..., recurrente: false }` para que el toggle arranque en false y el edit cargue el valor existente.
- Pasar `recurrenteFilter` y `onRecurrenteFilterChange={setRecurrenteFilter}` como props a `PendientesListView`.
- La lógica de estado queda en el orquestador/hook; la vista solo recibe props (regla Hooks encapsulan estado).
- Risk: none.

### T-F9 · PendientesListView — filtro recurrente (FilterToolbar) + indicador visual
- [x] Specs: specs/pendientes "Filtrar..." (Scenario recurrentes/únicos) + "indicador visual de recurrente en la lista"
- Ruta: inline
- Archivo: `frontend/src/features/Pendientes/views/PendientesListView.jsx`
- Filtro: agregar un `ComboBox` más dentro de `filtrosExtra` (que ya se pasa a `FilterToolbar extraFilters`), siguiendo el patrón idéntico de los filtros Tipo/Estado. **No** crear un control ad-hoc fuera de `FilterToolbar`:
  ```jsx
  <ComboBox
      label="Recurrente"
      size="small"
      placeholder="Todos"
      fullWidth={false}
      sx={{ width: { xs: '100%', sm: 180 } }}
      options={[{ value: '1', label: 'Recurrentes' }, { value: '0', label: 'Únicos' }]}
      value={recurrenteFilter}
      onChange={onRecurrenteFilterChange}
      testId="pendientes-select-filtro-recurrente"
  />
  ```
  (placeholder "Todos" = sin selección = valor `''`, replicando cómo Tipo/Estado representan "todos").
- Props nuevas en la firma + JSDoc: `recurrenteFilter`, `onRecurrenteFilterChange`.
- Indicador visual: agregar al render de la columna "Descripción" (o como columna/chip) un `Chip` pequeño "Recurrente" cuando `row.recurrente`, p.ej.:
  ```jsx
  { label: 'Descripción', key: 'descripcion',
    render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {row.descripcion}
            {row.recurrente && <Chip label="Recurrente" size="small" color="info" variant="outlined" data-testid="pendientes-chip-recurrente" />}
        </Box>
    ) }
  ```
- Risk: none.

### T-F10 · Tests E2E Pendientes + limpieza de GastosFijos
- [ ] Specs: specs/pendientes (escenarios), specs/gastos-fijos (REMOVED)
- Ruta: inline
- Archivos: `frontend/tests/modules/Pendientes/*.spec.ts`; eliminar specs de GastosFijos si existen bajo `frontend/tests/`.
- Cubrir con Playwright: crear pendiente con `recurrente=true` (toggle `pendientes-switch-recurrente`) y verificar chip `pendientes-chip-recurrente`; crear sin tocar el toggle → default (sin chip); filtrar por "Recurrentes"/"Únicos" (`pendientes-select-filtro-recurrente`) y verificar el subconjunto.
- Verificar que no queden rutas/nav/tests apuntando a `/gastos-fijos` (navegar a `/gastos-fijos` debe redirigir a Dashboard).
- Risk: item 6 (sin test no se detecta regresión del filtro) — cubierto por este task.

---

### Autovalidación frontend
- [x] Hooks encapsulan estado (filtro vive en `PendientesModule`/`useCrudList`; la vista solo recibe props)
- [x] Orquestador delgado (sin JSX de UI directa; delega en `PendientesListView` y dialogs)
- [x] `FilterToolbar` usado para el filtro recurrente (ComboBox en `extraFilters`, nunca control ad-hoc)
- [x] `id` + `data-testid` en toggle, filtro y chip indicador

## 3. Notas de diseño (frontend) para design.md

- **Toggle `recurrente`**: `Switch` MUI (no checkbox) por claridad de estado on/off en un formulario corto; el proyecto no tiene componente toggle de casa, se usa la primitiva MUI como el resto del dialog.
- **Filtro recurrente**: representado con `ComboBox` de 3 estados (`''` todos / `'1'` recurrentes / `'0'` únicos) dentro de `FilterToolbar.extraFilters`, consistente con los filtros Tipo y Estado ya existentes. Se descarta un `ToggleButtonGroup` para no introducir un patrón nuevo de filtro.
- **Indicador visual**: `Chip` "Recurrente" junto a la descripción, reutilizando el patrón de `Chip` ya usado para Tipo/Estado en la tabla.
- **Fuente de código real**: el árbol vivo es `frontend/src/`; `frontend/features/` (raíz) está vacío y `frontend/dist/` es build. Todas las tareas operan sobre `frontend/src/`.
