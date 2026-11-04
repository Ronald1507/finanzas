/**
 * Service para operaciones de movimientos (ingresos/egresos/transferencias).
 *
 * @module features/Movimientos/services/movimientosService
 */
import { httpClient } from '../../../services/httpClient';
import { API_URLS } from '../../../config/apisUrl';
import { APP_CONFIG } from '../../../config/app.config';

/**
 * Service de movimientos financieros.
 *
 * @namespace movimientosService
 */
export const movimientosService = {
    /**
     * Obtiene listado paginado de movimientos con filtros.
     * Parámetros enviados planos según contrato del backend.
     *
     * @param {Object} params
     * @param {number} [params.page=1]
     * @param {string} [params.search='']
     * @param {Object} [params.filters={}] - {mes_id, cuenta_id, tipo, categoria}
     * @returns {Promise<Object>}
     */
    getList: async ({ page = 1, search = '', filters = {} } = {}) => {
        const p = new URLSearchParams({ page, per_page: APP_CONFIG.DEFAULT_PAGE_SIZE });
        if (filters.mes_id) p.set('mes_id', filters.mes_id);
        if (filters.cuenta_id) p.set('cuenta_id', filters.cuenta_id);
        if (filters.tipo) p.set('tipo', filters.tipo);
        if (filters.categoria_id) p.set('categoria_id', filters.categoria_id);
        if (search) p.set('search', search);
        return httpClient.get(`${API_URLS.MOVIMIENTOS}?${p.toString()}`);
    },

    /**
     * Crea un nuevo movimiento.
     *
     * @param {Object} data - {cuenta_id, tipo, monto, fecha, descripcion, categoria}
     * @returns {Promise<Object>}
     */
    create: async (data) => {
        return httpClient.post(API_URLS.MOVIMIENTOS, data);
    },

    /**
     * Actualiza un movimiento existente.
     *
     * @param {number} id
     * @param {Object} data - {cuenta_id, tipo, monto, fecha, descripcion, categoria}
     * @returns {Promise<Object>}
     */
    update: async (id, data) => {
        return httpClient.put(API_URLS.MOVIMIENTOS_BY_ID(id), data);
    },

    /**
     * Elimina un movimiento.
     *
     * @param {number} id
     * @returns {Promise<Object>}
     */
    delete: async (id) => {
        return httpClient.delete(API_URLS.MOVIMIENTOS_BY_ID(id));
    },

    /**
     * Crea una transferencia entre dos cuentas propias.
     *
     * @param {Object} data - {cuenta_origen_id, cuenta_destino_id, monto, fecha, descripcion}
     * @returns {Promise<Object>}
     */
    transferir: async (data) => {
        return httpClient.post(API_URLS.MOVIMIENTOS_TRANSFERENCIA, data);
    },
};
