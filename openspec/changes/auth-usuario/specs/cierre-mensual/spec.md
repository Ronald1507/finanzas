## ADDED Requirements

### Requirement: Cierre mensual aislado por usuario
Todas las operaciones de cierre y reapertura de meses SHALL operar exclusivamente sobre los meses del usuario autenticado.

#### Scenario: Listar meses propios
- **WHEN** el usuario autenticado llama `GET /api/meses`
- **THEN** el sistema retorna únicamente los meses cuyo `user_id` coincide con el usuario autenticado

#### Scenario: Cierre del mes propio
- **WHEN** el usuario autenticado llama `POST /api/meses/{id}/cerrar`
- **THEN** el sistema verifica que el mes pertenece al usuario autenticado antes de cerrar; si pertenece a otro, retornar HTTP 404

#### Scenario: Reapertura del mes propio
- **WHEN** el usuario autenticado llama `POST /api/meses/{id}/reabrir`
- **THEN** el sistema verifica que el mes pertenece al usuario autenticado antes de reabrir; si pertenece a otro, retornar HTTP 404
