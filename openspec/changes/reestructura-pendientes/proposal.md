## Why

El sistema tiene dos módulos separados (GastosFijos y Pendientes) que comparten la misma naturaleza: pagos que quedan pendientes hasta concretarse. Esta dualidad genera confusión al usuario sobre dónde cargar cada cosa, especialmente en casos borde como la tarjeta de crédito. La solución es unificar ambos en Pendientes, diferenciando recurrentes de únicos mediante un campo `recurrente`.

## What Changes

- **BREAKING** Eliminar tabla `gastos_fijos` y módulo GastosFijos completo (backend + frontend)
- **BREAKING** Eliminar columna `gasto_fijo_id` de la tabla `movimientos`
- Agregar columna `recurrente` (boolean, default false) a la tabla `pendientes`
- Cambiar la lógica de cierre mensual: los pendientes `recurrente=true` siempre se clonan al mes siguiente (resueltos o no); los `recurrente=false` solo se clonan si están sin resolver (comportamiento actual)
- Migrar datos existentes de `gastos_fijos` como pendientes recurrentes en el mes abierto actual
- Actualizar la UI de Pendientes para soportar filtro por `recurrente` y el nuevo campo en el formulario

## Capabilities

### New Capabilities
- ninguna

### Modified Capabilities
- `pendientes`: agrega campo `recurrente` que controla el comportamiento de clonado en cierre mensual
- `cierre-mensual`: lógica de clonado de pendientes diferenciada por tipo (recurrente vs único)

## Impact

- **Backend**: nueva migración (add `recurrente` to `pendientes`), migración de datos, eliminar `GastoFijoRepository`, `GastoFijoService`, `GastoFijoController`; actualizar `PendienteRepository`, `PendienteService`, `MesService` (cierre/reapertura); remover rutas `gastos-fijos.*`; actualizar `MovimientoRepository` (remover `gasto_fijo_id`)
- **Frontend**: eliminar `features/gastos-fijos/`; actualizar `PendienteDialog` (agregar toggle recurrente), `PendientesListView` (filtro recurrente), `routes.jsx`, `AppLayout.jsx`, `apisUrl.js`
- **Base de datos**: los datos de `gastos_fijos` se migran a `pendientes` en el mes abierto; los movimientos generados por gastos fijos conservan el vínculo via `pendiente_id`
- **Dependencias**: sin cambios
