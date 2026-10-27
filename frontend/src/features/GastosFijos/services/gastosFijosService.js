/**
 * Service para operaciones de gastos fijos (pagos recurrentes mensuales).
 * Maneja el catálogo de gastos fijos y su seguimiento de pago por mes.
 *
 * @module features/GastosFijos/services/gastosFijosService
 */
import { httpClient } from '../../../services/httpClient';
import { API_URLS } from '../../../config/apisUrl';
import { APP_CONFIG } from '../../../config/app.config';

/**
 * Service de gastos fijos.
 *
 * @namespace gastosFijosService
 */
export const gastosFijosService = {
    /**
     * Obtiene listado paginado del catálogo de gastos fijos con filtros.
     *
     * @param {Object} params
     * @param {number} [params.page=1] - Página
     * @param {string} [params.search=''] - Búsqueda por nombre
     * @param {Object} [params.filters={}] - Filtros extra (activo)
     * @returns {Promise<Object>}
     */
    getList: async ({ page = 1, search = '', filters = {} } = {}) => {
        const p = new URLSearchParams({ page, per_page: APP_CONFIG.DEFAULT_PAGE_SIZE });
        if (search) p.set('search', search);
        if (filters.activo !== undefined && filters.activo !== '') {
            p.set('activo', filters.activo);
        }
        return httpClient.get(`${API_URLS.GASTOS_FIJOS}?${p.toString()}`);
    },

    /**
     * Crea un nuevo gasto fijo en el catálogo.
     *
     * @param {Object} data - {nombre, categoria?, cuenta_id?, monto_estimado?, activo?}
     * @returns {Promise<Object>}
     */
    create: async (data) => {
        return httpClient.post(API_URLS.GASTOS_FIJOS, data);
    },

    /**
     * Actualiza un gasto fijo del catálogo.
     *
     * @param {number} id
     * @param {Object} data - {nombre, categoria?, cuenta_id?, monto_estimado?, activo?}
     * @returns {Promise<Object>}
     */
    update: async (id, data) => {
        return httpClient.put(API_URLS.GASTOS_FIJOS_BY_ID(id), data);
    },

    /**
     * Desactiva un gasto fijo del catálogo.
     *
     * @param {number} id
     * @returns {Promise<Object>}
     */
    desactivar: async (id) => {
        return httpClient.post(API_URLS.GASTOS_FIJOS_DESACTIVAR(id));
    },

    /**
     * Obtiene los gastos fijos del mes con su estado de pago y totales.
     *
     * @param {number} mesId
     * @returns {Promise<Object>} data: { items: [ITEM], totales: { estimado, pagado, pendientes } }
     */
    getPorMes: async (mesId) => {
        return httpClient.get(API_URLS.GASTOS_FIJOS_POR_MES(mesId));
    },

    /**
     * Registra el pago de un gasto fijo en el mes (genera el movimiento real).
     *
     * @param {number} id
     * @param {Object} data - {monto, fecha (YYYY-MM-DD), cuenta_id}
     * @returns {Promise<Object>}
     */
    pagar: async (id, data) => {
        return httpClient.post(API_URLS.GASTOS_FIJOS_PAGAR(id), data);
    },

    /**
     * Deshace el pago de un gasto fijo en un mes (elimina el movimiento vinculado).
     *
     * @param {number} id
     * @param {number} mesId
     * @returns {Promise<Object>}
     */
    deshacerPago: async (id, mesId) => {
        return httpClient.delete(API_URLS.GASTOS_FIJOS_PAGO(id, mesId));
    },
};
