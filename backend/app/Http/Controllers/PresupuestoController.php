<?php

namespace App\Http\Controllers;

use App\Services\PresupuestoService;
use App\Utils\ResponseUtils;
use App\Utils\ValidacionUtils;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para la gestión de presupuestos mensuales por categoría.
 *
 * @package App\Http\Controllers
 */
class PresupuestoController extends Controller
{
    public function __construct(
        protected PresupuestoService $presupuestoService,
        protected ResponseUtils      $response,
    ) {}

    /**
     * Lista presupuestos de un mes con ejecutado calculado.
     *
     * GET /api/presupuestos?mes_id=X
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                ['mes_id' => 'required|integer|min:1'],
                $request->only(['mes_id']),
                onlyRules: true
            );

            $data = $this->presupuestoService->listarConEjecutado((int) $params['mes_id']);

            return $this->response->successData(['data' => $data]);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Crea un presupuesto.
     *
     * POST /api/presupuestos
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'categoria_id' => 'required|integer|min:1|exists:categorias,id',
                    'mes_id'       => 'required|integer|min:1|exists:meses,id',
                    'monto_limite' => 'required|numeric|min:0.01',
                ],
                $request->only(['categoria_id', 'mes_id', 'monto_limite']),
                onlyRules: true
            );

            $data = $this->presupuestoService->crear($datos, $request->get('permisos', []));

            return $this->response->successData(['presupuesto' => $data], 'Presupuesto creado correctamente', 201);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Actualiza un presupuesto.
     *
     * PUT /api/presupuestos/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'categoria_id' => 'nullable|integer|min:1|exists:categorias,id',
                    'monto_limite' => 'nullable|numeric|min:0.01',
                ],
                $request->only(['categoria_id', 'monto_limite']),
                onlyRules: true
            );

            $data = $this->presupuestoService->editar($id, $datos, $request->get('permisos', []));

            return $this->response->successData(['presupuesto' => $data]);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Elimina un presupuesto.
     *
     * DELETE /api/presupuestos/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->presupuestoService->eliminar($id, $request->get('permisos', []));
            return $this->response->successDelete('Presupuesto eliminado correctamente');
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }
}
