<?php

namespace App\Http\Controllers;

use App\Services\PendienteService;
use App\Utils\ResponseUtils;
use App\Utils\ValidacionUtils;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para la gestión de pendientes (cuentas por pagar/recibir).
 *
 * Valida las entradas con ValidacionUtils::validate() y delega
 * toda lógica de negocio a PendienteService.
 *
 * @package App\Http\Controllers
 */
class PendienteController extends Controller
{
    /**
     * @param PendienteService $pendienteService
     * @param ResponseUtils    $response
     */
    public function __construct(
        protected PendienteService $pendienteService,
        protected ResponseUtils $response,
    ) {}

    /**
     * Lista pendientes de un mes con filtros y paginación.
     *
     * GET /api/pendientes?mes_id=&tipo=&estado=&page=&per_page=
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                [
                    'mes_id'   => 'required|integer|min:1',
                    'tipo'     => 'nullable|string|in:por_pagar,por_recibir',
                    'estado'   => 'nullable|string|in:pendiente,realizado,anulado',
                    'page'     => 'nullable|integer|min:1',
                    'per_page' => 'nullable|integer|min:1|max:100',
                ],
                $request->only(['mes_id', 'tipo', 'estado', 'page', 'per_page']),
                onlyRules: true
            );

            $data = $this->pendienteService->listarPorMes($params);

            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Crea un pendiente en el mes abierto.
     *
     * POST /api/pendientes
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'cuenta_id'      => 'required|integer|min:1|exists:cuentas,id',
                    'tipo'           => 'required|string|in:por_pagar,por_recibir',
                    'monto'          => 'required|numeric|min:0.01',
                    'descripcion'    => 'required|string|max:500',
                    'fecha_estimada' => 'required|date|date_format:Y-m-d',
                ],
                $request->only(['cuenta_id', 'tipo', 'monto', 'descripcion', 'fecha_estimada']),
                onlyRules: true
            );

            $data = $this->pendienteService->crear($datos, $request->get('permisos', []));

            return $this->response->successData(['pendiente' => $data], 'Pendiente creado correctamente', 201);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Actualiza un pendiente.
     *
     * PUT /api/pendientes/{id}
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'cuenta_id'      => 'nullable|integer|min:1|exists:cuentas,id',
                    'tipo'           => 'nullable|string|in:por_pagar,por_recibir',
                    'monto'          => 'nullable|numeric|min:0.01',
                    'descripcion'    => 'nullable|string|max:500',
                    'fecha_estimada' => 'nullable|date|date_format:Y-m-d',
                ],
                $request->only(['cuenta_id', 'tipo', 'monto', 'descripcion', 'fecha_estimada']),
                onlyRules: true
            );

            $data = $this->pendienteService->editar($id, $datos, $request->get('permisos', []));

            return $this->response->successData(['pendiente' => $data]);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Concreta un pendiente generando el movimiento real.
     *
     * POST /api/pendientes/{id}/concretar
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function concretar(Request $request, int $id): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                ['fecha' => 'required|date|date_format:Y-m-d'],
                $request->only(['fecha']),
                onlyRules: true
            );

            $data = $this->pendienteService->concretar($id, $datos['fecha'], $request->get('permisos', []));

            return $this->response->successData(['pendiente' => $data], 'Pendiente concretado correctamente');
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Anula un pendiente.
     *
     * POST /api/pendientes/{id}/anular
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function anular(Request $request, int $id): JsonResponse
    {
        try {
            $data = $this->pendienteService->anular($id, $request->get('permisos', []));
            return $this->response->successData(['pendiente' => $data], 'Pendiente anulado correctamente');
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }
}
