<?php

namespace App\Utils;

use App\Utils\DebugLog;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use Throwable;

/**
 * Servicio centralizado para estructurar respuestas JSON uniformes en APIs RESTful.
 *
 * Este servicio proporciona métodos estandarizados para generar respuestas exitosas o con errores,
 * facilitando la consistencia en la comunicación entre cliente y servidor. Incluye soporte para:
 * - Respuestas de éxito con datos y mensajes opcionales.
 * - Errores generales y de validación.
 * - Manejo de excepciones con formato JSON y registro en logs.
 */
class ResponseUtils
{

    /**
     * Retorna una respuesta de éxito donde los datos (data) se fusionan directamente en la raíz.
     *
     * Útil cuando se requiere devolver una respuesta exitosa y campos personalizados.
     *
     * @param int $code Código HTTP de respuesta (por defecto 200).
     * @param array|null $data Datos que se fusionan en la respuesta principal.
     * @param string|null $message Mensaje descriptivo opcional.
     * @return JsonResponse Respuesta JSON con estructura: `success`, `message`, más campos dinámicos.
     */
    public function success(?array $data = null, ?string $message = null, int $code = 200): JsonResponse
    {
        $response = ['success' => true];

        if (is_string($message)) {
            $response['message'] = $message;
        }

        if (is_array($data)) {
            $response = array_merge($response, $data);
        }

        return response()->json($response, $code);
    }

    /**
     * Retorna una respuesta JSON de éxito con estructura predefinida.
     *
     * Solo se incluirá 'message' si tiene valor.
     *
     * @param int $code Código HTTP de respuesta (por defecto 200).
     * @param array|null $data Datos a incluir en el campo `data`.
     * @param string|null $message Mensaje descriptivo opcional.
     * @return JsonResponse Respuesta JSON con estructura: `success`, `message`, `data`.
     */
    public function successData(array $data, ?string $message = null, int $code = 200): JsonResponse
    {
        $response = ['success' => true];

        if (is_string($message)) {
            $response['message'] = $message;
        }

        $response['data'] = $data;

        return response()->json($response, $code);
    }

    /**
     * Retorna una respuesta JSON de error general.
     *
     * @param string $message Mensaje de error principal.
     * @param array $errors Arreglo con detalles adicionales del error.
     * @param int $code Código HTTP (por defecto 422).
     * @return JsonResponse Respuesta JSON con campos: `success`, `message`, `errors`.
     */
    public function error(string $message = 'Ocurrió un error', array $errors = [], int $code = 422): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ], $code);
    }

    /**
     * Retorna una respuesta JSON desde un validador con errores de formulario.
     *
     * @param Validator $validator Instancia del validador con errores.
     * @param string $message Mensaje descriptivo del error.
     * @param int $code Código HTTP (por defecto 422).
     * @return JsonResponse Respuesta con errores de validación.
     */
    public function errorFromValidator(Validator $validator, string $message = 'Error de validación de datos', int $code = 422): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $validator->fails() ? $validator->errors() : [],
        ], $code);
    }

    /**
     * Retorna una respuesta JSON basada en una excepción lanzada.
     *
     * Si es una excepción genérica (Exception), se registra (siempre) en log con detalles de mensaje, archivo y línea.
     * Si es una excepción de validación (ValidationException), se extraen automáticamente los errores.
     * El parámetro $writelog permite forzar o evitar el registro del error en logs (por defecto no se usa en Exception).
     *
     * @param \Illuminate\Validation\ValidationException|\Exception|\Throwable $e Excepción lanzada (validación o general).
     * @param string|null $message Mensaje personalizado (opcional, sobreescribe el mensaje original).
     * @param int|null $lineScript Línea del archivo donde ocurrió el error (para logs).
     * @param string|null $fileScript Archivo donde ocurrió el error (para logs).
     * @param bool|null $writelog Indica si se debe registrar el error ValidationException en los logs (opcional, por defecto false).
     * @return \Illuminate\Http\JsonResponse Respuesta JSON con estructura: `success`, `message`, `errors`.
     */
    public function errorFromException(
        Throwable $e,
        ?string $message = null,
        ?int $lineScript = null,
        ?string $fileScript = null,
        ?bool $writelog = false,
    ): JsonResponse {
        $code = $e->status ?? $e->getCode();
        $errors = [];

        if (($e instanceof Exception || $e instanceof Throwable) && !($e instanceof ValidationException)) {
            $code = 500;
            $message = $message ?? "Se produjo un error interno de servidor. Contacte a soporte si el problema persiste";

            $errors = [
                "Code"  => $e->getCode(),
                "File"  => $fileScript,
                "Linea" => $lineScript,
                "Error" => Str::limit($e->getMessage(), 150),
            ];
            DebugLog::error("Error exception", [$errors, $e->getMessage()]);
        } else {


            $errors = $e->errors();
            if ($writelog === true){
                DebugLog::error("Error validation", [$errors]);
            }
        }

        return response()->json([
            'success' => false,
            'message' => $message ?? $e->getMessage(),
            'errors'  => $errors,
        ], $code);
    }

	public function successDelete(?string $message = null, int $code = 204): JsonResponse
    {
        $response = ['success' => true];

        if (is_string($message)) {
            $response['message'] = $message;
        }

        return response()->json($response, $code);
    }
	
	// ---------------------------------------------------------------
    // Metodos deprecated — trasladados desde ApiResponser trait.
    // Mantienen la firma y comportamiento original para compatibilidad.
    // ---------------------------------------------------------------

    /**
     * @deprecated Usar ResponseUtils::success() en su lugar.
     *
     * @param string|array $data
     * @param int $code
     * @return JsonResponse
     */
    public static function deprecatedSuccessResponse($data, int $code = Response::HTTP_OK): JsonResponse
    {
        return response()->json([
            'success' => [
                'codigoRespuesta' => 1,
                'descripcionRespuesta' => $data,
            ],
            'codigo' => $code,
        ], $code, [
            'Access-Control-Allow-Origin'      => '*',
            'Access-Control-Allow-Methods'     => 'POST, GET, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Max-Age'           => '86400',
            'Access-Control-Allow-Headers'     => 'Content-Type, Authorization, X-Requested-With',
        ]);
    }

    /**
     * @deprecated Usar ResponseUtils::error() en su lugar.
     *
     * @param string $message
     * @param int $code
     * @param string $error
     * @return JsonResponse
     */
    public static function deprecatedErrorResponse(string $message, int $code, string $error = 'Error'): JsonResponse
    {
        return response()->json([
            'error' => [
                'codigoRespuesta' => 0,
                'descripcionRespuesta' => $error,
                'detalleRespuesta' => $message,
            ],
            'codigo' => $code,
            'mensaje' => $message,
        ], $code);
    }
}
