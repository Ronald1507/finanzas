<?php

use App\Repositories\CuentaMesRepository;
use App\Repositories\CuentaRepository;
use App\Repositories\MesRepository;
use App\Repositories\MovimientoRepository;
use App\Repositories\PendienteRepository;
use App\Services\MesService;
use App\Services\SaldoService;
use Illuminate\Database\Eloquent\Collection;
use function Pest\Laravel\mock;

// ---------------------------------------------------------------------------
// Helpers locales
// ---------------------------------------------------------------------------

function setupCierreSecondaryMocks(\Mockery\MockInterface $pendienteRepo): void
{
    $mesAbierto   = mockMes(['id' => 1, 'estado' => 'abierto', 'anio' => 2026, 'mes' => 11]);
    $mesSiguiente = mockMes(['id' => 2, 'estado' => 'abierto', 'anio' => 2026, 'mes' => 12]);

    $mesRepo = mock(MesRepository::class);
    $mesRepo->shouldReceive('findMesAbierto')->andReturn($mesAbierto);
    $mesRepo->shouldReceive('findMesPorAnioMes')->andReturn($mesSiguiente);
    $mesRepo->shouldReceive('update')->byDefault();
    $mesRepo->shouldReceive('create')->byDefault()->andReturn($mesSiguiente);

    $cuentaMesRepo = mock(CuentaMesRepository::class);
    $cuentaMesRepo->shouldReceive('bulkUpdateSaldoFinal')->byDefault();
    $cuentaMesRepo->shouldReceive('findPorCuentaYMes')->byDefault()->andReturn(null);
    $cuentaMesRepo->shouldReceive('bulkInsert')->byDefault();

    $cuentaRepo = mock(CuentaRepository::class);
    $cuentaRepo->shouldReceive('getCuentasActivas')->andReturn(new Collection([]));

    mock(MovimientoRepository::class);

    $saldoService = mock(SaldoService::class);
    $saldoService->shouldReceive('calcularSaldosFinalesCierre')->andReturn([]);
}

// ---------------------------------------------------------------------------
// Clonado de pendientes en cierre mensual
// ---------------------------------------------------------------------------

describe('clonado de pendientes en cierre mensual', function () {
    // Escenario 7: recurrente=true + estado=realizado → se clona
    test('clones recurring pendiente in estado realizado', function () {
        $pendiente = mockPendiente([
            'id'             => 10,
            'cuenta_id'      => 1,
            'mes_id'         => 1,
            'tipo'           => 'por_pagar',
            'monto'          => 200.0,
            'descripcion'    => 'Luz',
            'fecha_estimada' => '2026-11-15',
            'recurrente'     => true,
            'estado'         => 'realizado',
        ]);

        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('getClonablesPorCierre')
            ->once()
            ->with(1)
            ->andReturn(new Collection([$pendiente]));
        $pendienteRepo->shouldReceive('bulkInsert')
            ->once()
            ->withArgs(fn($rows) =>
                count($rows) === 1
                && $rows[0]['recurrente'] === true
                && $rows[0]['estado'] === 'pendiente'
                && $rows[0]['pendiente_origen_id'] === 10
            );

        setupCierreSecondaryMocks($pendienteRepo);

        resolve(MesService::class)->cerrar(1, adminPermisos());
    });

    // Escenario 8: recurrente=true + estado=anulado → se clona
    test('clones recurring pendiente in estado anulado', function () {
        $pendiente = mockPendiente([
            'id'             => 11,
            'cuenta_id'      => 1,
            'mes_id'         => 1,
            'tipo'           => 'por_recibir',
            'monto'          => 150.0,
            'descripcion'    => 'Internet',
            'fecha_estimada' => '2026-11-20',
            'recurrente'     => true,
            'estado'         => 'anulado',
        ]);

        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('getClonablesPorCierre')
            ->once()
            ->with(1)
            ->andReturn(new Collection([$pendiente]));
        $pendienteRepo->shouldReceive('bulkInsert')
            ->once()
            ->withArgs(fn($rows) =>
                count($rows) === 1
                && $rows[0]['estado'] === 'pendiente'
                && $rows[0]['pendiente_origen_id'] === 11
            );

        setupCierreSecondaryMocks($pendienteRepo);

        resolve(MesService::class)->cerrar(1, adminPermisos());
    });

    // Escenario 9: recurrente=true + estado=pendiente → se clona
    test('clones recurring pendiente in estado pendiente', function () {
        $pendiente = mockPendiente([
            'id'             => 12,
            'cuenta_id'      => 1,
            'mes_id'         => 1,
            'tipo'           => 'por_pagar',
            'monto'          => 80.0,
            'descripcion'    => 'Teléfono',
            'fecha_estimada' => '2026-11-10',
            'recurrente'     => true,
            'estado'         => 'pendiente',
        ]);

        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('getClonablesPorCierre')
            ->once()
            ->with(1)
            ->andReturn(new Collection([$pendiente]));
        $pendienteRepo->shouldReceive('bulkInsert')
            ->once()
            ->withArgs(fn($rows) =>
                count($rows) === 1
                && $rows[0]['estado'] === 'pendiente'
                && $rows[0]['pendiente_origen_id'] === 12
            );

        setupCierreSecondaryMocks($pendienteRepo);

        resolve(MesService::class)->cerrar(1, adminPermisos());
    });

    // Escenario 10: recurrente=false + estado=realizado → NO se clona
    test('does not clone non-recurring pendiente in estado realizado', function () {
        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('getClonablesPorCierre')
            ->once()
            ->with(1)
            ->andReturn(new Collection([]));
        $pendienteRepo->shouldReceive('bulkInsert')
            ->once()
            ->withArgs(fn($rows) => count($rows) === 0);

        setupCierreSecondaryMocks($pendienteRepo);

        resolve(MesService::class)->cerrar(1, adminPermisos());
    });

    // Escenario 11: recurrente=false + estado=anulado → NO se clona
    test('does not clone non-recurring pendiente in estado anulado', function () {
        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('getClonablesPorCierre')
            ->once()
            ->with(1)
            ->andReturn(new Collection([]));
        $pendienteRepo->shouldReceive('bulkInsert')
            ->once()
            ->withArgs(fn($rows) => count($rows) === 0);

        setupCierreSecondaryMocks($pendienteRepo);

        resolve(MesService::class)->cerrar(1, adminPermisos());
    });

    // Escenario 12: recurrente=false + estado=pendiente → sí se clona (comportamiento original)
    test('clones non-recurring pendiente in estado pendiente (original behavior)', function () {
        $pendiente = mockPendiente([
            'id'             => 20,
            'cuenta_id'      => 1,
            'mes_id'         => 1,
            'tipo'           => 'por_pagar',
            'monto'          => 60.0,
            'descripcion'    => 'Deuda puntual',
            'fecha_estimada' => '2026-11-25',
            'recurrente'     => false,
            'estado'         => 'pendiente',
        ]);

        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('getClonablesPorCierre')
            ->once()
            ->with(1)
            ->andReturn(new Collection([$pendiente]));
        $pendienteRepo->shouldReceive('bulkInsert')
            ->once()
            ->withArgs(fn($rows) =>
                count($rows) === 1
                && $rows[0]['recurrente'] === false
                && $rows[0]['estado'] === 'pendiente'
                && $rows[0]['pendiente_origen_id'] === 20
            );

        setupCierreSecondaryMocks($pendienteRepo);

        resolve(MesService::class)->cerrar(1, adminPermisos());
    });
});
