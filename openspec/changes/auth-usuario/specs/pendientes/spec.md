## ADDED Requirements

### Requirement: Aislamiento de pendientes por usuario
Todas las operaciones sobre pendientes SHALL estar aisladas por el usuario autenticado. El `user_id` MUST derivarse del token.

#### Scenario: Listar pendientes propios
- **WHEN** el usuario autenticado llama `GET /api/pendientes`
- **THEN** el sistema retorna únicamente los pendientes cuyo `user_id` coincide con el usuario autenticado

#### Scenario: Crear pendiente asociado al usuario
- **WHEN** el usuario autenticado llama `POST /api/pendientes`
- **THEN** el sistema crea el pendiente con `user_id` igual al usuario autenticado

#### Scenario: No acceso a pendiente de otro usuario
- **WHEN** el usuario A intenta modificar, concretar o anular un pendiente de usuario B
- **THEN** el sistema retorna HTTP 404
