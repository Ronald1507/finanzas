## ADDED Requirements

### Requirement: Dashboard aislado por usuario
El dashboard SHALL retornar únicamente saldos y datos del usuario autenticado.

#### Scenario: Dashboard del usuario autenticado
- **WHEN** el usuario autenticado llama `GET /api/dashboard`
- **THEN** el sistema retorna saldos, cuentas y meses pertenecientes únicamente al `user_id` del token
