# Design — reestructura-pendientes

## Context

El sistema mantiene dos módulos con la misma naturaleza de dominio:

- **Pendientes** (`pendientes`): cuentas por pagar / por recibir de un mes. Al concretarse generan un movimiento real vinculado (`movimientos.pendiente_id`). Afectan solo el saldo potencial. En el cierre mensual se clonan al mes siguiente los que están en estado `pendiente` (identificados como clones por `pendiente_origen_id`).
- **GastosFijos** (`gastos_fijos`): catálogo de egresos recurrentes. Cada mes el usuario registra el pago, que genera un egreso vinculado (`movimientos.gasto_fijo_id`). No tienen ciclo de estado ni clonado por cierre; la "recurrencia" se resuelve mostrando siempre el catálogo activo con su estado de pago del mes.

Ambos representan "algo que va a ocurrir y al concretarse genera un movimiento". La propuesta los unifica en **Pendientes** con un flag `recurrente`, eliminando por completo GastosFijos.

Estado actual relevante (verificado en código):

- `pendientes`: `cuenta_id` NOT NULL (FK), `mes_id` NOT NULL (FK), `tipo` (por_pagar|por_recibir), `monto` decimal NOT NULL, `descripcion` string NOT NULL, `fecha_estimada` date NOT NULL, `estado` (pendiente|realizado|anulado), `movimiento_id` nullable, `pendiente_origen_id` nullable (FK autorreferencial).
- `gastos_fijos`: `nombre`, `categoria` (default 'Gastos Fijos'), `cuenta_id` **nullable**, `monto_estimado` **nullable**, `activo` boolean. Sin `tipo`, sin `fecha_estimada`.
- `movimientos.gasto_fijo_id` nullable con FK a `gastos_fijos` (nullOnDelete).
- `MesService::cerrar` paso 5 clona solo `getPorMes($mesId, null, 'pendiente')`.
- Reapertura usa `pendiente_origen_id` para distinguir clones (`countPendientesNuevosPorMes`, `deleteByOrigenMesId`), que seguirá funcionando sin cambios para los recurrentes porque también se clonan con `pendiente_origen_id`.

## Goals / Non-Goals

### Goals
- Añadir `recurrente` (boolean, default false) a `pendientes`.
- Clonado diferenciado en el cierre: `recurrente=true` se clona SIEMPRE (cualquier estado, el clon nace `pendiente`); `recurrente=false` solo si está `pendiente` (comportamiento actual).
- Filtro por tipo recurrente en el listado.
- Eliminar la tabla `gastos_fijos`, la columna `movimientos.gasto_fijo_id` y todo el módulo GastosFijos (Model, Repository, Service, Controller, rutas, relación en Movimiento).
- Migrar datos existentes de `gastos_fijos` a `pendientes` con `recurrente=true` en el mes abierto actual, preservando los movimientos históricos vía `pendiente_id`.

### Non-Goals
- No se cambia la lógica de concreción/anulación/edición de pendientes (más allá de aceptar `recurrente`).
- No se toca el frontend en esta tarea (plan backend).
- No se agrega endpoint de "pago recurrente" equivalente a `/gastos-fijos/{id}/pagar`: el flujo recurrente usa el ciclo normal de pendientes (crear → concretar).

## Decisions

### D1 — Migración de esquema en tres pasos separados

Tres migraciones nuevas, en orden cronológico posterior a las existentes:

1. `add_recurrente_to_pendientes` — agrega `recurrente` boolean default false + índice.
2. `migrate_gastos_fijos_to_pendientes` — **data migration** (ver Migration Plan). Debe ejecutarse ANTES de eliminar la tabla y la columna.
3. `drop_gastos_fijos` — elimina `movimientos.gasto_fijo_id` (y su FK) y hace `dropIfExists('gastos_fijos')`.

**Alternativa considerada:** una sola migración monolítica. Descartada: mezclar DDL y data migration en una sola clase dificulta el rollback y el razonamiento sobre el orden FK (hay que relinkear movimientos antes de borrar la FK). Tres archivos dejan el orden explícito.

### D2 — Mapeo de datos gastos_fijos → pendientes

`pendientes` exige campos que `gastos_fijos` no tiene o tiene nullables. Mapeo:

| pendientes            | origen gastos_fijos                      |
|-----------------------|------------------------------------------|
| `cuenta_id` (NOT NULL)| `gf.cuenta_id` si no es null; si es null → **primera cuenta activa** (fallback) |
| `mes_id` (NOT NULL)   | id del mes abierto actual                |
| `tipo`                | `'por_pagar'` (un gasto fijo siempre es egreso) |
| `monto` (NOT NULL)    | `gf.monto_estimado` si no es null; si null → `0` |
| `descripcion`         | `gf.nombre`                              |
| `fecha_estimada`      | último día del mes abierto (o `now()` como fecha del mes) |
| `estado`              | `'pendiente'`                            |
| `recurrente`          | `true`                                   |
| `movimiento_id`       | null                                     |
| `pendiente_origen_id` | null                                     |

Solo se migran gastos fijos **activos** (`activo=true`); los inactivos son catálogo histórico sin recurrencia futura y sus movimientos ya existen.

**Alternativa considerada:** migrar también inactivos. Descartada: un gasto fijo inactivo no debe reaparecer como pendiente recurrente vivo; solo interesa preservar sus movimientos históricos, lo cual se resuelve con el relink (ver D3) o dejando `movimientos.gasto_fijo_id` huérfano al borrar la columna.

**Riesgo de FK sin cuenta activa:** si no existe ninguna cuenta activa, el fallback de `cuenta_id` falla. Ver Risks R3.

### D3 — Relink de movimientos históricos

El spec dice: "Los movimientos vinculados conservan su referencia via `pendiente_id`". Interpretación: para cada gasto fijo migrado, los movimientos que tenían `gasto_fijo_id = gf.id` y aún no tienen `pendiente_id` se actualizan a `pendiente_id = <id del pendiente recurrente migrado>`.

Se hace dentro de la misma data migration (paso 2), después de insertar los pendientes y antes de que el paso 3 elimine la columna `gasto_fijo_id`. Se mantiene un mapa `gf.id → pendiente.id` durante la migración.

**Nota de consistencia:** un pendiente recurrente migrado representa el "próximo" pendiente del mes abierto, pero recibe el `pendiente_id` de movimientos de meses anteriores. Es una relación de trazabilidad (origen conceptual), no de concreción (`movimiento_id` del pendiente queda null). Es aceptable: `pendiente_id` en movimiento ya es solo referencia de origen.

### D4 — Lógica de clonado diferenciada en MesService::cerrar

Reemplazar el paso 5. En vez de una sola query `getPorMes($mesId, null, 'pendiente')`, obtener el conjunto a clonar como la unión de:

- recurrentes (`recurrente=true`), en **cualquier** estado;
- no recurrentes (`recurrente=false`) en estado `pendiente`.

Para no meter lógica de negocio en el Repository, se añade un método de query dedicado `getClonablesPorCierre(int $mesId): Collection` que retorna exactamente esas filas (es una query, no lógica de negocio: es un criterio de selección SQL). El Service arma los `rows` del bulkInsert sobre esa colección y cada clon nace `estado='pendiente'`, `recurrente` heredado del origen, `pendiente_origen_id` = id del origen.

**Alternativa considerada:** traer todos los pendientes del mes y filtrar en PHP dentro del Service. Descartada: filtrar es un criterio expresable en SQL; CSR exige que la selección viva en el Repository. El Service solo transforma filas a `rows`.

### D5 — Campo `recurrente` en Model / Repository / Service / Controller

- `Pendiente`: agregar `recurrente` a `$fillable` y cast `'boolean'`.
- `PendienteRepository::paginatePorMes` y `getPorMes`: aceptar filtro `recurrente` (nullable) vía `when`.
- `PendienteService::crear`: setear `recurrente` desde `$datos['recurrente'] ?? false`.
- `PendienteService::editar`: permitir actualizar `recurrente` (`$datos['recurrente'] ?? $pendiente->recurrente`).
- `PendienteController::index`: validar `recurrente` nullable boolean y pasarlo. `store`/`update`: validar `recurrente` nullable boolean.

### D6 — Eliminación del módulo GastosFijos

Borrar los archivos: `GastoFijo` (Model), `GastoFijoRepository`, `GastoFijoService`, `GastoFijoController`, la migración `create_gastos_fijos_table` **NO se borra** (es historia de migraciones ya aplicada; el drop se hace en una migración nueva), quitar la relación `gastoFijo()` y `gasto_fijo_id` de `Movimiento`, y remover las rutas `gastos-fijos.*`.

**MovimientoService::crear** acepta hoy `gasto_fijo_id`. Hay que verificar que al eliminar la columna no quede referencia en `MovimientoService`/`MovimientoRepository` (fuera de los archivos listados — ver Risk R2). El plan incluye una tarea de grep para `gasto_fijo` en todo `backend/app`.

## Risks / Trade-offs

- **R1 — SQLite y drop de FK/columna.** SQLite reconstruye la tabla al hacer `dropColumn`/`dropForeign`. Laravel lo maneja con `doctrine/dbal` o el schema builder nativo de L11. Mitigación: usar `Schema::table` con `dropForeign(['gasto_fijo_id'])` antes de `dropColumn`, y probar `migrate:fresh` + `migrate` sobre SQLite antes de cerrar. En producción (MySQL) el drop es directo.
- **R2 — Referencias residuales a `gasto_fijo_id`.** `MovimientoService::crear`/`MovimientoRepository` o tests pueden mencionar `gasto_fijo_id`. Si queda en `$fillable` o en un insert, romperá al eliminar la columna. Mitigación: tarea de grep obligatoria sobre `backend/app` y `backend/database`/`backend/tests`.
- **R3 — Data migration sin cuenta activa o sin mes abierto.** Si no hay mes abierto o no hay cuenta activa, el mapeo de `cuenta_id`/`mes_id` falla. Mitigación: la migración detecta la ausencia y, si no hay gastos fijos activos, no hace nada (no-op); si hay gastos fijos activos pero falta mes abierto o cuenta, aborta con excepción clara. Es un escenario de datos de borde; en el entorno real siempre hay un mes abierto.
- **R4 — Pérdida de `monto_estimado`/`categoria`.** `pendientes` no tiene `categoria`; se descarta (los pendientes usan `descripcion`). `monto_estimado` null se mapea a `monto=0`, que el usuario ajustará al concretar. Trade-off aceptado por el spec (unificación).
- **R5 — BREAKING para el frontend.** Desaparecen todos los endpoints `/api/gastos-fijos/*`. El frontend que los consuma romperá hasta que se adapte (fuera de esta tarea). Declarado como BREAKING en la propuesta.
- **R6 — Reversibilidad.** La data migration no es trivialmente reversible (el `down` no puede reconstruir fielmente el catálogo gastos_fijos). Mitigación: `down()` de la migración de datos se deja como no-op documentado; el rollback real es restaurar backup. Aceptable para app de un solo usuario con SQLite.

## Migration Plan

Orden de ejecución (las tres migraciones nuevas corren después de las `2025_01_01_*` existentes):

1. **`add_recurrente_to_pendientes`**
   - `up`: `ALTER TABLE pendientes ADD recurrente boolean default false`; índice `recurrente` (o compuesto `['recurrente','estado']` para el clonado).
   - `down`: `dropColumn('recurrente')`.

2. **`migrate_gastos_fijos_to_pendientes`** (data migration — usa el query builder, no Eloquent, para no depender de modelos que luego se borran)
   - Si `gastos_fijos` no existe o no hay filas activas → no-op (`return`).
   - Resolver mes abierto (`SELECT id FROM meses WHERE estado='abierto' LIMIT 1`). Si no existe y hay gastos fijos activos → abortar con excepción.
   - Resolver cuenta activa fallback (`SELECT id FROM cuentas WHERE activa=true ORDER BY id LIMIT 1`).
   - Por cada gasto fijo activo: insertar en `pendientes` según mapeo D2; guardar `gf.id → nuevo pendiente.id`.
   - Relink: por cada par del mapa, `UPDATE movimientos SET pendiente_id = <pid> WHERE gasto_fijo_id = <gfid> AND pendiente_id IS NULL`.
   - `down`: no-op documentado (ver R6).

3. **`drop_gastos_fijos`**
   - `up`: en `movimientos` → `dropForeign(['gasto_fijo_id'])` luego `dropColumn('gasto_fijo_id')`; después `Schema::dropIfExists('gastos_fijos')`.
   - `down`: recrear `gastos_fijos` (estructura original) y re-agregar `movimientos.gasto_fijo_id` con su FK, para permitir `migrate:rollback` estructural (sin datos).

Verificación post-migración: `php artisan migrate:fresh --seed` (o sin seed) sobre SQLite debe correr limpio; comprobar que `pendientes.recurrente` existe, que `gastos_fijos` y `movimientos.gasto_fijo_id` ya no existen.

## Endpoints

### Eliminados (BREAKING)
- `GET /api/gastos-fijos` (`gastos-fijos.listar`)
- `GET /api/gastos-fijos/mes/{mesId}` (`gastos-fijos.listar-por-mes`)
- `POST /api/gastos-fijos` (`gastos-fijos.crear`)
- `PUT /api/gastos-fijos/{id}` (`gastos-fijos.actualizar`)
- `POST /api/gastos-fijos/{id}/desactivar` (`gastos-fijos.desactivar`)
- `POST /api/gastos-fijos/{id}/pagar` (`gastos-fijos.pagar`)
- `DELETE /api/gastos-fijos/{id}/pago/{mesId}` (`gastos-fijos.deshacer-pago`)

### Modificados
- `GET /api/pendientes` — acepta filtro adicional `recurrente` (nullable boolean).
- `POST /api/pendientes` — acepta campo `recurrente` (nullable boolean, default false).
- `PUT /api/pendientes/{id}` — acepta campo `recurrente` (nullable boolean).

### Sin cambios
- `POST /api/pendientes/{id}/concretar`, `POST /api/pendientes/{id}/anular`.
