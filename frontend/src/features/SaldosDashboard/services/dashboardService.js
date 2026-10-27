/**
 * Service para consulta del dashboard de saldos.
 *
 * @module features/SaldosDashboard/services/dashboardService
 */
import { httpClient } from '../../../services/httpClient';
import { API_URLS } from '../../../config/apisUrl';

/**
 * Service del dashboard de saldos.
 *
 * @namespace dashboardService
 */
export const dashboardService = {
    /**
     * Obtiene los saldos del dashboard para un mes específico.
     *
     * @param {number} anio - Año (ej: 2025)
     * @param {number} mes - Mes 1-12
     * @returns {Promise<Object>} {mes, consolidado, cuentas}
     */
    getDashboard: async (anio, mes) => {
        const p = new URLSearchParams({ anio, mes });
        return httpClient.get(`${API_URLS.DASHBOARD}?${p.toString()}`);
    },
};
