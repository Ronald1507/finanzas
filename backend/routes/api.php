<?php

use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\CuentaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MesController;
use App\Http\Controllers\MovimientoController;
use App\Http\Controllers\PendienteController;
use App\Http\Controllers\PresupuestoController;
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
// Categorias
// ------------------------------------------------------------------
Route::get('/categorias', [CategoriaController::class, 'index'])
    ->name('categorias.listar');

Route::post('/categorias', [CategoriaController::class, 'store'])
    ->name('categorias.crear');

Route::put('/categorias/{id}', [CategoriaController::class, 'update'])
    ->name('categorias.actualizar');

Route::delete('/categorias/{id}', [CategoriaController::class, 'destroy'])
    ->name('categorias.eliminar');

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
// rutas estáticas ANTES de /{id}
Route::get('/movimientos/buscar', [MovimientoController::class, 'buscar'])
    ->name('movimientos.buscar-global');

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
// Presupuestos
// ------------------------------------------------------------------
Route::get('/presupuestos', [PresupuestoController::class, 'index'])
    ->name('presupuestos.listar');

Route::post('/presupuestos', [PresupuestoController::class, 'store'])
    ->name('presupuestos.crear');

Route::put('/presupuestos/{id}', [PresupuestoController::class, 'update'])
    ->name('presupuestos.actualizar');

Route::delete('/presupuestos/{id}', [PresupuestoController::class, 'destroy'])
    ->name('presupuestos.eliminar');

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
