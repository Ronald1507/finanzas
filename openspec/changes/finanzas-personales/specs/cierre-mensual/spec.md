## ADDED Requirements

### Requirement: Cierre del mes
El sistema SHALL permitir cerrar explícitamente un mes abierto. Al cerrar, el sistema MUST: (1) congelar el saldo final de cada cuenta activa (igual a su saldo temporal en ese momento); (2) crear el mes siguiente con el saldo final de cada cuenta como su saldo inicial; (3) arrastrar al mes nuevo los pendientes en estado "pendiente"; (4) marcar el mes como cerrado, bloqueando la creación/edición de movimientos y pendientes en él. La operación MUST ser atómica.

#### Scenario: Cierre exitoso con traspaso de saldos
- **WHEN** el usuario cierra el mes de mayo con una cuenta cuyo saldo temporal es 1400000
- **THEN** mayo queda cerrado con saldo final 1400000 para esa cuenta, y junio queda creado con saldo inicial 1400000 para la misma cuenta

#### Scenario: Arrastre de pendientes
- **WHEN** el usuario cierra un mes que tiene un pendiente "por pagar" de 80000 en estado "pendiente"
- **THEN** el pendiente queda disponible en el mes siguiente y afecta el saldo potencial del mes nuevo

#### Scenario: Cierre de mes ya cerrado
- **WHEN** el usuario intenta cerrar un mes que ya está cerrado
- **THEN** el sistema rechaza la operación e informa el estado actual del mes

### Requirement: Secuencialidad de cierres
El sistema MUST exigir que los meses se cierren en orden cronológico: no se puede cerrar un mes si el anterior con datos sigue abierto, ni operar sobre un mes futuro sin que exista su mes inicial.

#### Scenario: Cierre fuera de orden
- **WHEN** el usuario intenta cerrar junio mientras mayo sigue abierto
- **THEN** el sistema rechaza la operación e indica que primero debe cerrar mayo

### Requirement: Reapertura de mes
El sistema SHALL permitir reabrir el último mes cerrado SOLO si el mes siguiente no tiene movimientos ni pendientes nuevos ni cierres posteriores. Al reabrir, el sistema MUST eliminar el saldo final congelado y revertir la inicialización del mes siguiente.

#### Scenario: Reapertura válida
- **WHEN** el usuario reabre mayo y junio no tiene movimientos ni pendientes nuevos
- **THEN** mayo vuelve a estado abierto, su saldo final se descongela y la inicialización de junio se revierte

#### Scenario: Reapertura bloqueada
- **WHEN** el usuario intenta reabrir mayo pero junio ya tiene movimientos registrados
- **THEN** el sistema rechaza la operación e informa el motivo
