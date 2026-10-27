/**
 * Guards de acceso para la aplicación.
 * App de un solo usuario sin login: todos los guards devuelven true.
 *
 * @module permissions/permissionGuards
 */

/**
 * Verifica si el usuario tiene un permiso específico.
 * En app de un solo usuario siempre retorna true.
 *
 * @param {string} permiso - Permiso a verificar
 * @returns {boolean}
 */
export const hasPermission = (permiso) => {
    return true;
};

/**
 * Verifica si el usuario tiene alguno de los permisos especificados.
 *
 * @param {string[]} permisos
 * @returns {boolean}
 */
export const hasAnyPermission = (permisos) => {
    return true;
};

/**
 * Verifica si el usuario tiene todos los permisos especificados.
 *
 * @param {string[]} permisos
 * @returns {boolean}
 */
export const hasAllPermissions = (permisos) => {
    return true;
};

/**
 * Guard para verificar acceso a ruta.
 * Siempre permite el acceso (app single-user).
 *
 * @returns {boolean}
 */
export const canAccessRoute = () => {
    return true;
};
