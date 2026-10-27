## ADDED Requirements

### Requirement: Registrar pendiente por pagar o por recibir
El sistema SHALL permitir registrar pendientes del mes de tipo "por pagar" o "por recibir", con monto (> 0), descripción, cuenta asociada (activa) y fecha estimada. Los pendientes MUST afectar solo el saldo potencial, nunca el saldo temporal.

#### Scenario: Registro de cuenta por pagar
- **WHEN** el usuario registra un pendiente "por pagar" de 80000 ("Cuota auto") asociado a una cuenta activa
- **THEN** el sistema guarda el pendiente en estado "pendiente" y el saldo potencial de la cuenta disminuye en 80000, sin cambiar el saldo temporal

#### Scenario: Registro de cuenta por recibir
- **WHEN** el usuario registra un pendiente "por recibir" de 250000 ("Devolución préstamo")
- **THEN** el sistema guarda el pendiente en estado "pendiente" y el saldo potencial de la cuenta aumenta en 250000, sin cambiar el saldo temporal

### Requirement: Concretar un pendiente
El sistema SHALL permitir marcar un pendiente como "realizado". Al concretarse, el sistema MUST generar automáticamente el movimiento real correspondiente (egreso si era por pagar, ingreso si era por recibir) en la cuenta asociada con la fecha de concreción, y vincular el movimiento al pendiente de origen.

#### Scenario: Concretar un por pagar
- **WHEN** el usuario marca como realizado un pendiente "por pagar" de 80000
- **THEN** el sistema crea un egreso de 80000 en la cuenta asociada, el pendiente queda en estado "realizado", el saldo temporal disminuye en 80000 y el saldo potencial no cambia

#### Scenario: Concretar un por recibir
- **WHEN** el usuario marca como realizado un pendiente "por recibir" de 250000
- **THEN** el sistema crea un ingreso de 250000 en la cuenta asociada, el pendiente queda en estado "realizado", el saldo temporal aumenta en 250000 y el saldo potencial no cambia

### Requirement: Editar, anular y consultar pendientes
El sistema SHALL permitir editar y anular pendientes en estado "pendiente" de meses abiertos, y listarlos filtrados por mes, tipo y estado. Un pendiente "realizado" MUST NOT poder editarse ni anularse directamente (se corrige a través de su movimiento generado).

#### Scenario: Anulación de pendiente
- **WHEN** el usuario anula un pendiente "por pagar" de 80000 en estado "pendiente"
- **THEN** el pendiente queda en estado "anulado" y el saldo potencial de la cuenta aumenta en 80000

#### Scenario: Intento de editar pendiente realizado
- **WHEN** el usuario intenta editar un pendiente en estado "realizado"
- **THEN** el sistema rechaza la operación e indica que debe corregir el movimiento generado
