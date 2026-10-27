<?php

namespace App\Services;

use App\Repositories\CuentaRepository;
use App\Repositories\CuentaMesRepository;
use App\Repositories\MesRepository;
use App\Repositories\PendienteRepository;
use App\Utils\ErrorsBag;
use App\Utils\PermissionControl;
use Illuminate\Support\Facades\DB;

/**
 * Servicio para la gestión de cuentas bancarias.
 *
 * Reglas de negocio:
 * - Nombre único entre cuentas activas (validado vía CuentaRepository).
 * - Crear cuenta genera su cuenta_mes en el mes abierto con el saldo_inicial dado.
 * - Si no existe ningún mes al crear la primera cuenta, MesService bootstrapea el mes actual.
 * - Desactivar rechazada si hay pendientes 'pendiente' en el mes abierto.
 * - Corregir saldo inicial solo en mes abierto.
 *
 * @package App\Services
 */
class CuentaService
{
    /**
     * @param CuentaRepository    $cuentaRepo
     * @param CuentaMesRepository $cuentaMesRepo
     * @param MesRepository       $mesRepo
     * @param PendienteRepository $pendienteRepo
     * @param MesService          $mesService
     * @param ErrorsBag           $errors
     * @param PermissionControl   $permissions
     */
    public function __construct(
        protected CuentaRepository $cuentaRepo,
        protected CuentaMesRepository $cuentaMesRepo,
        protected MesRepository $mesRepo,
        protected PendienteRepository $pendienteRepo,
        protected MesService $mesService,
        protected ErrorsBag $errors,
        protected PermissionControl $permissions
    ) {}

    /**
     * Lista cuentas con filtro opcional por activa.
     *
     * @param bool|null $activa
     * @return array<int, array<string, mixed>>
     */
    public function listarCuentas(?bool $activa = null): array
    {
        return $this->cuentaRepo->getCuentas($activa)->toArray();
    }

    /**
     * Obtiene una cuenta por ID.
     *
     * @param int $id
     * @return array<string, mixed>
     */
    public function obtenerCuenta(int $id): array
    {
        $cuenta = $this->cuentaRepo->findCuenta($id);
        if ($cuenta === null) {
            $this->errors->throwFast('id', 'Cuenta no encontrada', 404);
        }
        return $cuenta->toArray();
    }

    /**
     * Crea una nueva cuenta con su cuenta_mes inicial.
     *
     * @param array<string, mixed> $datos         nombre, banco?, tipo, saldo_inicial
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function crear(array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        // Unicidad de nombre entre activas
        $existente = $this->cuentaRepo->findCuentaActivaPorNombre($datos['nombre']);
        if ($existente !== null) {
            $this->errors->throwFast('nombre', 'Ya existe una cuenta activa con ese nombre', 422);
        }

        // Bootstrap del primer mes si no existe ninguno
        $this->mesService->bootstrapPrimerMes();

        $mesAbierto = $this->mesRepo->findMesAbierto();
        if ($mesAbierto === null) {
            $this->errors->throwFast('mes', 'No existe un mes abierto para asociar la cuenta', 422);
        }

        $cuenta = DB::transaction(function () use ($datos, $mesAbierto) {
            $cuenta = $this->cuentaRepo->create([
                'nombre' => $datos['nombre'],
                'banco'  => $datos['banco'] ?? null,
                'tipo'   => $datos['tipo'],
                'activa' => true,
            ]);

            $this->cuentaMesRepo->create([
                'cuenta_id'     => $cuenta->id,
                'mes_id'        => $mesAbierto->id,
                'saldo_inicial' => $datos['saldo_inicial'] ?? 0,
                'saldo_final'   => null,
            ]);

            return $cuenta;
        });

        return $cuenta->toArray();
    }

    /**
     * Edita los datos básicos de una cuenta (nombre, banco, tipo).
     *
     * @param int   $id
     * @param array<string, mixed> $datos
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function editar(int $id, array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $cuenta = $this->cuentaRepo->findCuenta($id);
        if ($cuenta === null) {
            $this->errors->throwFast('id', 'Cuenta no encontrada', 404);
        }

        // Unicidad de nombre si se cambia
        if (isset($datos['nombre']) && $datos['nombre'] !== $cuenta->nombre) {
            $existente = $this->cuentaRepo->findCuentaActivaPorNombre($datos['nombre'], $id);
            if ($existente !== null) {
                $this->errors->throwFast('nombre', 'Ya existe una cuenta activa con ese nombre', 422);
            }
        }

        $this->cuentaRepo->update($cuenta, [
            'nombre' => $datos['nombre'] ?? $cuenta->nombre,
            'banco'  => array_key_exists('banco', $datos) ? $datos['banco'] : $cuenta->banco,
            'tipo'   => $datos['tipo'] ?? $cuenta->tipo,
        ]);

        return $cuenta->fresh()->toArray();
    }

    /**
     * Corrige el saldo inicial de una cuenta en el mes abierto.
     *
     * @param int   $id
     * @param float $saldoInicial
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function corregirSaldoInicial(int $id, float $saldoInicial, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $cuenta = $this->cuentaRepo->findCuenta($id);
        if ($cuenta === null) {
            $this->errors->throwFast('id', 'Cuenta no encontrada', 404);
        }

        $mesAbierto = $this->mesRepo->findMesAbierto();
        if ($mesAbierto === null) {
            $this->errors->throwFast('mes', 'No existe un mes abierto', 422);
        }

        $cuentaMes = $this->cuentaMesRepo->findPorCuentaYMes($id, $mesAbierto->id);
        if ($cuentaMes === null) {
            $this->errors->throwFast('cuenta_mes', 'La cuenta no tiene registro en el mes abierto', 422);
        }

        $this->cuentaMesRepo->update($cuentaMes, ['saldo_inicial' => $saldoInicial]);

        return $cuentaMes->fresh()->toArray();
    }

    /**
     * Desactiva una cuenta.
     *
     * Rechazado si la cuenta tiene pendientes en estado 'pendiente' en el mes abierto.
     *
     * @param int   $id
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function desactivar(int $id, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $cuenta = $this->cuentaRepo->findCuenta($id);
        if ($cuenta === null) {
            $this->errors->throwFast('id', 'Cuenta no encontrada', 404);
        }

        if (!$cuenta->activa) {
            $this->errors->throwFast('id', 'La cuenta ya está inactiva', 422);
        }

        $mesAbierto = $this->mesRepo->findMesAbierto();
        if ($mesAbierto !== null) {
            $pendientesAbiertos = $this->pendienteRepo->getPendientesAbiertosPorCuentaYMes(
                $id,
                $mesAbierto->id
            );

            if ($pendientesAbiertos->isNotEmpty()) {
                $this->errors->throwFast(
                    'cuenta',
                    'La cuenta tiene pendientes abiertos en el mes actual; resuélvalos antes de desactivar',
                    409
                );
            }
        }

        $this->cuentaRepo->update($cuenta, ['activa' => false]);

        return $cuenta->fresh()->toArray();
    }
}
