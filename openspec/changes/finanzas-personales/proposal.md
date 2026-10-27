# Proposal — finanzas-personales

## Why

El usuario administra sus finanzas personales repartidas en varias cuentas bancarias y hoy no tiene una herramienta que consolide ingresos, egresos y compromisos pendientes, ni que le permita arrancar cada mes con los saldos finales del mes anterior. Se necesita una aplicación que ordene esa información y entregue saldos confiables (reales y proyectados) por mes.

## What Changes

- Se crea un proyecto nuevo (monorepo): API backend Laravel CSR (`backend/`) + frontend React + Vite standalone (`frontend/`).
- Gestión de múltiples cuentas bancarias (crear, editar, desactivar) con saldo inicial por mes.
- Registro de movimientos por cuenta y por mes: ingresos y egresos, con descripción, categoría, monto y fecha.
- Registro de pendientes del mes: cuentas **por pagar** y **por recibir**, con estado (pendiente/realizado); al marcarse como realizado se convierten en movimiento real.
- Cálculo automático de saldos por cuenta y consolidado del mes:
  - **Saldo temporal** (actual): saldo inicial + ingresos − egresos a la fecha.
  - **Saldo final**: saldo de cierre del mes (igual al temporal al momento del cierre).
  - **Saldo potencial**: saldo temporal + por recibir pendientes − por pagar pendientes.
- **Cierre mensual**: acción explícita que congela los saldos finales del mes y los traslada como saldos iniciales del mes siguiente; los pendientes no resueltos se arrastran al mes nuevo.
- Dashboard mensual con totales por cuenta y consolidado, navegable por mes.

## Capabilities

### New Capabilities
- `gestion-cuentas`: administración de cuentas bancarias del usuario (CRUD, activación/desactivación, saldo inicial por mes).
- `movimientos`: registro y consulta de ingresos y egresos por cuenta, mes y categoría.
- `pendientes`: gestión de cuentas por pagar y por recibir del mes, con conversión a movimiento real al concretarse.
- `saldos-dashboard`: cálculo y visualización de saldo temporal, saldo final y saldo potencial por cuenta y consolidado, por mes.
- `cierre-mensual`: cierre del mes con traspaso de saldos finales como saldos iniciales del mes siguiente y arrastre de pendientes no resueltos.

### Modified Capabilities

_(ninguna — proyecto nuevo)_

## Impact

- Proyecto nuevo: no hay código existente afectado.
- `backend/`: aplicación Laravel (API REST, estándar CSR) con base de datos relacional (MySQL/SQLite).
- `frontend/`: aplicación React + Vite que consume la API.
- Dependencias nuevas: Laravel 11+, React 18+, Vite, axios.
