<?php

namespace App\Repositories;

use App\Models\Mes;
use Illuminate\Database\Eloquent\Collection;

/**
 * Repositorio para la entidad Mes.
 *
 * Solo queries; sin lógica de negocio ni transacciones.
 *
 * @package App\Repositories
 */
class MesRepository
{
    /**
     * @param Mes $model
     */
    public function __construct(
        protected Mes $model
    ) {}

    /**
     * Busca un mes por ID.
     *
     * @param int $id
     * @return Mes|null
     */
    public function findMes(int $id): ?Mes
    {
        return $this->model->newQuery()->find($id);
    }

    /**
     * Retorna el mes con el id mayor (el más reciente en la secuencia).
     *
     * @return Mes|null
     */
    public function findUltimoMes(): ?Mes
    {
        return $this->model->newQuery()->orderByDesc('anio')->orderByDesc('mes')->first();
    }

    /**
     * Busca un mes por año y número de mes.
     *
     * @param int $anio
     * @param int $mes
     * @return Mes|null
     */
    public function findMesPorAnioMes(int $anio, int $mes): ?Mes
    {
        return $this->model->newQuery()
            ->where('anio', $anio)
            ->where('mes', $mes)
            ->first();
    }

    /**
     * Retorna el mes en estado 'abierto' (debe existir exactamente uno).
     *
     * @return Mes|null
     */
    public function findMesAbierto(): ?Mes
    {
        return $this->model->newQuery()
            ->where('estado', 'abierto')
            ->first();
    }

    /**
     * Retorna todos los meses ordenados cronológicamente.
     *
     * @return Collection<int, Mes>
     */
    public function getMeses(): Collection
    {
        return $this->model->newQuery()
            ->orderBy('anio')
            ->orderBy('mes')
            ->get();
    }

    /**
     * Crea un nuevo registro de mes.
     *
     * @param array<string, mixed> $datos
     * @return Mes
     */
    public function create(array $datos): Mes
    {
        return $this->model->newQuery()->create($datos);
    }

    /**
     * Actualiza un mes existente.
     *
     * @param Mes   $mes
     * @param array<string, mixed> $datos
     * @return Mes
     */
    public function update(Mes $mes, array $datos): Mes
    {
        $mes->update($datos);
        return $mes;
    }

    /**
     * Elimina un mes.
     *
     * @param Mes $mes
     * @return void
     */
    public function delete(Mes $mes): void
    {
        $mes->delete();
    }
}
