<?php

namespace App\Http\Controllers;

use App\Services\MesService;
use App\Utils\ResponseUtils;
use App\Utils\ValidacionUtils;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para el ciclo de vida de los meses (cierre y reapertura).
 *
 * Valida las entradas con ValidacionUtils::validate() y delega
 * toda lógica de negocio a MesService.
 *
 * @package App\Http\Controllers
 */
class MesController extends Controller
{
    /**
     * @param MesService    $mesService
     * @param ResponseUtils $response
     */
    public function __construct(
        protected MesService    $mesService,
        protected ResponseUtils $response,
    ) {}

    /**
     * Lista todos los meses.
     *
     * GET /api/meses
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $data = $this->mesService->listarMeses();
            return $this->response->successData($data);
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Cierra el mes indicado (debe ser el mes abierto).
     *
     * POST /api/meses/{id}/cerrar
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function cerrar(Request $request, int $id): JsonResponse
    {
        try {
            $data = $this->mesService->cerrar($id, $request->get('permisos', []));
            return $this->response->successData(['mes' => $data], 'Mes cerrado correctamente');
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }

    /**
     * Reabre el último mes cerrado (si el mes siguiente está intacto).
     *
     * POST /api/meses/{id}/reabrir
     *
     * @param Request $request
     * @param int     $id
     * @return JsonResponse
     */
    public function reabrir(Request $request, int $id): JsonResponse
    {
        try {
            $data = $this->mesService->reabrir($id, $request->get('permisos', []));
            return $this->response->successData(['mes' => $data], 'Mes reabierto correctamente');
        } catch (\Throwable $e) {
            return $this->response->errorFromException($e, null, __LINE__, __FILE__);
        }
    }
}
