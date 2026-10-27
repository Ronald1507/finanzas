<?php

namespace App\Services;

use App\Repositories\GastoFijoRepository;
use App\Repositories\MesRepository;
use App\Repositories\CuentaRepository;
use App\Utils\ErrorsBag;
use App\Utils\PermissionControl;

/**
 * Servicio para la gestión del catálogo de gastos fijos y su pago mensual.
 *
 * Reglas de negocio:
 * - Un gasto fijo es un egreso recurrente definido una vez en un catálogo.
 * - Registrar el pago de un gasto fijo crea un EGRESO (movimiento) vinculado por gasto_fijo_id.
 * - "¿Pagado este mes?" = existe un movimiento con ese gasto_fijo_id en ese mes.
 * - Un gasto fijo solo puede pagarse una vez por mes.
 * - Desactivar NO borra: los movimientos históricos quedan intactos.
 * - El alta/edición de movimientos delega en MovimientoService (valida cuenta activa y mes abierto).
 *
 * @package App\Services
 */
class GastoFijoService
{
    /**
     * @param GastoFijoRepository $gastoFijoRepo
     * @param MovimientoService   $movimientoService
     * @param MesRepository       $mesRepo
     * @param CuentaRepository    $cuentaRepo
     * @param ErrorsBag           $errors
     * @param PermissionControl   $permissions
     */
    public function __construct(
        protected GastoFijoRepository $gastoFijoRepo,
        protected MovimientoService $movimientoService,
        protected MesRepository $mesRepo,
        protected CuentaRepository $cuentaRepo,
        protected ErrorsBag $errors,
        protected PermissionControl $permissions
    ) {}

    /**
     * Lista el catálogo de gastos fijos paginado con filtros.
     *
     * @param array<string, mixed> $params  search?, activo?, page?, per_page?
     * @return array{data: array<int, mixed>, meta: array<string, int>}
     */
    public function listar(array $params): array
    {
        return $this->gastoFijoRepo->paginate($params);
    }

    /**
     * Crea un nuevo gasto fijo en el catálogo.
     *
     * @param array<string, mixed> $datos  nombre, categoria?, cuenta_id?, monto_estimado?, activo?
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function crear(array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        if (isset($datos['cuenta_id'])) {
            $cuenta = $this->cuentaRepo->findCuenta($datos['cuenta_id']);
            if ($cuenta === null) {
                $this->errors->throwFast('cuenta_id', 'La cuenta no existe', 422);
            }
        }

        $categoria = isset($datos['categoria']) && trim((string) $datos['categoria']) !== ''
            ? $datos['categoria']
            : 'Gastos Fijos';

        $gastoFijo = $this->gastoFijoRepo->create([
            'nombre'         => $datos['nombre'],
            'categoria'      => $categoria,
            'cuenta_id'      => $datos['cuenta_id'] ?? null,
            'monto_estimado' => $datos['monto_estimado'] ?? null,
            'activo'         => $datos['activo'] ?? true,
        ]);

        return $gastoFijo->toArray();
    }

    /**
     * Edita un gasto fijo existente.
     *
     * @param int   $id
     * @param array<string, mixed> $datos
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function editar(int $id, array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $gastoFijo = $this->gastoFijoRepo->findGastoFijo($id);
        if ($gastoFijo === null) {
            $this->errors->throwFast('id', 'Gasto fijo no encontrado', 404);
        }

        if (isset($datos['cuenta_id'])) {
            $cuenta = $this->cuentaRepo->findCuenta($datos['cuenta_id']);
            if ($cuenta === null) {
                $this->errors->throwFast('cuenta_id', 'La cuenta no existe', 422);
            }
        }

        $this->gastoFijoRepo->update($gastoFijo, [
            'nombre'         => $datos['nombre']    ?? $gastoFijo->nombre,
            'categoria'      => $datos['categoria'] ?? $gastoFijo->categoria,
            'cuenta_id'      => array_key_exists('cuenta_id', $datos) ? $datos['cuenta_id'] : $gastoFijo->cuenta_id,
            'monto_estimado' => array_key_exists('monto_estimado', $datos) ? $datos['monto_estimado'] : $gastoFijo->monto_estimado,
            'activo'         => $datos['activo']    ?? $gastoFijo->activo,
        ]);

        return $gastoFijo->fresh()->toArray();
    }

    /**
     * Desactiva un gasto fijo (los movimientos históricos quedan intactos).
     *
     * @param int   $id
     * @param array<string, mixed> $requestPermisos
     * @return void
     */
    public function desactivar(int $id, array $requestPermisos): void
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $gastoFijo = $this->gastoFijoRepo->findGastoFijo($id);
        if ($gastoFijo === null) {
            $this->errors->throwFast('id', 'Gasto fijo no encontrado', 404);
        }

        $this->gastoFijoRepo->update($gastoFijo, ['activo' => false]);
    }

    /**
     * Lista los gastos fijos activos con su estado de pago en un mes, con totales.
     *
     * @param int $mesId
     * @param array<string, mixed> $params
     * @return array{items: array<int, array<string, mixed>>, totales: array<string, mixed>}
     */
    public function listarPorMes(int $mesId, array $params = []): array
    {
        $filas = $this->gastoFijoRepo->getActivosConEstadoMes($mesId);

        $items          = [];
        $totalEstimado  = 0.0;
        $totalPagado    = 0.0;
        $pendientes     = 0;

        foreach ($filas as $fila) {
            $pagado = $fila->movimiento_id !== null;

            $items[] = [
                'id'             => $fila->id,
                'nombre'         => $fila->nombre,
                'categoria'      => $fila->categoria,
                'cuenta_id'      => $fila->cuenta_id,
                'monto_estimado' => $fila->monto_estimado,
                'movimiento_id'  => $fila->movimiento_id,
                'monto_pagado'   => $fila->monto_pagado,
                'pagado'         => $pagado,
            ];

            $totalEstimado += (float) ($fila->monto_estimado ?? 0);

            if ($pagado) {
                $totalPagado += (float) ($fila->monto_pagado ?? 0);
            } else {
                $pendientes++;
            }
        }

        return [
            'items'   => $items,
            'totales' => [
                'estimado'   => $totalEstimado,
                'pagado'     => $totalPagado,
                'pendientes' => $pendientes,
            ],
        ];
    }

    /**
     * Registra el pago de un gasto fijo en el mes derivado de la fecha.
     *
     * Crea un EGRESO (movimiento) vinculado por gasto_fijo_id reutilizando
     * MovimientoService::crear (valida cuenta activa y mes abierto).
     *
     * @param int   $gastoFijoId
     * @param array<string, mixed> $datos  monto, fecha (Y-m-d), cuenta_id
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function registrarPago(int $gastoFijoId, array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $gastoFijo = $this->gastoFijoRepo->findGastoFijo($gastoFijoId);
        if ($gastoFijo === null || !$gastoFijo->activo) {
            $this->errors->throwFast('gasto_fijo', 'El gasto fijo no existe o está inactivo', 422);
        }

        $dt  = \Carbon\Carbon::parse($datos['fecha']);
        $mes = $this->mesRepo->findMesPorAnioMes((int) $dt->format('Y'), (int) $dt->format('n'));

        if ($mes === null) {
            $this->errors->throwFast('fecha', 'El mes de la fecha indicada no está inicializado', 422);
        }

        $existente = $this->gastoFijoRepo->findMovimientoDelMes($gastoFijoId, $mes->id);
        if ($existente !== null) {
            $this->errors->throwFast('gasto_fijo', 'Este gasto fijo ya fue registrado este mes', 409);
        }

        $movimiento = $this->movimientoService->crear([
            'cuenta_id'     => $datos['cuenta_id'],
            'tipo'          => 'egreso',
            'monto'         => $datos['monto'],
            'fecha'         => $datos['fecha'],
            'descripcion'   => $gastoFijo->nombre,
            'categoria'     => $gastoFijo->categoria,
            'gasto_fijo_id' => $gastoFijoId,
        ], $requestPermisos);

        return $movimiento;
    }

    /**
     * Deshace el pago de un gasto fijo en un mes eliminando su movimiento.
     *
     * @param int   $gastoFijoId
     * @param int   $mesId
     * @param array<string, mixed> $requestPermisos
     * @return void
     */
    public function deshacerPago(int $gastoFijoId, int $mesId, array $requestPermisos): void
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $movimiento = $this->gastoFijoRepo->findMovimientoDelMes($gastoFijoId, $mesId);
        if ($movimiento === null) {
            $this->errors->throwFast('gasto_fijo', 'No existe un pago registrado para este gasto fijo en el mes indicado', 404);
        }

        $this->movimientoService->eliminar($movimiento->id, $requestPermisos);
    }
}
