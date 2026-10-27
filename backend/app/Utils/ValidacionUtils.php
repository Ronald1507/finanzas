<?php

namespace App\Utils;

use App\Utils\ErrorsBag;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Validator as ValidationValidator;

/**
 * Clase de servicio para centralizar reglas de validación y mensajes.
 *
 * Este servicio permite obtener reglas de validación dinámicas,
 * mensajes personalizados y crear validadores listos para usar.
 */
class ValidacionUtils
{
    /**
     * Mensajes de error asociados a cada campo.
     *
     * @var array<string, string>
     */
    protected static $messages = [
        'rut' => [
            'regex' => 'El RUT debe tener formato 99999999',
            'between' => 'El RUT debe estar entre 1000000 y 100000000',
        ],
        'dv' => [
            'regex' => 'El dígito verificador debe ser un número del 0-9 o K.',
        ],
        'rutdv' => [
            'regex' => 'El rut debe ser válido y tener el formato 9999999-k o 99999999-K.',
            'modulo11' => 'El RUT no es un rut válido chileno',
        ],
        'ip' => [
            'regex' => 'La dirección IP no tiene un formato válido.',
        ],
        'mac' => [
            'regex' => 'La dirección MAC debe tener un formato válido (ej. 00:00:00:00:00:00).',
        ],
        'numerico' => [
            'integer' => 'Debe ser un valor numérico entero.',
        ],
        'alfanumerico' => [
            'regex' => 'Debe ser un valor alfanumérico (letras y números sin espacios ni símbolos).',
        ],
        'version' => [
            'regex' => 'Versión debe tener el formato vX.Y.Z (ej. v1.0.0).',
        ],
        'email' => [
            'regex' => 'Debe ser un correo electrónico válido.',
        ],
        'password' => [
            'regex' => 'La contraseña debe tener al menos 8 caracteres, incluir letras mayúsculas, minúsculas, números y símbolos.',
        ],
        'telefono' => [
            'regex' => 'Debe estar en formato chileno válido (+56912345678).',
        ],
        'url' => [
            'regex' => 'Debe ser una URL válido.',
        ],
        'fecha' => [
            'regex' => 'Debe ser una fecha válida en formato YYYY-MM-DD.',
        ],
        'fecha_hora' => [
            'regex' => 'Debe ser una fecha y hora válida en formato YYYY-MM-DD HH:MM:SS.',
        ],
        'boolean' => [
            'regex' => 'Debe ser un valor booleano (true o false).',
        ],
        'imagen' => [
            'regex' => 'Debe ser una imagen válida (jpg, png, gif, svg) y menor a 2MB.',
        ],
        'nombre' => [
            'regex' => '#field# sólo puede contener letras y espacios.',
        ],
        'texto' => [
            'regex' => 'Debe ser texto válido y no exceder los 5000 caracteres.',
        ],
        'hora_minuto' => [
            'regex' => 'Debe estar en formato HH:MM (ej. 09:30).',
        ],
        'hora_segundo' => [
            'regex' => 'Debe estar en formato HH:MM:SS (ej. 09:30:45).',
        ],
        'pasaporte' => [
            'regex' => 'Debe contener entre 3 y 20 caracteres alfanuméricos.',
        ],
        'patente' => [
            'regex' => 'La patente ingresada no es válida. Formatos aceptados: AB-1234 (antigua) o ABCD-12 (nueva).',
        ],
        'latitud' => [

            'between' => 'La latitud debe estar entre -90 y 90 grados.',
        ],
        'longitud' => [
            'between' => 'La longitud debe estar entre -180 y 180 grados.',
        ],
        'uuid' => [
            'uuid' => 'El valor ingresado no es un UUID válido.',
        ],
        'hash_md5' => [
            'regex' => 'El hash MD5 debe tener 32 caracteres hexadecimales.',
        ],
        'hash_sha256' => [
            'regex' => 'El hash SHA-256 debe tener 64 caracteres hexadecimales.',
        ],
        'hash_sha1' => [
            'regex' => 'El hash SHA-1 debe tener 40 caracteres hexadecimales.',
        ],
    ];

    protected static $customMessages = [];


    public function __construct()
    {
        // Fusiona los mensajes personalizados con los del padre
        foreach (self::$customMessages as $key => $value) {
            self::$messages[$key] = $value;
        }
    }

    /**
     * Aplica un mensaje personalizado para un campo.
     *
     * Si se proporciona un array, asigna mensajes por cada regla específica (e.g., required, regex).
     * Si se proporciona un string, lo asigna como mensaje general del campo.
     *
     * @param string $field Nombre del campo (ej: 'rut', 'email').
     * @param string|array|null $customMessage Mensaje personalizado.
     * @return void
     */
    protected static function applyCustomMessage(string $field, string|array |null $customMessage): void
    {
        if ($customMessage === null) {
            return;
        }

        if (is_array($customMessage)) {
            foreach ($customMessage as $rule => $msg) {
                self::$messages["{$field}.{$rule}"] = $msg;
            }
        }
        elseif (is_string($customMessage)) {
            self::$messages[$field] = $customMessage;
        }
    }

    /**
     * Crea y devuelve un validador con sus respectivos mensajes (si existen),
     * sino deja que Laravel use sus mensajes por defecto.
     *
     * @param array $rules Array asociativo ['campo' => 'regla']
     * @param array $data Datos a validar (normalmente $request->all())
     * @return \Illuminate\Validation\Validator
     */
    public static function makeValidator(array $rules, array $data): ValidationValidator
    {
        $messages = [];

        foreach ($rules as $field => $rule) {
            $fieldMessages = self::getFieldMessage($field);

            if (is_array($fieldMessages)) {
                foreach ($fieldMessages as $key => $msg) {
                    $messages[$key] = $msg;
                }
            }
            elseif (is_string($fieldMessages) && !str_starts_with($fieldMessages, "Mensaje no definido")) {
                $messages["{$field}.*"] = $fieldMessages;
            }
        }

        return Validator::make($data, $rules, $messages);
    }

    /**
     * Valida los datos proporcionados según las reglas especificadas.
     *
     * Este método realiza una validación utilizando las reglas definidas en el arreglo `$rules`.
     * Si algún campo no cumple con las reglas, se lanzará una excepción de validación con los mensajes
     * personalizados definidos mediante `getFieldMessage`, si están disponibles.
     *
     * @param array $rules Reglas de validación en formato compatible con Laravel Validator.
     * @param array $data Datos a validar.
     * @param array|null $customMessages Mensajes personalizados para errores de validación (opcional).
     * @param int $code Código HTTP a devolver en caso de error de validación. Por defecto 422.
     * @param bool $onlyRules Indica si solo se deben devolver los campos definidos en las reglas de validación.
     *
     * @throws \Illuminate\Validation\ValidationException Si la validación falla.
     * @return array Los datos validados. Si `$onlyRules` es true, solo se devuelven los campos definidos en `$rules`.
     */
    public static function validate(array $rules, array $data, ?array $customMessages = [], int $code = 422, bool $onlyRules = false): array
    {
        $messages = [];

        foreach ($customMessages as $key => $value) {
            self::$messages[$key] = $value;
        }

        foreach ($rules as $field => $rule) {
            $fieldMessages = self::getFieldMessage($field);

            if (is_array($fieldMessages)) {
                foreach ($fieldMessages as $key => $msg) {
                    $messages[$key] = $msg;
                }
            }
            elseif (is_string($fieldMessages) && !str_starts_with($fieldMessages, "Mensaje no definido")) {
                $messages["{$field}.*"] = $fieldMessages;
            }
        }

        $validator = Validator::make($data, $rules, $messages);

        if ($validator->fails()) {
            ErrorsBag::throwErrors($validator->errors()->toArray(), $code);
        }

        return $onlyRules ? array_intersect_key($validator->getData(), array_flip(array_keys($rules))) : $validator->getData();
    }

    /**
     * Devuelve la regla de validación para un campo específico.
     *
     * @param string $type Nombre del campo (ej: 'rut', 'email')
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original Mensaje opcional que reemplaza temporalmente el mensaje por defecto
     * @return string La regla de validación como cadena
     * @throws \InvalidArgumentException Si el campo no está definido
     */
    public static function getFieldRule(string $type, bool $isRequired = true, string|array |null $customMessage = null): string
    {
        $method = 'get' . ucfirst($type) . 'Rule';

        if (method_exists(__CLASS__, $method)) {
            return self::$method($isRequired, $customMessage);
        }

        throw new \InvalidArgumentException("Regla '{$type}' no encontrada.");
    }

    /**
     * Devuelve el mensaje de error para un campo específico.
     *
     * @param string $type Nombre del campo (ej: 'rut', 'email')
     * @return string El mensaje de error asociado al campo
     */
    public static function getFieldMessage(string $type): string|array
    {
        $grouped = array_filter(
            self::$messages,
        fn($k) => str_starts_with($k, "$type."),
            ARRAY_FILTER_USE_KEY
        );

        return $grouped ?: (self::$messages[$type] ?? "Mensaje no definido para el campo '{$type}'.");
    }

    /**
     * Retorna la regla de validación para 'rut'. Parte numerica (sin digito verificador)
     *
     * @param bool $isRequired
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string
     */
    public static function getRutRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {
        self::applyCustomMessage('rut', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'integer',
            'between:1000000,100000000',
        ]);
    }

    /**
     * Retorna la regla de validación para 'dv'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getDvRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {
        self::applyCustomMessage('dv', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'string',
            'regex:/^[0-9kK]$/'
        ]);
    }

    /**
     * Retorna la regla de validación para 'rutdv' (con guion y dígito verificador).
     * Debe cumplir con el formato y el Algoritmo Módulo 11 (chile)
     *
     * @param bool $isRequired
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string
     */
    public static function getRutdvRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {
        self::applyCustomMessage('rutdv', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'string',
            'regex:/^\d{7,8}-[0-9kK]$/i',
            'modulo11'
        ]);
    }

    /**
     * Retorna la regla de validación para 'ip'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getIpRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {
        self::applyCustomMessage('ip', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'ip'
        ]);
    }

    /**
     * Retorna la regla de validación para 'mac'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getMacRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {
        self::applyCustomMessage('mac', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'string',
            'regex:/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/'
        ]);
    }

    /**
     * Retorna la regla de validación para 'numerico'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getNumericoRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {
        self::applyCustomMessage('numerico', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'integer'
        ]);
    }

    /**
     * Retorna la regla de validación para 'alfanumerico'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getAlfanumericoRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('alfanumerico', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'alpha_num'
        ]);
    }

    /**
     * Retorna la regla de validación para 'version'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getVersionRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('version', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'string',
            'regex:/^v\d+\.\d+\.\d+$/'
        ]);
    }

    /**
     * Retorna la regla de validación para 'email'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getEmailRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('email', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'string',
            'email',
            'max:255'
        ]);
    }

    /**
     * Retorna la regla de validación para 'password'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getPasswordRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('password', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'string',
            'min:8',
            'max:64',
            'regex:/[a-z]/',
            'regex:/[A-Z]/',
            'regex:/[0-9]/',
            'regex:/[@$!%*#?&]/'
        ]);
    }

    /**
     * Retorna la regla de validación para 'telefono'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getTelefonoRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('telefono', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'string',
            'regex:/^\+?569\d{8}$/'
        ]);
    }

    /**
     * Retorna la regla de validación para 'url'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getUrlRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('url', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'string',
            'url',
            'max:2048'
        ]);
    }

    /**
     * Retorna la regla de validación para 'fecha'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getFechaRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('fecha', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'date',
            'date_format:Y-m-d'
        ]);
    }

    /**
     * Retorna la regla de validación para 'fecha_hora'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getFechaHoraRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('fecha_hora', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'date',
            'date_format:Y-m-d H:i:s'
        ]);
    }

    /**
     * Retorna la regla de validación para 'boolean'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getBooleanRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('boolean', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'boolean'
        ]);
    }

    /**
     * Retorna la regla de validación para 'imagen'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getImagenRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('imagen', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'file',
            'image',
            'mimes:jpeg,png,jpg,gif,svg',
            'max:2048'
        ]);
    }

    /**
     * Retorna la regla de validación para 'nombre'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getNombreRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('nombre', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'string',
            'max:100',
            'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/u'
        ]);
    }

    /**
     * Retorna la regla de validación para 'texto'.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getTextoRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('texto', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'string',
            'max:5000'
        ]);
    }

    /**
     * Retorna la regla de validación para 'hora_minuto'. HH:MM
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getHoraMinutoRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('hora_minuto', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/' // Formato HH:MM
        ]);
    }

    /**
     * Retorna la regla de validación para 'hora_segundo'. HH:MM:SS
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original
     * @return string Regla de validación como cadena
     */
    public static function getHoraSegundoRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('hora_segundo', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/' // Formato HH:MM:SS
        ]);
    }

    /**
     * Valida un número de pasaporte alfanumérico entre 3 y 20 caracteres.
     */
    public static function getPasaporteRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('pasaporte', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'regex:/^(?!^0+$)[A-Za-z0-9]{3,20}$/'
        ]);
    }

    /**
     * Valida patente chilena nueva o antigua.
     *
     * @param bool $isRequired Si es requerido o nullable
     * @param string|array|null $customMessage Mensaje opcional que reemplaza el mensaje original Mensaje opcional
     * @return string Regla de validación como cadena
     */
    public static function getPatenteVehiculoRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('patente', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            // Valida patente chilena en dos formatos:
            // - Antigua: AB-1234 o AB1234 (2 letras + 4 números)
            // - Nueva:   ABCD-12 o ABCD12 (4 letras + 2 números)
            // Acepta con o sin guion, mayúsculas o minúsculas.
            'regex:/^([A-Za-z]{2}-?[0-9]{4}|[A-Za-z]{4}-?[0-9]{2})$/'
        ]);
    }

    /**
     * Valida latitud numérica entre -90 y 90.
     */
    public static function getLatitudRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('latitud', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'numeric',
            'between:-90,90'
        ]);
    }

    /**
     * Valida longitud numérica entre -180 y 180.
     */
    public static function getLongitudRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('longitud', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'numeric',
            'between:-180,180'
        ]);
    }

    /**
     * Valida UUID según RFC 4122.
     */
    public static function getUuidRule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('uuid', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'uuid'
        ]);
    }

    /**
     * Valida hash MD5 (32 caracteres hexadecimales).
     */
    public static function getHashMd5Rule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('hash_md5', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'regex:/^[a-f0-9]{32}$/i'
        ]);
    }

    /**
     * Valida hash SHA-256 (64 caracteres hexadecimales).
     */
    public static function getHashSha256Rule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('hash_sha256', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'regex:/^[a-f0-9]{64}$/i'
        ]);
    }

    /**
     * Valida hash SHA-1 (40 caracteres hexadecimales).
     */
    public static function getHashSha1Rule(bool $isRequired = true, string|array |null $customMessage = null): string
    {

        self::applyCustomMessage('hash_sha1', $customMessage);

        return implode('|', [
            $isRequired ? 'required' : 'nullable',
            'regex:/^[a-f0-9]{40}$/i'
        ]);
    }

    // ——————————————————————————————
    // Algoritmo Módulo 11 - Validación de RUT Chileno
    // ——————————————————————————————

    /**
     * Calcula el dígito verificador usando el algoritmo Módulo 11.
     *
     * @param int $rut Número del RUT sin DV
     * @return string Dígito verificador calculado
     */
    private static function calcularDV(int $rut): string
    {
        $suma = 0;
        $multiplo = 2;

        while ($rut > 0) {
            $suma += ($rut % 10) * $multiplo;
            $rut = (int)($rut / 10);
            $multiplo = $multiplo === 7 ? 2 : $multiplo + 1;
        }

        $resto = $suma % 11;
        $dv = 11 - $resto;

        return match ($dv) {
                11 => '0',
                10 => 'k',
                default => (string)$dv,
            };
    }


    /**
     * Valida el dígito verificador usando el algoritmo Módulo 11.
     *
     * @param mixed $attribute
     * @param mixed $value
     * @param \Closure $fail
     * @return void
     */
    public static function validateRutDV(mixed $attribute, mixed $value, \Closure $fail): void
    {
        if (!is_string($value)) {
            $fail(self::$messages['rutdv']);
            return;
        }

        [$rutStr, $dv] = explode('-', strtoupper($value));
        $rutNum = (int)$rutStr;
        $dvCalculado = self::calcularDV($rutNum);

        if ($dvCalculado !== strtolower($dv)) {
            $fail(self::$messages['rutdv']);
        }
    }

    /**
     * Registra las reglas personalizadas en Laravel.
     */
    public static function registerCustomRules(): void
    {
        Validator::extend('modulo11', function ($attribute, $value, $parameters, $validator) {
            if (!is_string($value) || !str_contains($value, '-')) {
                return false;
            }

            [$rutStr, $dv] = explode('-', strtoupper($value));
            $rutNum = (int)$rutStr;

            if (!is_numeric($rutStr) || !preg_match('/^[0-9kK]$/', $dv)) {
                return false;
            }

            $dvCalculado = ValidacionUtils::calcularDV($rutNum);
            return strtolower($dv) === $dvCalculado;
        });

    }

}
