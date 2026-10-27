/**
 * Service para operaciones de cuentas bancarias.
 * Consume los endpoints de GestionCuentas del backend.
 *
 * @module features/GestionCuentas/services/cuentasService
 */
import { httpClient } from '../../../services/httpClient';
import { API_URLS } from '../../../config/apisUrl';
import { APP_CONFIG } from '../../../config/app.config';

/**
 * Service de cuentas bancarias.
 *
 * @namespace cuentasService
 */
export const cuentasService = {
    /**
     * Obtiene listado paginado de cuentas con filtros.
     *
     * @param {Object} params
     * @param {number} [params.page=1] - Página
     * @param {string} [params.search=''] - Búsqueda por nombre
     * @param {Object} [params.filters={}] - Filtros extra (activa)
     * @returns {Promise<Object>}
     */
    getList: async ({ page = 1, search = '', filters = {} } = {}) => {
        const p = new URLSearchParams({ page, per_page: APP_CONFIG.DEFAULT_PAGE_SIZE });
        if (search) p.set('search', search);
        if (filters.activa !== undefined && filters.activa !== '') {
            p.set('activa', filters.activa);
        }
        return httpClient.get(`${API_URLS.CUENTAS}?${p.toString()}`);
    },

    /**
     * Obtiene lista plana de cuentas activas para selectores.
     *
     * @returns {Promise<Object>}
     */
    getFlat: async () => {
        return httpClient.get(`${API_URLS.CUENTAS}?activa=1`);
    },

    /**
     * Obtiene una cuenta por ID.
     *
     * @param {number} id
     * @returns {Promise<Object>}
     */
    getById: async (id) => {
        return httpClient.get(API_URLS.CUENTAS_BY_ID(id));
    },

    /**
     * Crea una nueva cuenta.
     *
     * @param {Object} data - {nombre, banco?, tipo, saldo_inicial}
     * @returns {Promise<Object>}
     */
    create: async (data) => {
        return httpClient.post(API_URLS.CUENTAS, data);
    },

    /**
     * Actualiza datos básicos de una cuenta.
     *
     * @param {number} id
     * @param {Object} data - {nombre, banco?, tipo}
     * @returns {Promise<Object>}
     */
    update: async (id, data) => {
        return httpClient.put(API_URLS.CUENTAS_BY_ID(id), data);
    },

    /**
     * Actualiza el saldo inicial de una cuenta (solo mes abierto).
     *
     * @param {number} id
     * @param {number} saldo_inicial
     * @returns {Promise<Object>}
     */
    updateSaldoInicial: async (id, saldo_inicial) => {
        return httpClient.put(API_URLS.CUENTAS_SALDO_INICIAL(id), { saldo_inicial });
    },

    /**
     * Desactiva una cuenta bancaria.
     *
     * @param {number} id
     * @returns {Promise<Object>}
     */
    desactivar: async (id) => {
        return httpClient.post(API_URLS.CUENTAS_DESACTIVAR(id));
    },
};
