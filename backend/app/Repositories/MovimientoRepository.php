<?php

namespace App\Repositories;

use App\Models\Movimiento;
use App\Utils\PaginationUtils;
use Illuminate\Database\Eloquent\Collection;

/**
 * Repositorio para la entidad Movimiento.
 *
 * Solo queries; sin lógica de negocio ni transacciones.
 *
 * @package App\Repositories
 */
class MovimientoRepository
{
    /**
     * @param Movimiento    $model
     * @param PaginationUtils $pagination
     */
    public function __construct(
        protected Movimiento $model,
        protected PaginationUtils $pagination
    ) {}

    /**
     * Busca un movimiento por ID.
     *
     * @param int $id
     * @return Movimiento|null
     */
    public function findMovimiento(int $id): ?Movimiento
    {
        return $this->model->newQuery()->find($id);
    }

    /**
     * Retorna movimientos paginados con filtros opcionales.
     *
     * @param array<string, mixed> $params  Acepta: mes_id, cuenta_id, tipo, categoria, search, page, per_page
     * @return array{data: array<int, Movimiento>, meta: array<string, int>}
     */
    public function paginateMovimientos(array $params): array
    {
        // PostgreSQL distingue mayúsculas con LIKE; ILIKE replica el comportamiento
        // case-insensitive que MySQL y SQLite tienen por defecto.
        $likeOp = $this->model->getConnection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

        $query = $this->model->newQuery()
            ->when(isset($params['mes_id']), fn($q) => $q->where('mes_id', $params['mes_id']))
            ->when(isset($params['cuenta_id']), fn($q) => $q->where('cuenta_id', $params['cuenta_id']))
            ->when(isset($params['tipo']), fn($q) => $q->where('tipo', $params['tipo']))
            ->when(isset($params['categoria_id']), fn($q) => $q->where('categoria_id', $params['categoria_id']))
            ->when(
                isset($params['search']) && $params['search'] !== '',
                fn($q) => $q->where(fn($sub) => $sub
                    ->where('descripcion', $likeOp, '%' . $params['search'] . '%')
                )
            )
            ->with(['cuenta', 'mes', 'categoria'])
            ->orderByDesc('fecha')
            ->orderByDesc('id');

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
     * Búsqueda global cross-mes con filtros opcionales.
     *
     * @param array<string, mixed> $params  q?, categoria_id?, tipo?, cuenta_id?, fecha_desde?, fecha_hasta?, page?, per_page?
     * @return array{data: array<int, mixed>, meta: array<string, int>}
     */
    public function buscarGlobal(array $params): array
    {
        $likeOp = $this->model->getConnection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

        $query = $this->model->newQuery()
            ->when(
                isset($params['q']) && $params['q'] !== '',
                fn($q) => $q->where(fn($sub) => $sub
                    ->where('descripcion', $likeOp, '%' . $params['q'] . '%')
                    ->orWhere('observacion', $likeOp, '%' . $params['q'] . '%')
                )
            )
            ->when(isset($params['categoria_id']), fn($q) => $q->where('categoria_id', $params['categoria_id']))
            ->when(isset($params['tipo']), fn($q) => $q->where('tipo', $params['tipo']))
            ->when(isset($params['cuenta_id']), fn($q) => $q->where('cuenta_id', $params['cuenta_id']))
            ->when(isset($params['fecha_desde']), fn($q) => $q->where('fecha', '>=', $params['fecha_desde']))
            ->when(isset($params['fecha_hasta']), fn($q) => $q->where('fecha', '<=', $params['fecha_hasta']))
            ->with(['cuenta', 'mes', 'categoria'])
            ->orderByDesc('fecha')
            ->orderByDesc('id');

        return $this->pagination->paginar($query, $params, null, null, [], 50);
    }

    /**
     * Retorna el total de ingresos y egresos agrupados por cuenta_id para un mes.
     *
     * @param int $mesId
     * @return Collection<int, object>  Cada item: {cuenta_id, total_ingresos, total_egresos}
     */
    public function getTotalesPorMes(int $mesId): Collection
    {
        return $this->model->newQuery()
            ->selectRaw('cuenta_id,
                SUM(CASE WHEN tipo = ? THEN monto ELSE 0 END) as total_ingresos,
                SUM(CASE WHEN tipo = ? THEN monto ELSE 0 END) as total_egresos', ['ingreso', 'egreso'])
            ->where('mes_id', $mesId)
            ->groupBy('cuenta_id')
            ->get();
    }

    /**
     * Crea un nuevo movimiento.
     *
     * @param array<string, mixed> $datos
     * @return Movimiento
     */
    public function create(array $datos): Movimiento
    {
        return $this->model->newQuery()->create($datos);
    }

    /**
     * Actualiza un movimiento existente.
     *
     * @param Movimiento $movimiento
     * @param array<string, mixed> $datos
     * @return Movimiento
     */
    public function update(Movimiento $movimiento, array $datos): Movimiento
    {
        $movimiento->update($datos);
        return $movimiento;
    }

    /**
     * Elimina un movimiento.
     *
     * @param Movimiento $movimiento
     * @return void
     */
    public function delete(Movimiento $movimiento): void
    {
        $movimiento->delete();
    }

    /**
     * Cuenta movimientos de un mes (excluye opcionalmente un ID de pendiente origen).
     *
     * Útil para la validación de reapertura: mes siguiente sin movimientos nuevos.
     *
     * @param int $mesId
     * @return int
     */
    public function countPorMes(int $mesId): int
    {
        return $this->model->newQuery()
            ->where('mes_id', $mesId)
            ->count();
    }
}
