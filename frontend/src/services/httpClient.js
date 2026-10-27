/**
 * Cliente HTTP global preconfigurado con axios.
 * Sin token Bearer ni redirección 401 (app de un solo usuario sin login).
 * El interceptor de response normaliza el envelope de ResponseUtils.
 *
 * @module services/httpClient
 */
import axios from 'axios';
import { getApiUrl, getTimeout } from '../config/env';
import { mapSuccessResponse } from './apiResponseMapper';

/**
 * Instancia de axios con baseURL y timeout configurados desde variables de entorno.
 */
export const httpClient = axios.create({
    baseURL: getApiUrl(),
    timeout: getTimeout(),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

/**
 * Interceptor de response:
 * - Éxito: normaliza el envelope ResponseUtils a {success, data, message}
 * - Error: rechaza con el error original para que los hooks lean err.response.data.errors
 */
httpClient.interceptors.response.use(
    (response) => mapSuccessResponse(response.data),
    (error) => Promise.reject(error),
);
