<?php

use App\Repositories\CuentaRepository;
use App\Repositories\MesRepository;
use App\Repositories\MovimientoRepository;
use App\Repositories\PendienteRepository;
use App\Services\MovimientoService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;
use function Pest\Laravel\mock;

describe("listarMovimientos", function () {
    test("can list movements with required mes_id filter", function () {
        $movimientoRepo = mock(MovimientoRepository::class);
        $movimientoRepo->shouldReceive("paginateMovimientos")
            ->with(["mes_id" => 1])
            ->andReturn(["data" => [], "meta" => ["total" => 0, "page" => 1, "per_page" => 100]]);

        mock(MesRepository::class);
        mock(CuentaRepository::class);
        mock(PendienteRepository::class);

        $result = resolve(MovimientoService::class)->listarMovimientos(["mes_id" => 1]);

        expect($result)->toBeArray()
            ->and($result)->toHaveKey("data")
            ->and($result)->toHaveKey("meta");
    });
});