/**
 * Constantes globales para los tests E2E de Finanzas Personales.
 * No hay autenticación — la app es de un solo usuario sin login.
 */

/** URL base del frontend en modo test */
export const FRONTEND_URL = 'http://localhost:5174';

/** URL base de la API en modo test (backend en puerto 8005) */
export const API_BASE = process.env.VITE_API_URL ?? 'http://localhost:8005/api';

// ── Rutas SPA ──────────────────────────────────────────────────────────────
export const ROUTES = {
    DASHBOARD: '/dashboard',
    CUENTAS: '/cuentas',
    MOVIMIENTOS: '/movimientos',
    PENDIENTES: '/pendientes',
    MESES: '/meses',
} as const;

// ── Datos de mes mock ──────────────────────────────────────────────────────
export const MES_ABIERTO_MOCK = {
    id: 1,
    anio: 2026,
    mes: 6,
    estado: 'abierto',
    fecha_cierre: null,
};

export const MES_CERRADO_MOCK = {
    id: 1,
    anio: 2026,
    mes: 5,
    estado: 'cerrado',
    fecha_cierre: '2026-05-31',
};

// ── Envelope de respuesta API ──────────────────────────────────────────────
/**
 * Envuelve datos en el envelope ResponseUtils de Laravel para mocks.
 * El httpClient del frontend llama a mapSuccessResponse(response.data),
 * que lee response.data → data.data, retornando { success: true, data }.
 */
export function successEnvelope(data: unknown) {
    return { status: 'success', data };
}

export function paginatedEnvelope(items: unknown[], total = 1) {
    return successEnvelope({
        data: items,
        meta: {
            current_page: 1,
            per_page: 15,
            total: total || items.length,
            last_page: 1,
        },
    });
}

export function errorEnvelope(message: string, errors: Record<string, string[]> = {}) {
    return { status: 'error', message, errors };
}
