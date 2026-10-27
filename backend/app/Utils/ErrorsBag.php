<?php

namespace App\Utils;

use Illuminate\Support\MessageBag;
use Illuminate\Validation\ValidationException;

/**
 * Clase utilitaria para recolectar, gestionar y lanzar errores de validación.
 *
 * Esta clase permite:
 * - Agregar errores individuales por atributo.
 * - Verificar si hay errores.
 * - Obtener todos los errores acumulados.
 * - Fusionar errores desde otra fuente.
 * - Lanzar una excepción de validación cuando sea necesario.
 */
class ErrorsBag extends MessageBag
{
    /**
     * Lanza una excepción de validación si hay errores registrados.
     *
     * @param int $code Código HTTP para la respuesta de error (por defecto 422).
     * @return void
     *
     * @throws ValidationException Si hay errores acumulados.
     */
    public function throw(int $code = 422): void
    {
        if (!$this->isEmpty()) {
            throw ValidationException::withMessages($this->messages())->status($code);
        }
    }

    /**
     * Añade un único error y lanza inmediatamente la excepción de validación.
     *
     * Útil para validar rápidamente condiciones y detener ejecución con un error específico.
     *
     * @param string $atributo Nombre del campo o atributo que falló en la validación.
     * @param string $error Mensaje descriptivo del error.
     * @param int $code Código HTTP para la respuesta de error (por defecto 422).
     * @return void
     *
     * @throws ValidationException Siempre que se llama a este método (una vez agregado el error).
     */
    public function throwFast(string $atributo, string $error, int $code = 422): void
    {
        if (trim($atributo) === '' || trim($error) === '') {
            return;
        }
        $this->add($atributo, $error);
        $this->throw($code);
    }

    /**
     * Lanza una excepción de validación con un array de errores ya definidos.
     *
     * Este método es útil cuando ya tienes un arreglo asociativo de errores
     * y deseas convertirlos directamente en una excepción de validación.
     *
     * @param array $errors Un arreglo asociativo donde las claves son los atributos
     *                      y los valores son cadenas o arrays de mensajes de error.
     * @param int $code Código HTTP para la respuesta de error (por defecto 422).
     * @return void
     *
     * @throws ValidationException Si hay al menos un mensaje de error válido.
     */
    public static function throwErrors(array $errors, int $code = 422): void
    {
        $throwErrors = [];
        foreach ($errors as $attribute => $messages) {
            if (is_string($messages) && trim($messages) !== '') {
                $throwErrors[$attribute][] = $messages;
            } elseif (is_array($messages)) {
                foreach ($messages as $message) {
                    if (trim($message) !== ''){
                        $throwErrors[$attribute][] = $message;
                    }
                }
            }
        }

        if (!empty($throwErrors)) {
            throw ValidationException::withMessages($throwErrors)->status($code);
        }
    }
}
