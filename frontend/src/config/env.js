/**
 * Configuración de variables de entorno.
 * Punto único de acceso a variables VITE_* del proceso.
 *
 * @module config/env
 */

/**
 * Obtiene la URL base del API.
 *
 * @returns {string}
 */
export const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
};

/**
 * Obtiene el timeout para requests HTTP en milisegundos.
 *
 * @returns {number}
 */
export const getTimeout = () => {
    return parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;
};

/**
 * Indica si el ambiente actual es producción.
 *
 * @returns {boolean}
 */
export const isProduction = () => {
    return import.meta.env.PROD === true;
};

/**
 * Indica si el ambiente actual es desarrollo.
 *
 * @returns {boolean}
 */
export const isDevelopment = () => {
    return import.meta.env.DEV === true;
};
