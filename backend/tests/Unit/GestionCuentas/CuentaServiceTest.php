<?php

use App\Repositories\CuentaMesRepository;
use App\Repositories\CuentaRepository;
use App\Repositories\MesRepository;
use App\Repositories\PendienteRepository;
use App\Services\CuentaService;
use App\Services\MesService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;
use function Pest\Laravel\mock;

// ---------------------------------------------------------------------------
// listarCuentas
// ---------------------------------------------------------------------------

describe('listarCuentas', function () {
    test('can list all accounts without filter', function () {
        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('getCuentas')->with(null)->andReturn(new Collection([]));

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        $result = resolve(CuentaService::class)->listarCuentas();

        expect($result)->toBeArray();
    });

    test('can list only active accounts when filter is true', function () {
        $cuenta = mockCuenta(['id' => 1, 'nombre' => 'Banco', 'activa' => true, 'tipo' => 'corriente', 'banco' => null]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('getCuentas')->with(true)->andReturn(new Collection([$cuenta]));

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        $result = resolve(CuentaService::class)->listarCuentas(true);

        expect($result)->toBeArray()->toHaveCount(1);
    });
});

// ---------------------------------------------------------------------------
// obtenerCuenta
// ---------------------------------------------------------------------------

describe('obtenerCuenta', function () {
    test('can get account by id', function () {
        $cuenta = mockCuenta(['id' => 1, 'nombre' => 'BancoTest', 'activa' => true, 'tipo' => 'corriente', 'banco' => null]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        $result = resolve(CuentaService::class)->obtenerCuenta(1);

        expect($result)->toBeArray()
            ->and($result['id'])->toBe(1)
            ->and($result['nombre'])->toBe('BancoTest');
    });

    test('throws 404 when account does not exist', function () {
        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(999)->andReturn(null);

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        expect(fn () => resolve(CuentaService::class)->obtenerCuenta(999))
            ->toThrow(ValidationException::class);
    });
});

// ---------------------------------------------------------------------------
// crear
// ---------------------------------------------------------------------------

describe('crear', function () {
    test('can create account successfully in open month', function () {
        $mesAbierto = mockMes(['id' => 1, 'estado' => 'abierto']);
        $cuentaCreada = mockCuenta(['id' => 1, 'nombre' => 'NuevoBanco', 'activa' => true, 'tipo' => 'corriente', 'banco' => null]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuentaActivaPorNombre')->with('NuevoBanco')->andReturn(null);
        $cuentaRepo->shouldReceive('create')->once()->andReturn($cuentaCreada);

        $cuentaMesRepo = mock(CuentaMesRepository::class);
        $cuentaMesRepo->shouldReceive('create')->once()->andReturn(
            mockCuentaMes(['id' => 1, 'cuenta_id' => 1, 'mes_id' => 1, 'saldo_inicial' => '1000.00', 'saldo_final' => null])
        );

        $mesRepo = mock(MesRepository::class);
        $mesRepo->shouldReceive('findMesAbierto')->andReturn($mesAbierto);

        mock(PendienteRepository::class);

        $mesService = mock(MesService::class);
        $mesService->shouldReceive('bootstrapPrimerMes')->once();

        $result = resolve(CuentaService::class)->crear(
            ['nombre' => 'NuevoBanco', 'tipo' => 'corriente', 'saldo_inicial' => 1000.0],
            adminPermisos()
        );

        expect($result)->toBeArray()
            ->and($result['nombre'])->toBe('NuevoBanco');
    });

    test('throws 422 when account name already exists among active accounts', function () {
        $duplicada = mockCuenta(['id' => 2, 'nombre' => 'Duplicado', 'activa' => true]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuentaActivaPorNombre')->with('Duplicado')->andReturn($duplicada);

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);

        $mesService = mock(MesService::class);
        $mesService->shouldReceive('bootstrapPrimerMes')->byDefault();

        expect(fn () => resolve(CuentaService::class)->crear(
            ['nombre' => 'Duplicado', 'tipo' => 'corriente', 'saldo_inicial' => 0.0],
            adminPermisos()
        ))->toThrow(ValidationException::class);
    });

    test('calls bootstrapPrimerMes before creating first account', function () {
        $mesAbierto = mockMes(['id' => 1, 'estado' => 'abierto']);
        $cuentaCreada = mockCuenta(['id' => 1, 'nombre' => 'PrimerBanco', 'activa' => true, 'tipo' => 'corriente', 'banco' => null]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuentaActivaPorNombre')->andReturn(null);
        $cuentaRepo->shouldReceive('create')->andReturn($cuentaCreada);

        $cuentaMesRepo = mock(CuentaMesRepository::class);
        $cuentaMesRepo->shouldReceive('create')->andReturn(
            mockCuentaMes(['id' => 1, 'cuenta_id' => 1, 'mes_id' => 1, 'saldo_inicial' => '0.00', 'saldo_final' => null])
        );

        $mesRepo = mock(MesRepository::class);
        $mesRepo->shouldReceive('findMesAbierto')->andReturn($mesAbierto);

        mock(PendienteRepository::class);

        $mesService = mock(MesService::class);
        $mesService->shouldReceive('bootstrapPrimerMes')->once();

        resolve(CuentaService::class)->crear(
            ['nombre' => 'PrimerBanco', 'tipo' => 'corriente', 'saldo_inicial' => 0.0],
            adminPermisos()
        );

        // Mockery verifica la expectativa once() en tearDown
    });

    test('throws 403 when request has no permissions', function () {
        mock(CuentaRepository::class);
        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        expect(fn () => resolve(CuentaService::class)->crear(
            ['nombre' => 'Test', 'tipo' => 'corriente', 'saldo_inicial' => 0.0],
            []
        ))->toThrow(ValidationException::class);
    });
});

// ---------------------------------------------------------------------------
// editar
// ---------------------------------------------------------------------------

describe('editar', function () {
    test('can edit account basic data', function () {
        $cuenta = mockCuenta(['id' => 1, 'nombre' => 'BancoAntiguo', 'activa' => true, 'tipo' => 'corriente', 'banco' => null]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);
        $cuentaRepo->shouldReceive('findCuentaActivaPorNombre')->with('BancoNuevo', 1)->andReturn(null);
        $cuentaRepo->shouldReceive('update')->andReturn($cuenta);

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        $result = resolve(CuentaService::class)->editar(1, ['nombre' => 'BancoNuevo'], adminPermisos());

        expect($result)->toBeArray();
    });

    test('throws 422 when new name already used by another active account', function () {
        $cuenta = mockCuenta(['id' => 1, 'nombre' => 'BancoUno', 'activa' => true, 'tipo' => 'corriente', 'banco' => null]);
        $otraCuenta = mockCuenta(['id' => 3, 'nombre' => 'BancoOcupado', 'activa' => true]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);
        $cuentaRepo->shouldReceive('findCuentaActivaPorNombre')->with('BancoOcupado', 1)->andReturn($otraCuenta);

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        expect(fn () => resolve(CuentaService::class)->editar(1, ['nombre' => 'BancoOcupado'], adminPermisos()))
            ->toThrow(ValidationException::class);
    });

    test('throws 404 when account to edit does not exist', function () {
        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(99)->andReturn(null);

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        expect(fn () => resolve(CuentaService::class)->editar(99, ['nombre' => 'Nuevo'], adminPermisos()))
            ->toThrow(ValidationException::class);
    });
});

// ---------------------------------------------------------------------------
// corregirSaldoInicial
// ---------------------------------------------------------------------------

describe('corregirSaldoInicial', function () {
    test('can correct initial balance when open month exists', function () {
        $cuenta = mockCuenta(['id' => 1, 'nombre' => 'Banco', 'activa' => true]);
        $mesAbierto = mockMes(['id' => 1, 'estado' => 'abierto']);
        $cuentaMes = mockCuentaMes(['id' => 1, 'cuenta_id' => 1, 'mes_id' => 1, 'saldo_inicial' => '500.00', 'saldo_final' => null]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);

        $cuentaMesRepo = mock(CuentaMesRepository::class);
        $cuentaMesRepo->shouldReceive('findPorCuentaYMes')->with(1, 1)->andReturn($cuentaMes);
        $cuentaMesRepo->shouldReceive('update')->andReturn($cuentaMes);

        $mesRepo = mock(MesRepository::class);
        $mesRepo->shouldReceive('findMesAbierto')->andReturn($mesAbierto);

        mock(PendienteRepository::class);
        mock(MesService::class);

        $result = resolve(CuentaService::class)->corregirSaldoInicial(1, 500.0, adminPermisos());

        expect($result)->toBeArray();
    });

    test('throws 422 when there is no open month', function () {
        $cuenta = mockCuenta(['id' => 1, 'nombre' => 'Banco', 'activa' => true]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);

        mock(CuentaMesRepository::class);

        $mesRepo = mock(MesRepository::class);
        $mesRepo->shouldReceive('findMesAbierto')->andReturn(null);

        mock(PendienteRepository::class);
        mock(MesService::class);

        expect(fn () => resolve(CuentaService::class)->corregirSaldoInicial(1, 500.0, adminPermisos()))
            ->toThrow(ValidationException::class);
    });

    test('throws 404 when account does not exist', function () {
        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(77)->andReturn(null);

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        expect(fn () => resolve(CuentaService::class)->corregirSaldoInicial(77, 100.0, adminPermisos()))
            ->toThrow(ValidationException::class);
    });
});

// ---------------------------------------------------------------------------
// desactivar
// ---------------------------------------------------------------------------

describe('desactivar', function () {
    test('can deactivate account when no open pending items exist', function () {
        $cuenta = mockCuenta(['id' => 1, 'nombre' => 'Banco', 'activa' => true]);
        $mesAbierto = mockMes(['id' => 1, 'estado' => 'abierto']);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);
        $cuentaRepo->shouldReceive('update')->andReturn($cuenta);

        mock(CuentaMesRepository::class);

        $mesRepo = mock(MesRepository::class);
        $mesRepo->shouldReceive('findMesAbierto')->andReturn($mesAbierto);

        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('getPendientesAbiertosPorCuentaYMes')
            ->with(1, 1)
            ->andReturn(new Collection([]));

        mock(MesService::class);

        $result = resolve(CuentaService::class)->desactivar(1, adminPermisos());

        expect($result)->toBeArray();
    });

    test('throws 409 when account has open pending items in current month', function () {
        $cuenta = mockCuenta(['id' => 1, 'nombre' => 'Banco', 'activa' => true]);
        $mesAbierto = mockMes(['id' => 1, 'estado' => 'abierto']);
        $pendienteAbierto = mockPendiente(['id' => 1, 'estado' => 'pendiente', 'cuenta_id' => 1, 'mes_id' => 1]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);

        mock(CuentaMesRepository::class);

        $mesRepo = mock(MesRepository::class);
        $mesRepo->shouldReceive('findMesAbierto')->andReturn($mesAbierto);

        $pendienteRepo = mock(PendienteRepository::class);
        $pendienteRepo->shouldReceive('getPendientesAbiertosPorCuentaYMes')
            ->with(1, 1)
            ->andReturn(new Collection([$pendienteAbierto]));

        mock(MesService::class);

        expect(fn () => resolve(CuentaService::class)->desactivar(1, adminPermisos()))
            ->toThrow(ValidationException::class);
    });

    test('throws 422 when account is already inactive', function () {
        $cuenta = mockCuenta(['id' => 1, 'nombre' => 'Banco', 'activa' => false]);

        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(1)->andReturn($cuenta);

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        expect(fn () => resolve(CuentaService::class)->desactivar(1, adminPermisos()))
            ->toThrow(ValidationException::class);
    });

    test('throws 404 when account to deactivate does not exist', function () {
        $cuentaRepo = mock(CuentaRepository::class);
        $cuentaRepo->shouldReceive('findCuenta')->with(55)->andReturn(null);

        mock(CuentaMesRepository::class);
        mock(MesRepository::class);
        mock(PendienteRepository::class);
        mock(MesService::class);

        expect(fn () => resolve(CuentaService::class)->desactivar(55, adminPermisos()))
            ->toThrow(ValidationException::class);
    });
});
