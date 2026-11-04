<?php

namespace App\Services;

use App\Repositories\CategoriaRepository;
use App\Utils\ErrorsBag;

/**
 * Reglas de negocio:
 * - nombre único (global, no solo entre activas)
 * - no se elimina físicamente si tiene movimientos → se desactiva
 * - se elimina físicamente si no tiene movimientos
 *
 * @package App\Services
 */
class CategoriaService
{
    public function __construct(
        protected CategoriaRepository $categoriaRepo,
        protected ErrorsBag $errors,
    ) {}

    /** @return array<int, mixed> */
    public function listar(?bool $activa = null): array
    {
        return $this->categoriaRepo->getCategorias($activa)->toArray();
    }

    /** @return array<string, mixed> */
    public function crear(array $datos): array
    {
        if ($this->categoriaRepo->findPorNombre($datos['nombre']) !== null) {
            $this->errors->throwFast('nombre', 'Ya existe una categoría con ese nombre', 422);
        }

        $categoria = $this->categoriaRepo->create([
            'nombre' => $datos['nombre'],
            'color'  => $datos['color'] ?? null,
            'activa' => true,
        ]);

        return $categoria->toArray();
    }

    /** @return array<string, mixed> */
    public function editar(int $id, array $datos): array
    {
        $categoria = $this->categoriaRepo->findCategoria($id);
        if ($categoria === null) {
            $this->errors->throwFast('id', 'Categoría no encontrada', 404);
        }

        if (isset($datos['nombre']) && $datos['nombre'] !== $categoria->nombre) {
            if ($this->categoriaRepo->findPorNombre($datos['nombre'], $id) !== null) {
                $this->errors->throwFast('nombre', 'Ya existe una categoría con ese nombre', 422);
            }
        }

        $this->categoriaRepo->update($categoria, array_filter([
            'nombre' => $datos['nombre'] ?? $categoria->nombre,
            'color'  => array_key_exists('color', $datos) ? $datos['color'] : $categoria->color,
            'activa' => $datos['activa'] ?? $categoria->activa,
        ], fn($v) => $v !== null || array_key_exists('color', $datos)));

        return $categoria->fresh()->toArray();
    }

    /**
     * Elimina la categoría si no tiene movimientos; la desactiva si los tiene.
     *
     * @return array{eliminada: bool, desactivada: bool}
     */
    public function eliminar(int $id): array
    {
        $categoria = $this->categoriaRepo->findCategoria($id);
        if ($categoria === null) {
            $this->errors->throwFast('id', 'Categoría no encontrada', 404);
        }

        if ($this->categoriaRepo->tieneMovimientos($id)) {
            $this->categoriaRepo->update($categoria, ['activa' => false]);
            return ['eliminada' => false, 'desactivada' => true];
        }

        $this->categoriaRepo->delete($categoria);
        return ['eliminada' => true, 'desactivada' => false];
    }
}
