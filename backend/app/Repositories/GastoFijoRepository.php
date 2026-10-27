<?php

namespace App\Repositories;

use App\Models\GastoFijo;
use App\Models\Movimiento;
use App\Utils\PaginationUtils;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

/**
 * Repositorio para la entidad GastoFijo.
 *
 * Solo queries; sin lógica de negocio ni transacciones.
 *
 * @package App\Repositories
 */
class GastoFijoRepository
{
    /**
     * @param GastoFijo       $model
     * @param PaginationUtils $pagination
     */
    public function __construct(
        protected GastoFijo $model,
        protected PaginationUtils $pagination
    ) {}

    /**
     * Busca un gasto fijo por ID.
     *
     * @param int $id
     * @return GastoFijo|null
     */
    public function findGastoFijo(int $id): ?GastoFijo
    {
        return $this->model->newQuery()->find($id);
    }

    /**
     * Retorna gastos fijos paginados con filtros opcionales.
     *
     * @param array<string, mixed> $params  Acepta: search, activo, page, per_page
     * @return array{data: array<int, GastoFijo>, meta: array<string, int>}
     */
    public function paginate(array $params): array
    {
        // PostgreSQL distingue mayúsculas con LIKE; ILIKE replica el comportamiento
        // case-insensitive que MySQL y SQLite tienen por defecto.
        $likeOp = $this->model->getConnection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

        $query = $this->model->newQuery()
            ->when(
                isset($params['search']) && $params['search'] !== '',
                fn($q) => $q->where('nombre', $likeOp, '%' . $params['search'] . '%')
            )
            ->when(isset($params['activo']), fn($q) => $q->where('activo', $params['activo']))
            ->with(['cuenta'])
            ->orderBy('nombre');

        return $this->pagination->paginar(
            $query,
            $params,
            null,
            null,
            [],
            100
        );
    }

    /**
     * Retorna todos los gastos fijos activos.
     *
     * @return Collection<int, GastoFijo>
     */
    public function getActivos(): Collection
    {
        return $this->model->newQuery()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get();
    }

    /**
     * Crea un nuevo gasto fijo.
     *
     * @param array<string, mixed> $datos
     * @return GastoFijo
     */
    public function create(array $datos): GastoFijo
    {
        return $this->model->newQuery()->create($datos);
    }

    /**
     * Actualiza un gasto fijo existente.
     *
     * @param GastoFijo $g
     * @param array<string, mixed> $datos
     * @return bool
     */
    public function update(GastoFijo $g, array $datos): bool
    {
        return $g->update($datos);
    }

    /**
     * Retorna los gastos fijos activos con su estado de pago en un mes.
     *
     * LEFT JOIN a movimientos (por gasto_fijo_id y mes_id) para saber si ya
     * fue pagado este mes, con el movimiento y monto asociados.
     *
     * @param int $mesId
     * @return SupportCollection<int, object>  Cada item: {id, nombre, categoria, cuenta_id, monto_estimado, movimiento_id, monto_pagado}
     */
    public function getActivosConEstadoMes(int $mesId): SupportCollection
    {
        return $this->model->newQuery()
            ->from('gastos_fijos as gf')
            ->leftJoin('movimientos as m', function ($join) use ($mesId) {
                $join->on('m.gasto_fijo_id', '=', 'gf.id')
                    ->where('m.mes_id', '=', $mesId);
            })
            ->where('gf.activo', true)
            ->orderBy('gf.nombre')
            ->get([
                'gf.id as id',
                'gf.nombre as nombre',
                'gf.categoria as categoria',
                'gf.cuenta_id as cuenta_id',
                'gf.monto_estimado as monto_estimado',
                'm.id as movimiento_id',
                'm.monto as monto_pagado',
            ]);
    }

    /**
     * Busca el movimiento generado por un gasto fijo en un mes (para deshacer/validar duplicado).
     *
     * @param int $gastoFijoId
     * @param int $mesId
     * @return Movimiento|null
     */
    public function findMovimientoDelMes(int $gastoFijoId, int $mesId): ?Movimiento
    {
        return Movimiento::query()
            ->where('gasto_fijo_id', $gastoFijoId)
            ->where('mes_id', $mesId)
            ->first();
    }
}
