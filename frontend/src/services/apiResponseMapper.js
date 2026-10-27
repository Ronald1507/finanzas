/**
 * Normaliza respuestas del API backend (envelope ResponseUtils de Laravel)
 * al formato uniforme {success, data} que consumen los hooks compartidos.
 *
 * ResponseUtils retorna: { success: true|false, message?, data: ... }
 * PaginationUtils retorna: { data: [...], meta: { current_page, per_page, total, last_page } }
 *
 * @module services/apiResponseMapper
 */

/**
 * Normaliza una respuesta exitosa del API.
 * Adapta el envelope de ResponseUtils ({status, data}) a {success, data}.
 * Para listados paginados, preserva la estructura {data, meta} de PaginationUtils.
 *
 * @param {Object} response - Respuesta cruda devuelta por axios (interceptor ya extrajo response.data)
 * @returns {Object} Respuesta normalizada con {success: true, data, message}
 */
export const mapSuccessResponse = (response) => {
    // El interceptor de axios ya retorna response.data (body del JSON)
    // ResponseUtils retorna: { success: true, message?, data: ... }
    const data = response?.data !== undefined ? response.data : response;

    return {
        success: true,
        data,
        message: response?.message || 'Operación exitosa',
    };
};

/**
 * Normaliza una respuesta de error del API.
 *
 * @param {Object} error - Error de axios
 * @returns {Object} Respuesta de error normalizada
 */
export const mapErrorResponse = (error) => {
    return {
        success: false,
        message: error.response?.data?.message || 'Ocurrió un error inesperado',
        errors: error.response?.data?.errors || null,
    };
};
