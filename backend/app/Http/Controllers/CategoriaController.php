<?php

namespace App\Http\Controllers;

use App\Services\CategoriaService;
use App\Utils\ResponseUtils;
use App\Utils\ValidacionUtils;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET  /api/categorias          → index
 * POST /api/categorias          → store
 * PUT  /api/categorias/{id}     → update
 * DELETE /api/categorias/{id}   → destroy
 *
 * @package App\Http\Controllers
 */
class CategoriaController extends Controller
{
    public function __construct(
        protected CategoriaService $categoriaService,
        protected ResponseUtils $response,
    ) {}

    /**
     * GET /api/categorias?activa=true|false|all
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                ['activa' => 'nullable|string|in:true,false,all'],
                $request->only(['activa']),
                onlyRules: true
            );

            $activa = match ($params['activa'] ?? 'all') {
                'true'  => true,
                'false' => false,
                default => null,
            };

            return $this->response->successData($this->categoriaService->listar($activa));
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'nombre' => 'required|string|max:100',
                    'color'  => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                ],
                $request->only(['nombre', 'color']),
                onlyRules: true
            );

            $data = $this->categoriaService->crear($datos);
            return $this->response->successData(['categoria' => $data], 'Categoría creada correctamente', 201);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'nombre' => 'nullable|string|max:100',
                    'color'  => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                    'activa' => 'nullable|boolean',
                ],
                $request->only(['nombre', 'color', 'activa']),
                onlyRules: true
            );

            $data = $this->categoriaService->editar($id, $datos);
            return $this->response->successData(['categoria' => $data]);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $result = $this->categoriaService->eliminar($id);

            $msg = $result['eliminada']
                ? 'Categoría eliminada correctamente'
                : 'La categoría tiene movimientos asociados y fue desactivada';

            return $this->response->successData($result, $msg);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }
}
