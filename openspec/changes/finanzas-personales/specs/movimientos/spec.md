## ADDED Requirements

### Requirement: Registrar ingreso o egreso
El sistema SHALL permitir registrar movimientos de tipo ingreso o egreso asociados a una cuenta activa y a un mes, con monto (> 0), fecha, descripción y categoría. El movimiento MUST registrarse en el mes correspondiente a su fecha, y ese mes MUST estar abierto (no cerrado).

#### Scenario: Registro de ingreso
- **WHEN** el usuario registra un ingreso de 1500000 con descripción "Sueldo" en la cuenta "Cuenta Corriente BCI" con fecha del mes en curso
- **THEN** el sistema guarda el movimiento y aumenta el saldo temporal de la cuenta en 1500000

#### Scenario: Registro de egreso
- **WHEN** el usuario registra un egreso de 350000 con descripción "Arriendo" en una cuenta activa con fecha del mes en curso
- **THEN** el sistema guarda el movimiento y disminuye el saldo temporal de la cuenta en 350000

#### Scenario: Movimiento en mes cerrado
- **WHEN** el usuario intenta registrar un movimiento con fecha de un mes ya cerrado
- **THEN** el sistema rechaza la operación e informa que el mes está cerrado

#### Scenario: Monto inválido
- **WHEN** el usuario intenta registrar un movimiento con monto cero o negativo
- **THEN** el sistema rechaza la operación con error de validación

### Requirement: Editar y eliminar movimientos
El sistema SHALL permitir editar y eliminar movimientos solo de meses abiertos. Toda edición o eliminación MUST recalcular los saldos afectados.

#### Scenario: Eliminación en mes abierto
- **WHEN** el usuario elimina un egreso de 100000 del mes en curso
- **THEN** el sistema elimina el movimiento y el saldo temporal de la cuenta aumenta en 100000

#### Scenario: Edición en mes cerrado
- **WHEN** el usuario intenta editar un movimiento de un mes cerrado
- **THEN** el sistema rechaza la operación e informa que el mes está cerrado

### Requirement: Consultar movimientos
El sistema SHALL permitir listar los movimientos filtrados por mes, cuenta, tipo (ingreso/egreso) y categoría, ordenados por fecha descendente y paginados.

#### Scenario: Listado por mes y cuenta
- **WHEN** el usuario consulta los movimientos de una cuenta en un mes determinado
- **THEN** el sistema devuelve solo los movimientos de esa cuenta y mes, ordenados por fecha descendente

### Requirement: Transferencia entre cuentas propias
El sistema SHALL permitir registrar transferencias entre dos cuentas activas del usuario, generando un egreso en la cuenta origen y un ingreso por el mismo monto en la cuenta destino, vinculados entre sí.

#### Scenario: Transferencia exitosa
- **WHEN** el usuario transfiere 200000 desde "Cuenta Corriente BCI" hacia "Cuenta Vista Falabella"
- **THEN** el sistema registra un egreso de 200000 en la cuenta origen y un ingreso de 200000 en la cuenta destino, y el saldo consolidado del mes no cambia
