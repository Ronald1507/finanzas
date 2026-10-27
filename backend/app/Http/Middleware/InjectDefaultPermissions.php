<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware que inyecta permisos por defecto para la app single-user.
 *
 * Esta aplicación no tiene autenticación multi-usuario. Este middleware
 * satisface el contrato de PermissionControl::hasPermission() inyectando
 * el rol administrador en cada request de la API.
 *
 * @package App\Http\Middleware
 */
class InjectDefaultPermissions
{
    /**
     * Inyecta permisos de administrador en el request.
     *
     * @param Request $request
     * @param Closure $next
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $request->merge([
            'permisos' => [
                'id'       => 1,
                'nombre'   => 'usuario_local',
                'permisos' => [
                    'finanzas' => ['finanzas-admin'],
                ],
            ],
        ]);

        return $next($request);
    }
}
