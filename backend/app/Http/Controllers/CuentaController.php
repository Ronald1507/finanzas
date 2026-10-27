<?php

namespace App\Http\Controllers;

use App\Services\CuentaService;
use App\Utils\ResponseUtils;
use App\Utils\ValidacionUtils;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para la gestión de cuentas bancarias.
 *
 * Valida las entradas con ValidacionUtils::validate() y delega
 * toda lógica de negocio a CuentaService.
 *
 * @package App\Http\Controllers
 */
class CuentaController extends Controller
{
    /**
     * @param CuentaService $cuentaService
     * @param ResponseUtils $response
     */
    public function __construct(
        protected CuentaService $cuentaService,
        protected ResponseUtils $response,
    ) {}

    /**
     * Lista cuentas con filtro opcional de activa.
     *
     * GET /api/cuentas?activa=1|0
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                ['activa' => 'nullable|boolean'],
                $request->only(['activa']),
                onlyRules: true
            );

            $activa = isset($params['activa']) ? (bool) $params['activa'] : null;
            $data   = $this->cuentaService->listarCuentas($activa);

            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Muestra una cuenta por ID.
     *
     * GET /api/cuentas/{id}
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $data = $this->cuentaService->obtenerCuenta($id);
            return $this->response->successData(['cuenta' => $data]);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Crea una nueva cuenta.
     *
     * POST /api/cuentas
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                [
                    'nombre'        => 'required|string|max:255',
                    'banco'         => 'nullable|string|max:255',
                    'tipo'          => 'required|string|in:corriente,vista,ahorro,credito,efectivo',
                    'saldo_inicial' => 'required|numeric|min:0',
                ],
                $request->only(['nombre', 'banco', 'tipo', 'saldo_inicial']),
                onlyRules: true
            );

            $data = $this->cuentaService->crear($datos, $request->get('permisos', []));

            return $this->response->successData(['cuenta' => $data], 'Cuenta creada correctamente', 201);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Actualiza datos básicos de una cuenta (nombre, banco, tipo).
     *
     * PUT /api/cuentas/{id}
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
                    'nombre' => 'nullable|string|max:255',
                    'banco'  => 'nullable|string|max:255',
                    'tipo'   => 'nullable|string|in:corriente,vista,ahorro,credito,efectivo',
                ],
                $request->only(['nombre', 'banco', 'tipo']),
                onlyRules: true
            );

            $data = $this->cuentaService->editar($id, $datos, $request->get('permisos', []));

            return $this->response->successData(['cuenta' => $data]);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Corrige el saldo inicial de una cuenta en el mes abierto.
     *
     * PUT /api/cuentas/{id}/saldo-inicial
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function actualizarSaldoInicial(Request $request, int $id): JsonResponse
    {
        try {
            $datos = ValidacionUtils::validate(
                ['saldo_inicial' => 'required|numeric|min:0'],
                $request->only(['saldo_inicial']),
                onlyRules: true
            );

            $data = $this->cuentaService->corregirSaldoInicial(
                $id,
                (float) $datos['saldo_inicial'],
                $request->get('permisos', [])
            );

            return $this->response->successData(['cuenta_mes' => $data]);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Desactiva una cuenta.
     *
     * POST /api/cuentas/{id}/desactivar
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function desactivar(Request $request, int $id): JsonResponse
    {
        try {
            $data = $this->cuentaService->desactivar($id, $request->get('permisos', []));
            return $this->response->successData(['cuenta' => $data]);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }
}
