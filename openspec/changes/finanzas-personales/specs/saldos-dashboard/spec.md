## ADDED Requirements

### Requirement: Cálculo de saldos por cuenta
Para cada cuenta y mes, el sistema SHALL calcular: **saldo temporal** = saldo inicial + ingresos − egresos del mes; **saldo potencial** = saldo temporal + pendientes por recibir (estado "pendiente") − pendientes por pagar (estado "pendiente"); **saldo final** = saldo temporal congelado al momento del cierre del mes (solo existe en meses cerrados).

#### Scenario: Saldo temporal
- **WHEN** una cuenta tiene saldo inicial 500000, ingresos del mes por 1500000 y egresos por 600000
- **THEN** el saldo temporal de la cuenta es 1400000

#### Scenario: Saldo potencial
- **WHEN** la misma cuenta tiene además pendientes por recibir por 250000 y por pagar por 80000, ambos en estado "pendiente"
- **THEN** el saldo potencial de la cuenta es 1570000

#### Scenario: Saldo final en mes cerrado
- **WHEN** el usuario consulta un mes ya cerrado
- **THEN** el sistema muestra el saldo final congelado de cada cuenta, idéntico al saldo temporal que tenía al momento del cierre

### Requirement: Dashboard mensual consolidado
El sistema SHALL presentar un dashboard por mes con: totales consolidados (suma de todas las cuentas activas) de saldo inicial, ingresos, egresos, saldo temporal, por pagar, por recibir y saldo potencial; y el detalle de los mismos valores por cada cuenta. El usuario MUST poder navegar entre meses (anterior/siguiente).

#### Scenario: Consolidado del mes
- **WHEN** el usuario abre el dashboard de un mes con 3 cuentas activas
- **THEN** el sistema muestra los totales consolidados y una fila/tarjeta por cuenta con sus saldos individuales

#### Scenario: Navegación entre meses
- **WHEN** el usuario navega al mes anterior desde el dashboard
- **THEN** el sistema muestra los datos de ese mes; si está cerrado, indica visiblemente el estado "cerrado" y muestra los saldos finales

#### Scenario: Mes sin datos
- **WHEN** el usuario navega a un mes futuro sin inicializar
- **THEN** el sistema lo indica y ofrece la acción de cierre del mes anterior como vía para inicializarlo
