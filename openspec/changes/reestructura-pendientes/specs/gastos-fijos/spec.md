## REMOVED Requirements

### Requirement: Gestión de gastos fijos
**Reason**: El módulo GastosFijos es redundante con Pendientes. Los gastos fijos son pendientes recurrentes — la distinción es solo de comportamiento en el cierre, no de entidad separada. Unificar en Pendientes con `recurrente=true` elimina la ambigüedad para el usuario.
**Migration**: Los datos existentes en `gastos_fijos` se migran automáticamente como pendientes con `recurrente=true` en el mes abierto actual. Los movimientos vinculados conservan su referencia via `pendiente_id`. La columna `gasto_fijo_id` en `movimientos` se elimina.

### Requirement: Registrar pago de gasto fijo
**Reason**: Reemplazado por el flujo de concretar pendiente recurrente.
**Migration**: Usar el endpoint `POST /pendientes/{id}/concretar` para registrar el pago de un pendiente recurrente.

### Requirement: Deshacer pago de gasto fijo
**Reason**: Reemplazado por la lógica existente de eliminación de movimiento vinculado.
**Migration**: Eliminar el movimiento vinculado al pendiente para revertir el pago.

### Requirement: Listar gastos fijos por mes
**Reason**: Reemplazado por el filtro de pendientes recurrentes por mes.
**Migration**: Usar `GET /pendientes?mes_id=X&recurrente=1` para obtener los pendientes recurrentes del mes.
