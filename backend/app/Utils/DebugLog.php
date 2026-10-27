<?php

namespace App\Utils;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

/**
 * Class DebugLog
 *
 * Esta clase permite registrar mensajes de log en Laravel,
 * filtrando según el nivel del mensaje, el modo `APP_DEBUG`
 * y un parámetro opcional `$force`.
 *
 * Uso:
 * ```
 * use DebugLog;
 *
 * DebugLog::debug('Mensaje debug'); // Solo en debug
 * DebugLog::info('Mensaje info', [], true); // Fuerza el registro
 * DebugLog::error('Error crítico'); // Siempre se registra
 * ```
 *
 * @method static void debug(string $message, array $context = [], bool $force = false)
 * @method static void info(string $message, array $context = [], bool $force = false)
 * @method static void notice(string $message, array $context = [], bool $force = false)
 * @method static void warning(string $message, array $context = [], bool $force = false)
 * @method static void error(string $message, array $context = [], bool $force = false)
 * @method static void critical(string $message, array $context = [], bool $force = false)
 * @method static void alert(string $message, array $context = [], bool $force = false)
 * @method static void emergency(string $message, array $context = [], bool $force = false)
 */
class DebugLog
{
    /**
     * Maneja llamadas dinámicas a métodos estáticos.
     *
     * @param string $method Nombre del método (ej: 'info', 'error')
     * @param array $arguments Lista de argumentos pasados al método.
     *                         Formato esperado:
     *                         - $arguments[0] = mensaje (string)
     *                         - $arguments[1] = contexto (array, opcional)
     *                         - $arguments[2] = $force (bool, opcional)
     * @return void
     */
    public static function __callStatic($method, $arguments)
    {
        // Definir los niveles de log
        $alwaysLogLevels = ['error', 'critical', 'alert', 'emergency'];
        $conditionalLogLevels = ['debug', 'info', 'notice', 'warning'];

        $level = strtolower($method);

        // Extraer mensaje, contexto y $force
        $message = $arguments[0] ?? '';

        $context = [];
        if (isset($arguments[1])) {
            $context = is_array($arguments[1]) ? $arguments[1] : [];
        }

        $force = false;
        if (isset($arguments[2])) {
            $force = (bool) $arguments[2];
        }

        // Si es un nivel que siempre se loguea
        if (in_array($level, $alwaysLogLevels)) {
            Log::$level($message, $context); // ← sin withContext()
        } elseif (in_array($level, $conditionalLogLevels)) {
            if (Config::get('app.debug') || $force) {
                Log::$level($message, $context); // ← sin withContext()
            }
        }
    }
}
