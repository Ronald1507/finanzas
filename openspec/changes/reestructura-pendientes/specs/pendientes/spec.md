## ADDED Requirements

### Requirement: Pendiente puede marcarse como recurrente
El sistema SHALL permitir crear y editar pendientes con el campo `recurrente` (boolean, default false). Un pendiente recurrente representa un gasto o cobro que se repite mes a mes (ej: luz, internet, teléfono). Un pendiente no recurrente representa una obligación puntual o variable.

#### Scenario: Crear pendiente recurrente
- **WHEN** el usuario crea un pendiente con `recurrente = true`
- **THEN** el sistema almacena el pendiente con `recurrente = true` y lo muestra con indicador visual de recurrente en la lista

#### Scenario: Crear pendiente no recurrente (comportamiento por defecto)
- **WHEN** el usuario crea un pendiente sin especificar `recurrente` o con `recurrente = false`
- **THEN** el sistema almacena el pendiente con `recurrente = false`

#### Scenario: Editar campo recurrente
- **WHEN** el usuario edita un pendiente en estado pendiente y modifica el campo `recurrente`
- **THEN** el sistema actualiza el valor; el nuevo comportamiento aplica desde el próximo cierre mensual

### Requirement: Filtrar pendientes por tipo recurrente
El sistema SHALL permitir filtrar la lista de pendientes por el campo `recurrente` (todos / solo recurrentes / solo únicos).

#### Scenario: Filtro recurrentes activo
- **WHEN** el usuario activa el filtro "recurrentes"
- **THEN** la lista muestra solo pendientes con `recurrente = true`

#### Scenario: Filtro únicos activo
- **WHEN** el usuario activa el filtro "únicos"
- **THEN** la lista muestra solo pendientes con `recurrente = false`

## MODIFIED Requirements

### Requirement: Clonado de pendientes en cierre mensual
El sistema SHALL clonar los pendientes al crear el mes siguiente durante el cierre, diferenciando por tipo:
- Pendientes `recurrente = true`: se clonan SIEMPRE al mes siguiente, independientemente de su estado (pendiente, realizado o anulado). El clon se crea siempre en estado `pendiente`.
- Pendientes `recurrente = false`: se clonan SOLO si están en estado `pendiente` (sin resolver). Comportamiento igual al actual.

#### Scenario: Cierre con pendiente recurrente resuelto
- **WHEN** existe un pendiente `recurrente = true` en estado `realizado` al momento del cierre
- **THEN** el sistema crea un clon de ese pendiente en el mes siguiente con estado `pendiente`

#### Scenario: Cierre con pendiente recurrente anulado
- **WHEN** existe un pendiente `recurrente = true` en estado `anulado` al momento del cierre
- **THEN** el sistema crea un clon de ese pendiente en el mes siguiente con estado `pendiente`

#### Scenario: Cierre con pendiente recurrente sin resolver
- **WHEN** existe un pendiente `recurrente = true` en estado `pendiente` al momento del cierre
- **THEN** el sistema crea un clon de ese pendiente en el mes siguiente con estado `pendiente`

#### Scenario: Cierre con pendiente no recurrente resuelto
- **WHEN** existe un pendiente `recurrente = false` en estado `realizado` o `anulado` al momento del cierre
- **THEN** el sistema NO crea un clon de ese pendiente

#### Scenario: Cierre con pendiente no recurrente sin resolver
- **WHEN** existe un pendiente `recurrente = false` en estado `pendiente` al momento del cierre
- **THEN** el sistema crea un clon de ese pendiente en el mes siguiente (comportamiento actual sin cambios)
