import { httpClient } from '../../../services/httpClient';
import { API_URLS } from '../../../config/apisUrl';

export const reportesService = {
    resumenMensual: (mesId) =>
        httpClient.get(API_URLS.REPORTES_RESUMEN_MENSUAL, { params: { mes_id: mesId } }),

    evolucionAnual: (anio) =>
        httpClient.get(API_URLS.REPORTES_EVOLUCION_ANUAL, { params: { anio } }),

    gastosPorCategoria: (anio, mesId = null) =>
        httpClient.get(API_URLS.REPORTES_GASTOS_CATEGORIA, {
            params: { anio, ...(mesId ? { mes_id: mesId } : {}) },
        }),
};
