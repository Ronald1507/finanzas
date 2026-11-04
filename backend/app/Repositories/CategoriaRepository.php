<?php

namespace App\Repositories;

use App\Models\Categoria;
use Illuminate\Database\Eloquent\Collection;

/**
 * Solo queries; sin lógica de negocio.
 *
 * @package App\Repositories
 */
class CategoriaRepository
{
    public function __construct(
        protected Categoria $model
    ) {}

    public function findCategoria(int $id): ?Categoria
    {
        return $this->model->newQuery()->find($id);
    }

    public function findPorNombre(string $nombre, ?int $exceptId = null): ?Categoria
    {
        $q = $this->model->newQuery()->where('nombre', $nombre);

        if ($exceptId !== null) {
            $q->where('id', '!=', $exceptId);
        }

        return $q->first();
    }

    public function findPorNombreExacto(string $nombre): ?Categoria
    {
        return $this->model->newQuery()->where('nombre', $nombre)->first();
    }

    /** @return Collection<int, Categoria> */
    public function getCategorias(?bool $activa = null): Collection
    {
        $q = $this->model->newQuery()->orderBy('nombre');

        if ($activa !== null) {
            $q->where('activa', $activa);
        }

        return $q->get();
    }

    public function tieneMovimientos(int $id): bool
    {
        return $this->model->newQuery()
            ->where('id', $id)
            ->whereHas('movimientos')
            ->exists();
    }

    public function create(array $datos): Categoria
    {
        return $this->model->newQuery()->create($datos);
    }

    public function update(Categoria $categoria, array $datos): Categoria
    {
        $categoria->update($datos);
        return $categoria;
    }

    public function delete(Categoria $categoria): void
    {
        $categoria->delete();
    }
}
