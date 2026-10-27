/**
 * Permisos disponibles en el sistema.
 * App de un solo usuario sin login: todos los permisos habilitados por defecto.
 *
 * @module permissions/permisos
 */
export const PERMISOS = {
    VER_CUENTAS: 'ver_cuentas',
    CREAR_CUENTAS: 'crear_cuentas',
    EDITAR_CUENTAS: 'editar_cuentas',
    DESACTIVAR_CUENTAS: 'desactivar_cuentas',

    VER_MOVIMIENTOS: 'ver_movimientos',
    CREAR_MOVIMIENTOS: 'crear_movimientos',
    EDITAR_MOVIMIENTOS: 'editar_movimientos',
    ELIMINAR_MOVIMIENTOS: 'eliminar_movimientos',

    VER_PENDIENTES: 'ver_pendientes',
    CREAR_PENDIENTES: 'crear_pendientes',
    EDITAR_PENDIENTES: 'editar_pendientes',
    CONCRETAR_PENDIENTES: 'concretar_pendientes',
    ANULAR_PENDIENTES: 'anular_pendientes',

    VER_DASHBOARD: 'ver_dashboard',

    VER_MESES: 'ver_meses',
    CERRAR_MES: 'cerrar_mes',
    REABRIR_MES: 'reabrir_mes',
};

/**
 * Mapping de permisos por rol.
 * El usuario único tiene todos los permisos.
 */
export const ROLES_PERMISOS = {
    usuario: Object.values(PERMISOS),
};
