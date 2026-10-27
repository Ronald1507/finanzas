/**
 * Resuelve la URL del backend según el ambiente actual.
 *
 * @module services/getEnvUrl
 */

/**
 * Obtiene la URL base del API desde variables de entorno.
 *
 * @returns {string} URL base del API
 */
export const getEnvUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
};
