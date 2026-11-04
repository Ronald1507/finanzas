# Proyecto: Finanzas Personales

## Stack
- Backend: Laravel 11+ (PHP 8.2+), API REST
- Frontend: React 18+ + Vite (standalone)
- Base de datos: PostgreSQL 16 (todos los ambientes — dev, qa, prod)
- Mensajería: N/A

## Estándar de desarrollo
- Patrón backend: Controller → Service → Repository (CSR)
- Patrón frontend: Hooks → Tabs/Dialogs → Orquestador (react-vite-generator)
- Validaciones: en Controller, según laravel-validation-generator
- Permisos backend: en Service, según laravel-permissions
- Permisos frontend: en componentes UI (botones/acciones según rol)
- Tests: Pest, según laravel-testing

## Módulos
- GestionCuentas: administración de cuentas bancarias (CRUD, desactivación, saldo inicial por mes)
- Movimientos: ingresos/egresos por cuenta, mes y categoría; transferencias entre cuentas propias
- Pendientes: cuentas por pagar y por recibir, con conversión a movimiento real al concretarse
- SaldosDashboard: saldo temporal, saldo final y saldo potencial por cuenta y consolidado mensual
- CierreMensual: cierre atómico del mes con traspaso de saldos finales como iniciales del mes siguiente

## Rutas clave
- Backend: C:\Users\rpfu1\OneDrive\Escritorio\Ronald\Proyectos\Sistema_Finanzas\backend
- Frontend: C:\Users\rpfu1\OneDrive\Escritorio\Ronald\Proyectos\Sistema_Finanzas\frontend
- Specs (fuente de verdad): C:\Users\rpfu1\OneDrive\Escritorio\Ronald\Proyectos\Sistema_Finanzas\openspec\changes\finanzas-personales\

## Variables de entorno requeridas
- Backend `.env`: DB_CONNECTION (sqlite/mysql), APP_URL
- Frontend `.env`: VITE_API_URL (URL base de la API backend)

## Decisiones de arquitectura
- Monorepo: `backend/` (Laravel) + `frontend/` (React+Vite) en la raíz del proyecto.
- Fórmulas de saldos: temporal = inicial + ingresos − egresos; potencial = temporal + por recibir pendientes − por pagar pendientes; final = temporal congelado al cierre.
- Los pendientes afectan SOLO el saldo potencial; al concretarse generan el movimiento real vinculado.
- El cierre mensual es atómico y secuencial (orden cronológico); crea el mes siguiente con los saldos finales como iniciales y arrastra los pendientes no resueltos.
- Meses cerrados son inmutables (sin alta/edición de movimientos ni pendientes); reapertura solo del último mes cerrado si el siguiente está intacto.

## Referencias (SKILL_DIR = ~/.claude/skills/developeria)
- SKILL_DIR/references/agents/laravel-generator.md
- SKILL_DIR/references/agents/react-vite-frontend.md
- SKILL_DIR/references/react-vite-generator/skill.md
- SKILL_DIR/references/agents/laravel-validation-generator.md
- SKILL_DIR/references/agents/laravel-permissions.md
- SKILL_DIR/references/laravel-testing/skill.md
- SKILL_DIR/references/agents/interconector.md
- SKILL_DIR/references/agents/laravel-validator.md
