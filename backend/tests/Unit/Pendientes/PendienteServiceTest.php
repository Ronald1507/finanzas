<?php

use App\Repositories\CuentaRepository;
use App\Repositories\MesRepository;
use App\Repositories\MovimientoRepository;
use App\Repositories\PendienteRepository;
use App\Services\PendienteService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;
use function Pest\Laravel\mock;

// ---------------------------------------------------------------------------
// Helpers locales
// ---------------------------------------------------------------------------

/**
 * Prepara todos los mocks secundarios que PendienteService siempre recibe.
 * Permite que cada test declare solo el mock que le interesa.
 */
function mockPendienteDeps(): void
{
    mock(MovimientoRepository::class);
    mock(MesRepository::class);
    mock(CuentaRepository::class);
}

// ---------------------------------------------------------------------------
// Campo recurrente — crear
// ---------------------------------------------------------------------------

describe('crear pendiente con campo recurrente', function () {
    test('can create pendiente with recurrente = true', function () {
        // Arrange
        $mesAbierto = mockMes(['id' => 1, 'estado' => 'abierto']);
        $cuenta     = mockCuenta(['id' => 1, 'activa' => true]);
        $creado     = mockPendiente([
            'id'          => 1,
            'cuenta_id'   => 1,
            'mes_id'      => 1,
            'tipo'        => 'por_pagar',
            'monto'       => 100.0,
            'descripcion' => 'Luz',
            'estado'      => 'pendiente',
            'recurrente'  => true,
        ]);

        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('create')
            ->once()
            ->withArgs(fn($d) => $d['recurrente'] === true)
            ->andReturn($creado);

        $mesRepo = mock(MesRepository::class);
        $mesRepo->shouldReceive('findMesAbierto')->andReturn($mesAbierto);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);

        mock(MovimientoRepository::class);

        // Act
        $result = resolve(PendienteService::class)->crear([
            'cuenta_id'      => 1,
            'tipo'           => 'por_pagar',
            'monto'          => 100.0,
            'descripcion'    => 'Luz',
            'fecha_estimada' => '2026-11-15',
            'recurrente'     => true,
        ], adminPermisos());

        // Assert
        expect($result)->toBeArray()
            ->and($result['recurrente'])->toBeTrue();
    });

    test('can create pendiente without recurrente defaults to false', function () {
        // Arrange
        $mesAbierto = mockMes(['id' => 1, 'estado' => 'abierto']);
        $cuenta     = mockCuenta(['id' => 1, 'activa' => true]);
        $creado     = mockPendiente([
            'id'         => 2,
            'cuenta_id'  => 1,
            'mes_id'     => 1,
            'recurrente' => false,
            'estado'     => 'pendiente',
        ]);

        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('create')
            ->once()
            ->withArgs(fn($d) => $d['recurrente'] === false)
            ->andReturn($creado);

        $mesRepo = mock(MesRepository::class);
        $mesRepo->shouldReceive('findMesAbierto')->andReturn($mesAbierto);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);

        mock(MovimientoRepository::class);

        // Act
        $result = resolve(PendienteService::class)->crear([
            'cuenta_id'      => 1,
            'tipo'           => 'por_pagar',
            'monto'          => 50.0,
            'descripcion'    => 'Único',
            'fecha_estimada' => '2026-11-20',
            // recurrente omitido — debe hacer default false
        ], adminPermisos());

        // Assert
        expect($result)->toBeArray()
            ->and($result['recurrente'])->toBeFalse();
    });

    test('can update recurrente field on a pending pendiente', function () {
        // Arrange
        $pendiente = mockPendiente([
            'id'         => 3,
            'cuenta_id'  => 1,
            'mes_id'     => 1,
            'estado'     => 'pendiente',
            'tipo'       => 'por_pagar',
            'monto'      => 80.0,
            'descripcion'=> 'Internet',
            'recurrente' => false,
        ]);
        // fresh() ya mockeado por mockPendiente; devolvemos attrs actualizados
        $pendiente->shouldReceive('fresh')->andReturn(
            mockPendiente([
                'id'         => 3,
                'cuenta_id'  => 1,
                'mes_id'     => 1,
                'estado'     => 'pendiente',
                'recurrente' => true,
            ])
        );

        $mesAbierto = mockMes(['id' => 1, 'estado' => 'abierto']);
        $cuenta     = mockCuenta(['id' => 1, 'activa' => true]);

        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('findPendiente')->with(3)->andReturn($pendiente);
        $pendienteRepo->shouldReceive('update')
            ->once()
            ->withArgs(fn($p, $d) => isset($d['recurrente']) && $d['recurrente'] === true)
            ->andReturn($pendiente);

        $mesRepo = mock(MesRepository::class);
        $mesRepo->shouldReceive('findMes')->with(1)->andReturn($mesAbierto);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);

        mock(MovimientoRepository::class);

        // Act
        $result = resolve(PendienteService::class)->editar(3, [
            'cuenta_id'  => 1,
            'recurrente' => true,
        ], adminPermisos());

        // Assert
        expect($result)->toBeArray()
            ->and($result['recurrente'])->toBeTrue();
    });
});

// ---------------------------------------------------------------------------
// Filtro recurrente — listarPorMes
// ---------------------------------------------------------------------------

describe('filtrar pendientes por recurrente', function () {
    test('can filter pendientes with recurrente = 1 (only recurring)', function () {
        // Arrange
        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('paginatePorMes')
            ->once()
            ->withArgs(fn($params) => isset($params['recurrente']) && $params['recurrente'] == 1)
            ->andReturn(['data' => [], 'meta' => ['total' => 0, 'page' => 1, 'per_page' => 100]]);

        mockPendienteDeps();

        // Act
        $result = resolve(PendienteService::class)->listarPorMes([
            'mes_id'     => 1,
            'recurrente' => 1,
        ]);

        // Assert
        expect($result)->toBeArray()->toHaveKey('data');
    });

    test('can filter pendientes with recurrente = 0 (only non-recurring)', function () {
        // Arrange
        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('paginatePorMes')
            ->once()
            ->withArgs(fn($params) => isset($params['recurrente']) && $params['recurrente'] == 0)
            ->andReturn(['data' => [], 'meta' => ['total' => 0, 'page' => 1, 'per_page' => 100]]);

        mockPendienteDeps();

        // Act
        $result = resolve(PendienteService::class)->listarPorMes([
            'mes_id'     => 1,
            'recurrente' => 0,
        ]);

        // Assert
        expect($result)->toBeArray()->toHaveKey('data');
    });

    test('can list all pendientes without recurrente filter', function () {
        // Arrange
        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('paginatePorMes')
            ->once()
            ->withArgs(fn($params) => !isset($params['recurrente']))
            ->andReturn(['data' => [], 'meta' => ['total' => 0, 'page' => 1, 'per_page' => 100]]);

        mockPendienteDeps();

        // Act
        $result = resolve(PendienteService::class)->listarPorMes([
            'mes_id' => 1,
        ]);

        // Assert
        expect($result)->toBeArray()->toHaveKey('data');
    });
});
