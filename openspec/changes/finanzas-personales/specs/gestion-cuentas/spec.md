## ADDED Requirements

### Requirement: Crear cuenta bancaria
El sistema SHALL permitir crear cuentas bancarias con nombre, banco, tipo (corriente, vista, ahorro, crédito, efectivo) y saldo inicial para el mes en curso. El nombre de la cuenta MUST ser único entre las cuentas activas.

#### Scenario: Creación exitosa
- **WHEN** el usuario crea una cuenta con nombre "Cuenta Corriente BCI", tipo "corriente" y saldo inicial 500000
- **THEN** el sistema registra la cuenta como activa y la incluye en los cálculos de saldos del mes en curso con saldo inicial 500000

#### Scenario: Nombre duplicado
- **WHEN** el usuario intenta crear una cuenta con un nombre ya usado por otra cuenta activa
- **THEN** el sistema rechaza la operación e informa el error de validación

### Requirement: Editar cuenta bancaria
El sistema SHALL permitir editar nombre, banco y tipo de una cuenta existente. El saldo inicial del mes en curso MUST poder corregirse solo mientras el mes no esté cerrado.

#### Scenario: Edición de datos básicos
- **WHEN** el usuario edita el nombre de una cuenta existente
- **THEN** el sistema guarda el cambio y lo refleja en todas las vistas

#### Scenario: Corrección de saldo inicial en mes abierto
- **WHEN** el usuario corrige el saldo inicial de una cuenta en un mes no cerrado
- **THEN** el sistema recalcula los saldos temporal y potencial de esa cuenta y del consolidado

### Requirement: Desactivar cuenta bancaria
El sistema SHALL permitir desactivar una cuenta sin eliminar su historial. Una cuenta desactivada MUST quedar excluida de meses futuros pero conservar sus movimientos y saldos históricos.

#### Scenario: Desactivación
- **WHEN** el usuario desactiva una cuenta
- **THEN** la cuenta deja de aparecer en el mes siguiente al cierre, pero su historial sigue disponible en meses anteriores

#### Scenario: Desactivación con pendientes abiertos
- **WHEN** el usuario intenta desactivar una cuenta que tiene pendientes (por pagar o por recibir) sin resolver en el mes en curso
- **THEN** el sistema rechaza la operación e indica que primero debe resolver o reasignar los pendientes
