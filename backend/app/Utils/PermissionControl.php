<?php

namespace App\Utils;

use App\Utils\ErrorsBag;
use Illuminate\Validation\ValidationException;

/**
 * Clase utilitaria para control de permisos y roles del sistema.
 *
 * Centraliza la verificacion de permisos basada en roles que provienen
 * del middleware de autenticacion.
 *
 * CONFIGURACION REQUERIDA:
 * 1. Definir las constantes de roles segun los roles de tu sistema
 * 2. Definir APP_SCOPE con el nombre de la aplicacion en el gateway/auth provider
 * 3. Adaptar extractUserData() y getUserRoles() a la estructura de tu auth middleware
 *
 * Uso tipico en Services:
 *   $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);
 *
 * @package App\Utils
 */
class PermissionControl
{
    // =========================================================================
    // ROLES DEL SISTEMA — finanzas-personales
    // =========================================================================

    /** @var string Rol administrador del sistema */
    public const ADMIN = 'finanzas-admin';

    // =========================================================================
    // CONFIGURACION DEL GATEWAY / AUTH PROVIDER
    // =========================================================================

    /**
     * Nombre de la aplicacion en el gateway/auth provider.
     * Identifica la clave dentro del objeto 'permisos' del request.
     *
     * @var string
     */
    private const APP_SCOPE = 'finanzas';

    // =========================================================================
    // IMPLEMENTACION — NO MODIFICAR SALVO NECESIDAD ESPECIFICA
    // =========================================================================

    public function __construct(
        protected ErrorsBag $errors
    ) {}

    /**
     * Extrae los datos del usuario desde el array de permisos del request.
     *
     * Adaptar este metodo segun la estructura que tu middleware de autenticacion
     * inyecta en el request. Por defecto asume:
     *   $request['permisos'] = ['id' => 123, 'nombre' => '...', 'permisos' => ...]
     *
     * @param array $requestPermisos Array inyectado por el middleware de autenticacion.
     * @return object Datos del usuario como objeto.
     */
    public function extractUserData(array $requestPermisos): object
    {
        return (object) $requestPermisos;
    }

    /**
     * Obtiene el array de roles del usuario.
     *
     * Adaptar la logica de extraccion segun la estructura de tu auth provider.
     * Por defecto busca en: $data->permisos->{APP_SCOPE}
     *
     * @param array $requestPermisos Array de permisos del request.
     * @return array Lista de strings de roles del usuario.
     */
    public function getUserRoles(array $requestPermisos): array
    {
        if (empty($requestPermisos)) {
            return [];
        }

        $data = $this->extractUserData($requestPermisos);

        if (!isset($data->permisos)) {
            return [];
        }

        $permisos = $data->permisos;

        // Si permisos es stdClass (caso normal desde gateway)
        if (is_object($permisos) && isset($permisos->{self::APP_SCOPE})) {
            return (array) $permisos->{self::APP_SCOPE};
        }

        // Si permisos fue convertido a array
        if (is_array($permisos) && isset($permisos[self::APP_SCOPE])) {
            return (array) $permisos[self::APP_SCOPE];
        }

        return [];
    }

    /**
     * Verifica que el usuario tenga AL MENOS UNO de los roles requeridos (logica OR).
     * Si no tiene permiso, lanza ValidationException con codigo 403.
     *
     * @param array $requestPermisos Array de permisos del request.
     * @param string|array $requiredRoles Rol o roles requeridos.
     * @return void
     * @throws ValidationException Si no tiene ningun rol requerido.
     */
    public function hasPermission(array $requestPermisos, string|array $requiredRoles): void
    {
        if (empty($requestPermisos)) {
            $this->errors->throwFast('permisos', 'No tiene permisos para realizar esta accion', 403);
        }

        $roles = is_string($requiredRoles) ? [$requiredRoles] : $requiredRoles;
        $userRoles = $this->getUserRoles($requestPermisos);

        foreach ($roles as $role) {
            if (in_array($role, $userRoles, true)) {
                return;
            }
        }

        $this->errors->throwFast(
            'permisos',
            'No tiene permisos para realizar esta accion',
            403
        );
    }

    /**
     * Verifica que el usuario tenga TODOS los roles requeridos (logica AND).
     * Si falta alguno, lanza ValidationException con codigo 403.
     *
     * @param array $requestPermisos Array de permisos del request.
     * @param array $requiredRoles Roles requeridos (todos deben estar presentes).
     * @return void
     * @throws ValidationException Si falta algun rol.
     */
    public function hasAllPermissions(array $requestPermisos, array $requiredRoles): void
    {
        if (empty($requestPermisos)) {
            $this->errors->throwFast('permisos', 'No tiene permisos para realizar esta accion', 403);
        }

        $userRoles = $this->getUserRoles($requestPermisos);

        foreach ($requiredRoles as $role) {
            if (!in_array($role, $userRoles, true)) {
                $this->errors->throwFast(
                    'permisos',
                    'No tiene permisos para realizar esta accion',
                    403
                );
            }
        }
    }

    /**
     * Verifica si el usuario tiene un rol especifico (sin lanzar excepcion).
     *
     * @param array $requestPermisos Array de permisos del request.
     * @param string $role Rol a verificar.
     * @return bool
     */
    public function hasRole(array $requestPermisos, string $role): bool
    {
        return in_array($role, $this->getUserRoles($requestPermisos), true);
    }

    /**
     * Verifica si el usuario es administrador.
     *
     * @param array $requestPermisos Array de permisos del request.
     * @return bool
     */
    public function isAdmin(array $requestPermisos): bool
    {
        return $this->hasRole($requestPermisos, self::ADMIN);
    }

    /**
     * Obtiene el ID del usuario autenticado desde el array de permisos.
     *
     * @param array $requestPermisos Array de permisos del request.
     * @return int
     */
    public function getUserId(array $requestPermisos): int
    {
        if (empty($requestPermisos)) {
            $this->errors->throwFast('permisos', 'No tiene permisos para realizar esta accion', 403);
        }

        $data = $this->extractUserData($requestPermisos);
        return (int) ($data->id ?? 0);
    }

    /**
     * Obtiene el ID del area/departamento del usuario.
     *
     * @param array $requestPermisos Array de permisos del request.
     * @return int|null
     */
    public function getUserArea(array $requestPermisos): ?int
    {
        $data = $this->extractUserData($requestPermisos);
        return isset($data->area) ? (int) $data->area : null;
    }
}
