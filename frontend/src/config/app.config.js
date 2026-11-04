/**
 * Configuración global de la aplicación.
 *
 * @module config/app.config
 */
export const APP_CONFIG = {
    APP_NAME: import.meta.env.VITE_APP_NAME || 'Finanzas Personales',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Configuración de tablas
    DEFAULT_PAGE_SIZE: 15,
    MAX_PAGE_SIZE: 100,

    // Configuración de búsqueda
    SEARCH_DEBOUNCE_MS: 500,

    // Rutas de la SPA
    ROUTES: {
        HOME: '/',
        DASHBOARD: '/dashboard',
        CUENTAS: '/cuentas',
        MOVIMIENTOS: '/movimientos',
        PENDIENTES: '/pendientes',
        MESES: '/meses',
        CATEGORIAS: '/categorias',
    },
};
