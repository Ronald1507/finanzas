/**
 * Service para operaciones de gestión de meses (cierre/reapertura).
 *
 * @module features/CierreMensual/services/mesesService
 */
import { httpClient } from '../../../services/httpClient';
import { API_URLS } from '../../../config/apisUrl';

/**
 * Service de meses y cierre mensual.
 *
 * @namespace mesesService
 */
export const mesesService = {
    /**
     * Obtiene la lista de todos los meses registrados.
     *
     * @returns {Promise<Object>}
     */
    getList: async () => {
        return httpClient.get(API_URLS.MESES);
    },

    /**
     * Cierra un mes (congela saldos, crea mes siguiente, arrastra pendientes).
     *
     * @param {number} id - ID del mes a cerrar
     * @returns {Promise<Object>}
     */
    cerrar: async (id) => {
        return httpClient.post(API_URLS.MESES_CERRAR(id));
    },

    /**
     * Reabre el último mes cerrado.
     *
     * @param {number} id - ID del mes a reabrir
     * @returns {Promise<Object>}
     */
    reabrir: async (id) => {
        return httpClient.post(API_URLS.MESES_REABRIR(id));
    },
};
