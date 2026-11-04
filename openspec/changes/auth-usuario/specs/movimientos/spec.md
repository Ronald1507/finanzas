## ADDED Requirements

### Requirement: Aislamiento de movimientos por usuario
Todas las operaciones sobre movimientos SHALL estar aisladas por el usuario autenticado. El `user_id` MUST derivarse del token, nunca de parámetros del request.

#### Scenario: Listar movimientos propios
- **WHEN** el usuario autenticado llama `GET /api/movimientos`
- **THEN** el sistema retorna únicamente los movimientos cuyo `user_id` coincide con el usuario autenticado

#### Scenario: Crear movimiento asociado al usuario
- **WHEN** el usuario autenticado llama `POST /api/movimientos`
- **THEN** el sistema crea el movimiento con `user_id` igual al usuario autenticado

#### Scenario: No acceso a movimiento de otro usuario
- **WHEN** el usuario A intenta editar o eliminar un movimiento de usuario B
- **THEN** el sistema retorna HTTP 404

#### Scenario: Transferencia entre cuentas propias
- **WHEN** el usuario autenticado llama `POST /api/movimientos/transferencia`
- **THEN** ambas cuentas origen y destino DEBEN pertenecer al mismo usuario autenticado; si alguna pertenece a otro usuario, retornar HTTP 404
