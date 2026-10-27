<?php

namespace App\Repositories;

use App\Models\Cuenta;
use Illuminate\Database\Eloquent\Collection;

/**
 * Repositorio para la entidad Cuenta.
 *
 * Solo queries; sin lógica de negocio ni transacciones.
 *
 * @package App\Repositories
 */
class CuentaRepository
{
    /**
     * @param Cuenta $model
     */
    public function __construct(
        protected Cuenta $model
    ) {}

    /**
     * Busca una cuenta por ID.
     *
     * @param int $id
     * @return Cuenta|null
     */
    public function findCuenta(int $id): ?Cuenta
    {
        return $this->model->newQuery()->find($id);
    }

    /**
     * Busca una cuenta activa por nombre (para validar unicidad).
     *
     * @param string   $nombre
     * @param int|null $exceptId ID a excluir (para edición)
     * @return Cuenta|null
     */
    public function findCuentaActivaPorNombre(string $nombre, ?int $exceptId = null): ?Cuenta
    {
        $query = $this->model->newQuery()
            ->where('nombre', $nombre)
            ->where('activa', true);

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->first();
    }

    /**
     * Retorna todas las cuentas, con filtro opcional por activa.
     *
     * @param bool|null $activa
     * @return Collection<int, Cuenta>
     */
    public function getCuentas(?bool $activa = null): Collection
    {
        $query = $this->model->newQuery()->orderBy('nombre');

        if ($activa !== null) {
            $query->where('activa', $activa);
        }

        return $query->get();
    }

    /**
     * Retorna solo las cuentas activas.
     *
     * @return Collection<int, Cuenta>
     */
    public function getCuentasActivas(): Collection
    {
        return $this->model->newQuery()
            ->where('activa', true)
            ->orderBy('nombre')
            ->get();
    }

    /**
     * Crea una nueva cuenta.
     *
     * @param array<string, mixed> $datos
     * @return Cuenta
     */
    public function create(array $datos): Cuenta
    {
        return $this->model->newQuery()->create($datos);
    }

    /**
     * Actualiza una cuenta existente.
     *
     * @param Cuenta $cuenta
     * @param array<string, mixed> $datos
     * @return Cuenta
     */
    public function update(Cuenta $cuenta, array $datos): Cuenta
    {
        $cuenta->update($datos);
        return $cuenta;
    }
}
