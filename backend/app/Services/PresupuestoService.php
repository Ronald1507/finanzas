<?php

namespace App\Services;

use App\Repositories\MesRepository;
use App\Repositories\MovimientoRepository;
use App\Repositories\PresupuestoRepository;
use App\Utils\ErrorsBag;
use App\Utils\PermissionControl;

/**
 * Servicio para la gestión de presupuestos mensuales por categoría.
 *
 * @package App\Services
 */
class PresupuestoService
{
    public function __construct(
        protected PresupuestoRepository $presupuestoRepo,
        protected MovimientoRepository  $movimientoRepo,
        protected MesRepository         $mesRepo,
        protected ErrorsBag             $errors,
        protected PermissionControl     $permissions
    ) {}

    /**
     * Lista presupuestos de un mes con ejecutado calculado.
     *
     * @param int $mesId
     * @return array<int, array<string, mixed>>
     */
    public function listarConEjecutado(int $mesId): array
    {
        $presupuestos = $this->presupuestoRepo->getPorMes($mesId);

        $ejecutadoMap = $this->movimientoRepo
            ->getEgresosPorCategoriaMes($mesId)
            ->keyBy('categoria_id');

        return $presupuestos->map(function ($p) use ($ejecutadoMap) {
            $ejecutado  = (float) ($ejecutadoMap->get($p->categoria_id)?->ejecutado ?? 0);
            $limite     = (float) $p->monto_limite;
            $porcentaje = $limite > 0 ? round(($ejecutado / $limite) * 100, 1) : 0;

            $estado = match (true) {
                $porcentaje > 100 => 'excedido',
                $porcentaje >= 80  => 'alerta',
                default            => 'ok',
            };

            return [
                'id'           => $p->id,
                'categoria_id' => $p->categoria_id,
                'mes_id'       => $p->mes_id,
                'monto_limite' => $limite,
                'ejecutado'    => $ejecutado,
                'porcentaje'   => $porcentaje,
                'estado'       => $estado,
                'categoria'    => $p->categoria?->toArray(),
            ];
        })->values()->toArray();
    }

    /**
     * Crea un presupuesto.
     *
     * @param array<string, mixed> $datos  categoria_id, mes_id, monto_limite
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function crear(array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $mes = $this->mesRepo->findMes($datos['mes_id']);
        if ($mes === null) {
            $this->errors->throwFast('mes_id', 'El mes no existe', 422);
        }

        if ($mes->estado === 'cerrado') {
            $this->errors->throwFast('mes_id', 'No se puede presupuestar en un mes cerrado', 409);
        }

        $existente = $this->presupuestoRepo->findPorCategoriaYMes($datos['categoria_id'], $datos['mes_id']);
        if ($existente !== null) {
            $this->errors->throwFast('categoria_id', 'Ya existe un presupuesto para esta categoría en este mes', 422);
        }

        $presupuesto = $this->presupuestoRepo->create([
            'categoria_id' => $datos['categoria_id'],
            'mes_id'       => $datos['mes_id'],
            'monto_limite' => $datos['monto_limite'],
        ]);

        return $presupuesto->fresh()->load('categoria')->toArray();
    }

    /**
     * Edita un presupuesto existente.
     *
     * @param int   $id
     * @param array<string, mixed> $datos
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function editar(int $id, array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $presupuesto = $this->presupuestoRepo->findPresupuesto($id);
        if ($presupuesto === null) {
            $this->errors->throwFast('id', 'Presupuesto no encontrado', 404);
        }

        $categoriaId = $datos['categoria_id'] ?? $presupuesto->categoria_id;
        $mesId       = $presupuesto->mes_id;

        $existente = $this->presupuestoRepo->findPorCategoriaYMes($categoriaId, $mesId, $id);
        if ($existente !== null) {
            $this->errors->throwFast('categoria_id', 'Ya existe un presupuesto para esta categoría en este mes', 422);
        }

        $this->presupuestoRepo->update($presupuesto, [
            'categoria_id' => $categoriaId,
            'monto_limite' => $datos['monto_limite'] ?? $presupuesto->monto_limite,
        ]);

        return $presupuesto->fresh()->load('categoria')->toArray();
    }

    /**
     * Elimina un presupuesto.
     *
     * @param int   $id
     * @param array<string, mixed> $requestPermisos
     * @return void
     */
    public function eliminar(int $id, array $requestPermisos): void
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $presupuesto = $this->presupuestoRepo->findPresupuesto($id);
        if ($presupuesto === null) {
            $this->errors->throwFast('id', 'Presupuesto no encontrado', 404);
        }

        $this->presupuestoRepo->delete($presupuesto);
    }
}
