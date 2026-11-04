import { httpClient } from '../../../services/httpClient';
import { API_URLS } from '../../../config/apisUrl';

export const presupuestosService = {
    getList: async ({ filters = {} } = {}) => {
        if (!filters.mes_id) return { success: true, data: { data: [] } };
        const p = new URLSearchParams({ mes_id: filters.mes_id });
        return httpClient.get(`${API_URLS.PRESUPUESTOS}?${p.toString()}`);
    },

    create: async (data) => httpClient.post(API_URLS.PRESUPUESTOS, data),
    update: async (id, data) => httpClient.put(API_URLS.PRESUPUESTOS_BY_ID(id), data),
    delete: async (id) => httpClient.delete(API_URLS.PRESUPUESTOS_BY_ID(id)),
};
