/**
 * Service para operaciones de pendientes (cuentas por pagar y por recibir).
 *
 * @module features/Pendientes/services/pendientesService
 */
import { httpClient } from '../../../services/httpClient';
import { API_URLS } from '../../../config/apisUrl';
import { APP_CONFIG } from '../../../config/app.config';

/**
 * Service de pendientes financieros.
 *
 * @namespace pendientesService
 */
export const pendientesService = {
    /**
     * Obtiene listado de pendientes con filtros.
     *
     * @param {Object} params
     * @param {number} [params.page=1]
     * @param {string} [params.search='']
     * @param {Object} [params.filters={}] - {mes_id, tipo, estado, recurrente}
     * @returns {Promise<Object>}
     */
    getList: async ({ page = 1, search = '', filters = {} } = {}) => {
        const p = new URLSearchParams({ page, per_page: APP_CONFIG.DEFAULT_PAGE_SIZE });
        if (filters.mes_id) p.set('mes_id', filters.mes_id);
        if (filters.tipo) p.set('tipo', filters.tipo);
        if (filters.estado) p.set('estado', filters.estado);
        if (filters.recurrente !== '' && filters.recurrente != null) p.set('recurrente', filters.recurrente);
        if (search) p.set('search', search);
        return httpClient.get(`${API_URLS.PENDIENTES}?${p.toString()}`);
    },

    /**
     * Crea un nuevo pendiente.
     *
     * @param {Object} data - {cuenta_id, tipo, monto, descripcion, fecha_estimada, recurrente}
     * @returns {Promise<Object>}
     */
    create: async (data) => {
        return httpClient.post(API_URLS.PENDIENTES, data);
    },

    /**
     * Actualiza un pendiente existente.
     *
     * @param {number} id
     * @param {Object} data - {cuenta_id, tipo, monto, descripcion, fecha_estimada, recurrente}
     * @returns {Promise<Object>}
     */
    update: async (id, data) => {
        return httpClient.put(API_URLS.PENDIENTES_BY_ID(id), data);
    },

    /**
     * Concreta un pendiente generando el movimiento real.
     *
     * @param {number} id
     * @param {string} fecha - Fecha de concreción (YYYY-MM-DD)
     * @returns {Promise<Object>}
     */
    concretar: async (id, fecha) => {
        return httpClient.post(API_URLS.PENDIENTES_CONCRETAR(id), { fecha });
    },

    /**
     * Anula un pendiente.
     *
     * @param {number} id
     * @returns {Promise<Object>}
     */
    anular: async (id) => {
        return httpClient.post(API_URLS.PENDIENTES_ANULAR(id));
    },
};
