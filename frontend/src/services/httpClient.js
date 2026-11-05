import axios from 'axios';
import { getApiUrl, getTimeout } from '../config/env';
import { mapSuccessResponse } from './apiResponseMapper';
import useAuthStore from '../shared/hooks/useAuthStore';

export const httpClient = axios.create({
    baseURL: getApiUrl(),
    timeout: getTimeout(),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Agrega Authorization: Bearer <token> en cada request
httpClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Normaliza respuestas; en 401 hace logout y redirige a /login
httpClient.interceptors.response.use(
    (response) => mapSuccessResponse(response.data),
    (error) => {
        if (error.response?.status === 401 && useAuthStore.getState().token) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);
