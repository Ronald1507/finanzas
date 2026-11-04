## ADDED Requirements

### Requirement: Aislamiento de gastos fijos por usuario
Todas las operaciones sobre gastos fijos SHALL estar aisladas por el usuario autenticado. El `user_id` MUST derivarse del token.

#### Scenario: Listar gastos fijos propios
- **WHEN** el usuario autenticado llama `GET /api/gastos-fijos`
- **THEN** el sistema retorna únicamente los gastos fijos cuyo `user_id` coincide con el usuario autenticado

#### Scenario: Crear gasto fijo asociado al usuario
- **WHEN** el usuario autenticado llama `POST /api/gastos-fijos`
- **THEN** el sistema crea el gasto fijo con `user_id` igual al usuario autenticado

#### Scenario: No acceso a gasto fijo de otro usuario
- **WHEN** el usuario A intenta editar, desactivar, pagar o deshacer pago de un gasto fijo de usuario B
- **THEN** el sistema retorna HTTP 404
