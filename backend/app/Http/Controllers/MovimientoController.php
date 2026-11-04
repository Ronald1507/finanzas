<?php

namespace App\Http\Controllers;

use App\Services\MovimientoService;
use App\Utils\ResponseUtils;
use App\Utils\ValidacionUtils;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para la gestión de movimientos (ingresos, egresos, transferencias).
 *
 * Valida las entradas con ValidacionUtils::validate() y delega
 * toda lógica de negocio a MovimientoService.
 *
 * @package App\Http\Controllers
 */
class MovimientoController extends Controller
{
    /**
     * @param MovimientoService $movimientoService
     * @param ResponseUtils     $response
     */
    public function __construct(
        protected MovimientoService $movimientoService,
        protected ResponseUtils $response,
    ) {}

    /**
     * Lista movimientos paginados con filtros.
     *
     * GET /api/movimientos?mes_id=&cuenta_id=&tipo=&categoria=&search=&page=&per_page=
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                [
                    'mes_id'      => 'required|integer|min:1',
                    'cuenta_id'   => 'nullable|integer|min:1|exists:cuentas,id',
                    'tipo'        => 'nullable|string|in:ingreso,egreso',
                    'categoria_id'=> 'nullable|integer|min:1|exists:categorias,id',
                    'search'      => 'nullable|string|max:255',
                    'page'        => 'nullable|integer|min:1',
                    'per_page'    => 'nullable|integer|min:1|max:100',
                ],
                $request->only(['mes_id', 'cuenta_id', 'tipo', 'categoria_id', 'search', 'page', 'per_page']),
                onlyRules: true
            );

            $data = $this->movimientoService->listarMovimientos($params);

            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Crea un movimiento.
     *
     * POST /api/movimientos
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'cuenta_id'   => 'required|integer|min:1|exists:cuentas,id',
                    'tipo'        => 'required|string|in:ingreso,egreso',
                    'monto'       => 'required|numeric|min:0.01',
                    'fecha'       => 'required|date|date_format:Y-m-d',
                    'descripcion' => 'required|string|max:500',
                    'observacion' => 'nullable|string|max:2000',
                    'categoria_id'=> 'nullable|integer|min:1|exists:categorias,id',
                ],
                $request->only(['cuenta_id', 'tipo', 'monto', 'fecha', 'descripcion', 'observacion', 'categoria_id']),
                onlyRules: true
            );

            $data = $this->movimientoService->crear($datos, $request->get('permisos', []));

            return $this->response->successData(['movimiento' => $data], 'Movimiento creado correctamente', 201);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Actualiza un movimiento.
     *
     * PUT /api/movimientos/{id}
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
                    'cuenta_id'   => 'nullable|integer|min:1|exists:cuentas,id',
                    'tipo'        => 'nullable|string|in:ingreso,egreso',
                    'monto'       => 'nullable|numeric|min:0.01',
                    'fecha'       => 'nullable|date|date_format:Y-m-d',
                    'descripcion' => 'nullable|string|max:500',
                    'observacion' => 'nullable|string|max:2000',
                    'categoria_id'=> 'nullable|integer|min:1|exists:categorias,id',
                ],
                $request->only(['cuenta_id', 'tipo', 'monto', 'fecha', 'descripcion', 'observacion', 'categoria_id']),
                onlyRules: true
            );

            $data = $this->movimientoService->editar($id, $datos, $request->get('permisos', []));

            return $this->response->successData(['movimiento' => $data]);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Elimina un movimiento.
     *
     * DELETE /api/movimientos/{id}
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->movimientoService->eliminar($id, $request->get('permisos', []));
            return $this->response->successDelete('Movimiento eliminado correctamente');
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Búsqueda global de movimientos (sin restricción de mes).
     *
     * GET /api/movimientos/buscar
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function buscar(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                [
                    'q'            => 'nullable|string|max:255',
                    'categoria_id' => 'nullable|integer|min:1|exists:categorias,id',
                    'tipo'         => 'nullable|string|in:ingreso,egreso',
                    'cuenta_id'    => 'nullable|integer|min:1|exists:cuentas,id',
                    'fecha_desde'  => 'nullable|date|date_format:Y-m-d',
                    'fecha_hasta'  => 'nullable|date|date_format:Y-m-d',
                    'page'         => 'nullable|integer|min:1',
                    'per_page'     => 'nullable|integer|min:1|max:100',
                ],
                $request->only(['q', 'categoria_id', 'tipo', 'cuenta_id', 'fecha_desde', 'fecha_hasta', 'page', 'per_page']),
                onlyRules: true
            );

            $data = $this->movimientoService->buscarGlobal($params);

            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Crea una transferencia entre dos cuentas.
     *
     * POST /api/movimientos/transferencia
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function transferencia(Request $request): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'cuenta_origen_id' => 'required|integer|min:1|exists:cuentas,id',
                    'cuenta_destino_id'=> 'required|integer|min:1|exists:cuentas,id',
                    'monto'            => 'required|numeric|min:0.01',
                    'fecha'            => 'required|date|date_format:Y-m-d',
                    'descripcion'      => 'nullable|string|max:500',
                ],
                $request->only(['cuenta_origen_id', 'cuenta_destino_id', 'monto', 'fecha', 'descripcion']),
                onlyRules: true
            );

            $data = $this->movimientoService->transferir($datos, $request->get('permisos', []));

            return $this->response->successData($data, 'Transferencia creada correctamente', 201);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }
}
