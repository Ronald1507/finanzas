<?php

namespace App\Services;

use App\Repositories\PendienteRepository;
use App\Repositories\MovimientoRepository;
use App\Repositories\MesRepository;
use App\Repositories\CuentaRepository;
use App\Utils\ErrorsBag;
use App\Utils\PermissionControl;
use Illuminate\Support\Facades\DB;

/**
 * Servicio para la gestión de pendientes (cuentas por pagar/recibir).
 *
 * Reglas de negocio:
 * - Crear: mes abierto, cuenta activa, monto > 0.
 * - Editar/anular: solo en estado 'pendiente' y mes abierto.
 * - Concretar: genera movimiento real vinculado en DB::transaction().
 * - Un realizado no se edita ni anula directamente; se corrige eliminando su movimiento.
 *
 * @package App\Services
 */
class PendienteService
{
    /**
     * @param PendienteRepository  $pendienteRepo
     * @param MovimientoRepository $movimientoRepo
     * @param MesRepository        $mesRepo
     * @param CuentaRepository     $cuentaRepo
     * @param ErrorsBag            $errors
     * @param PermissionControl    $permissions
     */
    public function __construct(
        protected PendienteRepository $pendienteRepo,
        protected MovimientoRepository $movimientoRepo,
        protected MesRepository $mesRepo,
        protected CuentaRepository $cuentaRepo,
        protected ErrorsBag $errors,
        protected PermissionControl $permissions
    ) {}

    /**
     * Lista pendientes de un mes con filtros y paginación.
     *
     * @param array<string, mixed> $params  mes_id, tipo?, estado?, page?, per_page?
     * @return array{data: array<int, mixed>, meta: array<string, int>}
     */
    public function listarPorMes(array $params): array
    {
        return $this->pendienteRepo->paginatePorMes($params);
    }

    /**
     * Crea un pendiente en el mes abierto.
     *
     * @param array<string, mixed> $datos  cuenta_id, tipo, monto, descripcion, fecha_estimada
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function crear(array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $mesAbierto = $this->mesRepo->findMesAbierto();
        if ($mesAbierto === null) {
            $this->errors->throwFast('mes', 'No existe un mes abierto para registrar pendientes', 422);
        }

        $cuenta = $this->cuentaRepo->findCuenta($datos['cuenta_id']);
        if ($cuenta === null || !$cuenta->activa) {
            $this->errors->throwFast('cuenta_id', 'La cuenta no existe o está inactiva', 422);
        }

        $pendiente = $this->pendienteRepo->create([
            'cuenta_id'      => $datos['cuenta_id'],
            'mes_id'         => $mesAbierto->id,
            'tipo'           => $datos['tipo'],
            'monto'          => $datos['monto'],
            'descripcion'    => $datos['descripcion'],
            'fecha_estimada' => $datos['fecha_estimada'],
            'estado'         => 'pendiente',
        ]);

        return $pendiente->toArray();
    }

    /**
     * Edita un pendiente; solo permitido en estado 'pendiente' y mes abierto.
     *
     * @param int   $id
     * @param array<string, mixed> $datos
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function editar(int $id, array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $pendiente = $this->pendienteRepo->findPendiente($id);
        if ($pendiente === null) {
            $this->errors->throwFast('id', 'Pendiente no encontrado', 404);
        }

        if ($pendiente->estado !== 'pendiente') {
            $this->errors->throwFast(
                'estado',
                'Solo se pueden editar pendientes en estado pendiente; corrija vía su movimiento si ya fue realizado',
                422
            );
        }

        $mes = $this->mesRepo->findMes($pendiente->mes_id);
        if ($mes === null || $mes->estado === 'cerrado') {
            $this->errors->throwFast('mes', 'El mes está cerrado y no permite modificaciones', 409);
        }

        $cuenta = $this->cuentaRepo->findCuenta($datos['cuenta_id'] ?? $pendiente->cuenta_id);
        if ($cuenta === null || !$cuenta->activa) {
            $this->errors->throwFast('cuenta_id', 'La cuenta no existe o está inactiva', 422);
        }

        $this->pendienteRepo->update($pendiente, [
            'cuenta_id'      => $datos['cuenta_id']      ?? $pendiente->cuenta_id,
            'tipo'           => $datos['tipo']            ?? $pendiente->tipo,
            'monto'          => $datos['monto']           ?? $pendiente->monto,
            'descripcion'    => $datos['descripcion']     ?? $pendiente->descripcion,
            'fecha_estimada' => $datos['fecha_estimada']  ?? $pendiente->fecha_estimada,
        ]);

        return $pendiente->fresh()->toArray();
    }

    /**
     * Concreta un pendiente: genera movimiento real y lo vincula.
     *
     * @param int    $id
     * @param string $fecha  Fecha de concreción (Y-m-d)
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function concretar(int $id, string $fecha, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $pendiente = $this->pendienteRepo->findPendiente($id);
        if ($pendiente === null) {
            $this->errors->throwFast('id', 'Pendiente no encontrado', 404);
        }

        if ($pendiente->estado !== 'pendiente') {
            $this->errors->throwFast('estado', 'El pendiente no está en estado pendiente', 422);
        }

        $mes = $this->mesRepo->findMes($pendiente->mes_id);
        if ($mes === null || $mes->estado === 'cerrado') {
            $this->errors->throwFast('mes', 'El mes del pendiente está cerrado', 409);
        }

        // Derivar mes desde la fecha de concreción
        $dt           = \Carbon\Carbon::parse($fecha);
        $mesConcrecion = $this->mesRepo->findMesPorAnioMes((int) $dt->format('Y'), (int) $dt->format('n'));

        if ($mesConcrecion === null) {
            $this->errors->throwFast('fecha', 'El mes de la fecha de concreción no está inicializado', 422);
        }

        if ($mesConcrecion->estado === 'cerrado') {
            $this->errors->throwFast('fecha', 'El mes de la fecha de concreción está cerrado', 409);
        }

        return DB::transaction(function () use ($pendiente, $fecha, $mesConcrecion) {
            $tipoMovimiento = $pendiente->tipo === 'por_pagar' ? 'egreso' : 'ingreso';

            $movimiento = $this->movimientoRepo->create([
                'cuenta_id'    => $pendiente->cuenta_id,
                'mes_id'       => $mesConcrecion->id,
                'tipo'         => $tipoMovimiento,
                'monto'        => $pendiente->monto,
                'fecha'        => $fecha,
                'descripcion'  => $pendiente->descripcion,
                'categoria'    => 'concrecion_pendiente',
                'pendiente_id' => $pendiente->id,
            ]);

            $this->pendienteRepo->update($pendiente, [
                'estado'       => 'realizado',
                'movimiento_id'=> $movimiento->id,
            ]);

            return $pendiente->fresh()->toArray();
        });
    }

    /**
     * Anula un pendiente; solo desde estado 'pendiente' y mes abierto.
     *
     * @param int   $id
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function anular(int $id, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $pendiente = $this->pendienteRepo->findPendiente($id);
        if ($pendiente === null) {
            $this->errors->throwFast('id', 'Pendiente no encontrado', 404);
        }

        if ($pendiente->estado !== 'pendiente') {
            $this->errors->throwFast('estado', 'Solo se pueden anular pendientes en estado pendiente', 422);
        }

        $mes = $this->mesRepo->findMes($pendiente->mes_id);
        if ($mes === null || $mes->estado === 'cerrado') {
            $this->errors->throwFast('mes', 'El mes está cerrado y no permite modificaciones', 409);
        }

        $this->pendienteRepo->update($pendiente, ['estado' => 'anulado']);

        return $pendiente->fresh()->toArray();
    }
}
