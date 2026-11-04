<?php

namespace App\Http\Controllers;

use App\Services\ReporteService;
use App\Utils\ResponseUtils;
use App\Utils\ValidacionUtils;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para los endpoints de reportería.
 *
 * @package App\Http\Controllers
 */
class ReporteController extends Controller
{
    public function __construct(
        protected ReporteService $reporteService,
        protected ResponseUtils  $response,
    ) {}

    /**
     * Resumen de ingresos/egresos del mes con distribución por categoría.
     *
     * GET /api/reportes/resumen-mensual?mes_id=X
     */
    public function resumenMensual(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                ['mes_id' => 'required|integer|min:1|exists:meses,id'],
                $request->only(['mes_id']),
                onlyRules: true
            );

            $data = $this->reporteService->resumenMensual((int) $params['mes_id']);

            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Evolución de saldos a lo largo de un año (12 items, null = mes no inicializado).
     *
     * GET /api/reportes/evolucion-anual?anio=X
     */
    public function evolucionAnual(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                ['anio' => 'required|integer|min:2000|max:2100'],
                $request->only(['anio']),
                onlyRules: true
            );

            $data = $this->reporteService->evolucionAnual((int) $params['anio']);

            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Distribución de gastos por categoría en un mes o en todo un año.
     *
     * GET /api/reportes/gastos-categoria?anio=X&mes_id=X
     */
    public function gastosPorCategoria(Request $request): JsonResponse
    {
        try {
            $params = ValidacionUtils::validate(
                [
                    'anio'   => 'required|integer|min:2000|max:2100',
                    'mes_id' => 'nullable|integer|min:1|exists:meses,id',
                ],
                $request->only(['anio', 'mes_id']),
                onlyRules: true
            );

            $data = $this->reporteService->gastosPorCategoria(
                (int) $params['anio'],
                isset($params['mes_id']) ? (int) $params['mes_id'] : null
            );

            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }
}
