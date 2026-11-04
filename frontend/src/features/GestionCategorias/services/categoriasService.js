import { httpClient } from '../../../services/httpClient';
import { API_URLS } from '../../../config/apisUrl';

export const categoriasService = {
    getList: async ({ search = '', filters = {} } = {}) => {
        const p = new URLSearchParams();
        const activa = filters.activa !== undefined && filters.activa !== '' ? filters.activa : 'all';
        p.set('activa', activa);
        if (search) p.set('search', search);
        return httpClient.get(`${API_URLS.CATEGORIAS}?${p.toString()}`);
    },

    getFlat: async () => {
        return httpClient.get(API_URLS.CATEGORIAS);
    },

    create: async (data) => {
        return httpClient.post(API_URLS.CATEGORIAS, data);
    },

    update: async (id, data) => {
        return httpClient.put(API_URLS.CATEGORIAS_BY_ID(id), data);
    },

    delete: async (id) => {
        return httpClient.delete(API_URLS.CATEGORIAS_BY_ID(id));
    },
};
