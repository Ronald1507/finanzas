<?php
declare(strict_types=1);

namespace App\Utils;

final class Helpers
{
    private const HEX_LEN = 12;

    /**
     * Quita todo lo que no sea [0-9A-F], vuelve mayúsculas.
     */
    private static function onlyHex(string $value): string
    {
        return strtoupper(preg_replace('/[^0-9A-F]/i', '', $value));
    }

    /**
     * ¿Tiene pinta de MAC (con o sin separador)?
     */
    public static function isValid(?string $value): bool
    {
        if ($value === null || $value === '') return false;
        return (bool) preg_match('/^([0-9A-F]{2}([-:])){5}[0-9A-F]{2}$|^[0-9A-F]{12}$/i', $value);
    }

    /**
     * Normaliza a 12 HEX en mayúsculas sin separadores. Lanza excepción si es inválida.
     */
    public static function normalize(string $value): string
    {
        $hex = self::onlyHex($value);
        if (strlen($hex) !== self::HEX_LEN) {
            throw new \InvalidArgumentException('MAC inválida: se esperan 12 caracteres hexadecimales.');
        }
        return $hex;
    }

    /**
     * Igual que normalize, pero "safe": devuelve null si no es válida.
     */
    public static function normalizeOrNull(?string $value): ?string
    {
        if ($value === null) return null;
        $hex = self::onlyHex($value);
        return strlen($hex) === self::HEX_LEN ? $hex : null;
    }

    /**
     * Formatea con separador (':' por defecto).
     * Ej: D45EECAD0038 -> D4:5E:EC:AD:00:38
     */
    public static function format(string $value, string $separator = ':'): string
    {
        $hex = self::normalize($value);
        return implode($separator, str_split($hex, 2));
    }

    /**
     * Formatea con '-', p.ej. D4-5E-EC-AD-00-38
     */
    public static function formatHyphen(string $value): string
    {
        return self::format($value, '-');
    }

    /**
     * Formatea plano (sin separadores) y en mayúsculas.
     */
    public static function formatPlain(string $value): string
    {
        return self::normalize($value);
    }

    /**
     * Compara dos MAC ignorando separadores/caso.
     */
    public static function equals(string $a, string $b): bool
    {
        return self::normalize($a) === self::normalize($b);
    }

    /**
     * Enmascara pares intermedios. Por defecto muestra 2 pares al inicio y 1 al final.
     * Ej: D4:5E:**:**:**:38
     */
    public static function mask(
        string $value,
        int $visibleStartPairs = 2,
        int $visibleEndPairs = 1,
        string $separator = ':'
    ): string {
        $pairs = str_split(self::normalize($value), 2);
        $n = count($pairs);

        $visibleStartPairs = max(0, min($visibleStartPairs, $n));
        $visibleEndPairs   = max(0, min($visibleEndPairs, $n - $visibleStartPairs));

        $masked = [];
        foreach ($pairs as $i => $p) {
            if ($i < $visibleStartPairs || $i >= $n - $visibleEndPairs) {
                $masked[] = $p;
            } else {
                $masked[] = '**';
            }
        }
        return implode($separator, $masked);
    }

    /**
     * Genera una MAC aleatoria. Puedes enviar un prefijo OUI (3 bytes = 6 hex) o cualquier prefijo parcial.
     * Ej: Mac::random('D45EEC') => D4:5E:EC:xx:xx:xx
     */
    public static function random(?string $prefix = null, string $separator = ':'): string
    {
        $hexPrefix = $prefix ? self::onlyHex($prefix) : '';
        if (strlen($hexPrefix) > self::HEX_LEN) {
            throw new \InvalidArgumentException('El prefijo excede 12 caracteres hexadecimales.');
        }

        $need = self::HEX_LEN - strlen($hexPrefix);
        $rand = '';
        for ($i = 0; $i < $need; $i++) {
            $rand .= dechex(random_int(0, 15));
        }
        $hex = strtoupper($hexPrefix . $rand);

        return implode($separator, str_split($hex, 2));
    }

    /**
     * Normaliza un arreglo de MACs. Omite nulos/vacíos; si $strict=true lanza excepción ante inválidas.
     */
    public static function normalizeMany(array $values, bool $strict = false): array
    {
        $out = [];
        foreach ($values as $v) {
            if ($v === null || $v === '') continue;
            $normalized = self::normalizeOrNull((string) $v);
            if ($normalized === null) {
                if ($strict) {
                    throw new \InvalidArgumentException("MAC inválida en la lista: " . (string) $v);
                }
                continue;
            }
            $out[] = $normalized;
        }
        return array_values(array_unique($out));
    }

    /**
     * Obtiene el OUI (primeros 6 hex) ya formateado (sin lookup de fabricante).
     * Ej: D45EECAD0038 -> D4:5E:EC
     */
    public static function getOUI(string $value, string $separator = ':'): string
    {
        $hex = self::normalize($value);
        return implode($separator, str_split(substr($hex, 0, 6), 2));
    }
}
