<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;

// Repositories
use App\Repositories\MesRepository;
use App\Repositories\CuentaRepository;
use App\Repositories\CuentaMesRepository;
use App\Repositories\MovimientoRepository;
use App\Repositories\PendienteRepository;

// Services
use App\Services\SaldoService;
use App\Services\MesService;
use App\Services\CuentaService;
use App\Services\MovimientoService;
use App\Services\PendienteService;

// Utils
use App\Utils\ResponseUtils;
use App\Utils\ValidacionUtils;
use App\Utils\ErrorsBag;
use App\Utils\PaginationUtils;
use App\Utils\PermissionControl;

/**
 * Proveedor principal de servicios — registra bindings CSR del proyecto.
 *
 * @package App\Providers
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Registra los bindings del contenedor de dependencias.
     */
    public function register(): void
    {
        // Utils (transient — instancia nueva por inyección)
        $this->app->bind(ResponseUtils::class);
        $this->app->bind(ValidacionUtils::class);
        $this->app->bind(ErrorsBag::class);
        $this->app->bind(PaginationUtils::class);

        $this->app->bind(PermissionControl::class, function ($app) {
            return new PermissionControl($app->make(ErrorsBag::class));
        });

        // Repositories
        $this->app->bind(MesRepository::class);
        $this->app->bind(CuentaRepository::class);
        $this->app->bind(CuentaMesRepository::class);
        $this->app->bind(MovimientoRepository::class);
        $this->app->bind(PendienteRepository::class);

        // Services
        $this->app->bind(SaldoService::class);
        $this->app->bind(MesService::class);
        $this->app->bind(CuentaService::class);
        $this->app->bind(MovimientoService::class);
        $this->app->bind(PendienteService::class);
    }

    /**
     * Arranque de servicios de la aplicación.
     */
    public function boot(): void
    {
        // Habilitar FK constraints en SQLite
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        }
    }
}
