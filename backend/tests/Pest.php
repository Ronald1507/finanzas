<?php

use Tests\TestCase;

uses(TestCase::class)->in('Unit', 'Feature');

// ---------------------------------------------------------------------------
// Helpers compartidos para todos los Unit tests (Mockery Mode)
// ---------------------------------------------------------------------------

/**
 * Permisos de administrador válidos para las comprobaciones de PermissionControl.
 * Replica la estructura que InjectDefaultPermissions inyecta en rutas API.
 */
function adminPermisos(): array
{
    return ['permisos' => ['finanzas' => ['finanzas-admin']]];
}

/**
 * Crea un mock parcial de App\Models\Cuenta.
 * Bloquea fresh() para evitar hits a la base de datos en tests unitarios.
 *
 * @param array<string, mixed> $attrs
 */
function mockCuenta(array $attrs): App\Models\Cuenta
{
    /** @var App\Models\Cuenta&\Mockery\MockInterface $mock */
    $mock = Mockery::mock(App\Models\Cuenta::class)->makePartial();
    $mock->forceFill($attrs);
    $mock->shouldReceive('fresh')->andReturnSelf()->byDefault();
    return $mock;
}

/**
 * Crea un mock parcial de App\Models\Mes.
 * Bloquea fresh() para evitar hits a la base de datos.
 *
 * @param array<string, mixed> $attrs
 */
function mockMes(array $attrs): App\Models\Mes
{
    /** @var App\Models\Mes&\Mockery\MockInterface $mock */
    $mock = Mockery::mock(App\Models\Mes::class)->makePartial();
    $mock->forceFill($attrs);
    $mock->shouldReceive('fresh')->andReturnSelf()->byDefault();
    return $mock;
}

/**
 * Crea un mock parcial de App\Models\CuentaMes.
 * Bloquea fresh() para evitar hits a la base de datos.
 *
 * @param array<string, mixed> $attrs
 */
function mockCuentaMes(array $attrs): App\Models\CuentaMes
{
    /** @var App\Models\CuentaMes&\Mockery\MockInterface $mock */
    $mock = Mockery::mock(App\Models\CuentaMes::class)->makePartial();
    $mock->forceFill($attrs);
    $mock->shouldReceive('fresh')->andReturnSelf()->byDefault();
    return $mock;
}

/**
 * Crea un mock parcial de App\Models\Movimiento.
 * Bloquea fresh() para evitar hits a la base de datos.
 *
 * @param array<string, mixed> $attrs
 */
function mockMovimiento(array $attrs): App\Models\Movimiento
{
    /** @var App\Models\Movimiento&\Mockery\MockInterface $mock */
    $mock = Mockery::mock(App\Models\Movimiento::class)->makePartial();
    $mock->forceFill($attrs);
    $mock->shouldReceive('fresh')->andReturnSelf()->byDefault();
    return $mock;
}

/**
 * Crea un mock parcial de App\Models\Pendiente.
 * Bloquea fresh() para evitar hits a la base de datos.
 *
 * @param array<string, mixed> $attrs
 */
function mockPendiente(array $attrs): App\Models\Pendiente
{
    /** @var App\Models\Pendiente&\Mockery\MockInterface $mock */
    $mock = Mockery::mock(App\Models\Pendiente::class)->makePartial();
    $mock->forceFill($attrs);
    $mock->shouldReceive('fresh')->andReturnSelf()->byDefault();
    return $mock;
}
