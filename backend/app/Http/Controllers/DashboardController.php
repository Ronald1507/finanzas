<?php

namespace App\Http\Controllers;

use App\Services\PresupuestoService;
use App\Services\SaldoService;
use App\Utils\ResponseUtils;
use App\Utils\ValidacionUtils;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para el dashboard de saldos.
 *
 * Retorna el estado de saldos de un mes: consolidado y desglose por cuenta.
 * Si el mes no existe, retorna mes: null para que el frontend ofrezca el cierre previo.
 *
 * @package App\Http\Controllers
 */
class DashboardController extends Controller
{
    public function __construct(
        protected SaldoService       $saldoService,
        protected PresupuestoService $presupuestoService,
        protected ResponseUtils      $response,
    ) {}

    /**
     * Retorna los saldos del mes indicado, incluyendo presupuestos con ejecutado.
     *
     * GET /api/dashboard?anio=&mes=
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                [
                    'anio' => 'required|integer|min:2000|max:2100',
                    'mes'  => 'required|integer|min:1|max:12',
                ],
                $request->only(['anio', 'mes']),
                onlyRules: true
            );

            $data = $this->saldoService->getDashboard((int) $params['anio'], (int) $params['mes']);

            if ($data['mes'] !== null) {
                $data['presupuestos'] = $this->presupuestoService->listarConEjecutado($data['mes']['id']);
            }

            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }
}
