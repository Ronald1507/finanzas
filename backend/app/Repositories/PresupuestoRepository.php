<?php

namespace App\Repositories;

use App\Models\Presupuesto;
use Illuminate\Database\Eloquent\Collection;

/**
 * Solo queries; sin lógica de negocio.
 *
 * @package App\Repositories
 */
class PresupuestoRepository
{
    public function __construct(
        protected Presupuesto $model
    ) {}

    public function findPresupuesto(int $id): ?Presupuesto
    {
        return $this->model->newQuery()->with('categoria')->find($id);
    }

    /** @return Collection<int, Presupuesto> */
    public function getPorMes(int $mesId): Collection
    {
        return $this->model->newQuery()
            ->where('mes_id', $mesId)
            ->with('categoria')
            ->orderBy('id')
            ->get();
    }

    public function findPorCategoriaYMes(int $categoriaId, int $mesId, ?int $exceptId = null): ?Presupuesto
    {
        $q = $this->model->newQuery()
            ->where('categoria_id', $categoriaId)
            ->where('mes_id', $mesId);

        if ($exceptId !== null) {
            $q->where('id', '!=', $exceptId);
        }

        return $q->first();
    }

    public function create(array $datos): Presupuesto
    {
        return $this->model->newQuery()->create($datos);
    }

    public function update(Presupuesto $presupuesto, array $datos): Presupuesto
    {
        $presupuesto->update($datos);
        return $presupuesto;
    }

    public function delete(Presupuesto $presupuesto): void
    {
        $presupuesto->delete();
    }
}
