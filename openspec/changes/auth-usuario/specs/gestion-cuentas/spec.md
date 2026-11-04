## ADDED Requirements

### Requirement: Aislamiento de cuentas por usuario
Todas las operaciones sobre cuentas SHALL estar aisladas por el usuario autenticado. El sistema MUST derivar el `user_id` del token de Sanctum, nunca de parámetros del request.

#### Scenario: Listar cuentas propias
- **WHEN** el usuario autenticado llama `GET /api/cuentas`
- **THEN** el sistema retorna únicamente las cuentas cuyo `user_id` coincide con el usuario autenticado

#### Scenario: Crear cuenta asociada al usuario
- **WHEN** el usuario autenticado llama `POST /api/cuentas`
- **THEN** el sistema crea la cuenta con `user_id` igual al usuario autenticado

#### Scenario: No acceso a cuenta de otro usuario
- **WHEN** el usuario A intenta acceder o modificar una cuenta cuyo `user_id` es del usuario B
- **THEN** el sistema retorna HTTP 404 (no exponer existencia de recursos ajenos)
