<?php

namespace App\Http\Controllers;

use App\Services\GastoFijoService;
use App\Utils\ResponseUtils;
use App\Utils\ValidacionUtils;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para la gestión de gastos fijos (catálogo y pago mensual).
 *
 * Valida las entradas con ValidacionUtils::validate() y delega
 * toda lógica de negocio a GastoFijoService.
 *
 * @package App\Http\Controllers
 */
class GastoFijoController extends Controller
{
    /**
     * @param GastoFijoService $gastoFijoService
     * @param ResponseUtils    $response
     */
    public function __construct(
        protected GastoFijoService $gastoFijoService,
        protected ResponseUtils $response,
    ) {}

    /**
     * Lista el catálogo de gastos fijos paginado con filtros.
     *
     * GET /api/gastos-fijos?search=&activo=&page=&per_page=
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                [
                    'search'   => 'nullable|string|max:255',
                    'activo'   => 'nullable|boolean',
                    'page'     => 'nullable|integer|min:1',
                    'per_page' => 'nullable|integer|min:1|max:100',
                ],
                $request->only(['search', 'activo', 'page', 'per_page']),
                onlyRules: true
            );

            $data = $this->gastoFijoService->listar($params);

            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Crea un gasto fijo en el catálogo.
     *
     * POST /api/gastos-fijos
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'nombre'         => 'required|string|max:255',
                    'categoria'      => 'nullable|string|max:255',
                    'cuenta_id'      => 'nullable|integer|exists:cuentas,id',
                    'monto_estimado' => 'nullable|numeric|min:0',
                    'activo'         => 'nullable|boolean',
                ],
                $request->only(['nombre', 'categoria', 'cuenta_id', 'monto_estimado', 'activo']),
                onlyRules: true
            );

            $data = $this->gastoFijoService->crear($datos, $request->get('permisos', []));

            return $this->response->successData(['gasto_fijo' => $data], 'Gasto fijo creado correctamente', 201);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Actualiza un gasto fijo.
     *
     * PUT /api/gastos-fijos/{id}
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
                    'nombre'         => 'nullable|string|max:255',
                    'categoria'      => 'nullable|string|max:255',
                    'cuenta_id'      => 'nullable|integer|exists:cuentas,id',
                    'monto_estimado' => 'nullable|numeric|min:0',
                    'activo'         => 'nullable|boolean',
                ],
                $request->only(['nombre', 'categoria', 'cuenta_id', 'monto_estimado', 'activo']),
                onlyRules: true
            );

            $data = $this->gastoFijoService->editar($id, $datos, $request->get('permisos', []));

            return $this->response->successData(['gasto_fijo' => $data]);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Desactiva un gasto fijo.
     *
     * POST /api/gastos-fijos/{id}/desactivar
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function desactivar(Request $request, int $id): JsonResponse
    {
        try {
            $this->gastoFijoService->desactivar($id, $request->get('permisos', []));
            return $this->response->successDelete('Gasto fijo desactivado correctamente');
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Lista los gastos fijos activos con su estado de pago en un mes.
     *
     * GET /api/gastos-fijos/mes/{mesId}
     *
     * @param Request $request
     * @param int     $mesId
     * @return JsonResponse
     */
    public function indexPorMes(Request $request, int $mesId): JsonResponse
    {
        try {
            $data = $this->gastoFijoService->listarPorMes($mesId);
            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Registra el pago de un gasto fijo (genera el egreso vinculado).
     *
     * POST /api/gastos-fijos/{id}/pagar
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function pagar(Request $request, int $id): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'monto'     => 'required|numeric|min:0.01',
                    'fecha'     => 'required|date|date_format:Y-m-d',
                    'cuenta_id' => 'required|integer|exists:cuentas,id',
                ],
                $request->only(['monto', 'fecha', 'cuenta_id']),
                onlyRules: true
            );

            $data = $this->gastoFijoService->registrarPago($id, $datos, $request->get('permisos', []));

            return $this->response->successData(['movimiento' => $data], 'Pago registrado correctamente', 201);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Deshace el pago de un gasto fijo en un mes (elimina el egreso).
     *
     * DELETE /api/gastos-fijos/{id}/pago/{mesId}
     *
     * @param Request $request
     * @param int     $id
     * @param int     $mesId
     * @return JsonResponse
     */
    public function deshacerPago(Request $request, int $id, int $mesId): JsonResponse
    {
        try {
            $this->gastoFijoService->deshacerPago($id, $mesId, $request->get('permisos', []));
            return $this->response->successDelete('Pago deshecho correctamente');
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }
}
