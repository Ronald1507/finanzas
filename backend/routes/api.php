<?php

use App\Http\Controllers\CuentaController;
use App\Http\Controllers\MovimientoController;
use App\Http\Controllers\PendienteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MesController;
use App\Http\Controllers\GastoFijoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Finanzas Personales
|--------------------------------------------------------------------------
| Prefijo global: /api (configurado en bootstrap/app.php)
| Sin autenticación/Sanctum — app de un solo usuario.
| Nombres de ruta en kebab-case.
*/

// ------------------------------------------------------------------
// GestionCuentas
// ------------------------------------------------------------------
Route::get('/cuentas', [CuentaController::class, 'index'])
    ->name('cuentas.listar-cuentas');

Route::get('/cuentas/{id}', [CuentaController::class, 'show'])
    ->name('cuentas.obtener-cuenta');

Route::post('/cuentas', [CuentaController::class, 'store'])
    ->name('cuentas.crear-cuenta');

Route::put('/cuentas/{id}', [CuentaController::class, 'update'])
    ->name('cuentas.actualizar-cuenta');

Route::put('/cuentas/{id}/saldo-inicial', [CuentaController::class, 'actualizarSaldoInicial'])
    ->name('cuentas.actualizar-saldo-inicial');

Route::post('/cuentas/{id}/desactivar', [CuentaController::class, 'desactivar'])
    ->name('cuentas.desactivar-cuenta');

// ------------------------------------------------------------------
// Movimientos
// ------------------------------------------------------------------
// transferencia debe ir ANTES de /{id} para que no interprete "transferencia" como un ID
Route::post('/movimientos/transferencia', [MovimientoController::class, 'transferencia'])
    ->name('movimientos.crear-transferencia');

Route::get('/movimientos', [MovimientoController::class, 'index'])
    ->name('movimientos.listar-movimientos');

Route::post('/movimientos', [MovimientoController::class, 'store'])
    ->name('movimientos.crear-movimiento');

Route::put('/movimientos/{id}', [MovimientoController::class, 'update'])
    ->name('movimientos.actualizar-movimiento');

Route::delete('/movimientos/{id}', [MovimientoController::class, 'destroy'])
    ->name('movimientos.eliminar-movimiento');

// ------------------------------------------------------------------
// Pendientes
// ------------------------------------------------------------------
Route::get('/pendientes', [PendienteController::class, 'index'])
    ->name('pendientes.listar-pendientes');

Route::post('/pendientes', [PendienteController::class, 'store'])
    ->name('pendientes.crear-pendiente');

Route::put('/pendientes/{id}', [PendienteController::class, 'update'])
    ->name('pendientes.actualizar-pendiente');

Route::post('/pendientes/{id}/concretar', [PendienteController::class, 'concretar'])
    ->name('pendientes.concretar-pendiente');

Route::post('/pendientes/{id}/anular', [PendienteController::class, 'anular'])
    ->name('pendientes.anular-pendiente');

// ------------------------------------------------------------------
// GastosFijos
// ------------------------------------------------------------------
// Las rutas con segmento literal (mes) deben ir ANTES de /{id} para no
// interpretar el literal como un ID.
Route::get('/gastos-fijos', [GastoFijoController::class, 'index'])
    ->name('gastos-fijos.listar');

Route::get('/gastos-fijos/mes/{mesId}', [GastoFijoController::class, 'indexPorMes'])
    ->name('gastos-fijos.listar-por-mes');

Route::post('/gastos-fijos', [GastoFijoController::class, 'store'])
    ->name('gastos-fijos.crear');

Route::put('/gastos-fijos/{id}', [GastoFijoController::class, 'update'])
    ->name('gastos-fijos.actualizar');

Route::post('/gastos-fijos/{id}/desactivar', [GastoFijoController::class, 'desactivar'])
    ->name('gastos-fijos.desactivar');

Route::post('/gastos-fijos/{id}/pagar', [GastoFijoController::class, 'pagar'])
    ->name('gastos-fijos.pagar');

Route::delete('/gastos-fijos/{id}/pago/{mesId}', [GastoFijoController::class, 'deshacerPago'])
    ->name('gastos-fijos.deshacer-pago');

// ------------------------------------------------------------------
// SaldosDashboard
// ------------------------------------------------------------------
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->name('dashboard.obtener-dashboard');

// ------------------------------------------------------------------
// CierreMensual
// ------------------------------------------------------------------
Route::get('/meses', [MesController::class, 'index'])
    ->name('meses.listar-meses');

Route::post('/meses/{id}/cerrar', [MesController::class, 'cerrar'])
    ->name('meses.cerrar-mes');

Route::post('/meses/{id}/reabrir', [MesController::class, 'reabrir'])
    ->name('meses.reabrir-mes');
