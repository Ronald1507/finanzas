/**
 * URLs de los endpoints del API backend.
 * Centraliza las 20 rutas para evitar strings dispersos en services.
 *
 * @module config/apisUrl
 */
export const API_URLS = {
    // GestionCuentas
    CUENTAS: '/cuentas',
    CUENTAS_BY_ID: (id) => `/cuentas/${id}`,
    CUENTAS_SALDO_INICIAL: (id) => `/cuentas/${id}/saldo-inicial`,
    CUENTAS_DESACTIVAR: (id) => `/cuentas/${id}/desactivar`,

    // Movimientos
    MOVIMIENTOS: '/movimientos',
    MOVIMIENTOS_BY_ID: (id) => `/movimientos/${id}`,
    MOVIMIENTOS_TRANSFERENCIA: '/movimientos/transferencia',

    // Pendientes
    PENDIENTES: '/pendientes',
    PENDIENTES_BY_ID: (id) => `/pendientes/${id}`,
    PENDIENTES_CONCRETAR: (id) => `/pendientes/${id}/concretar`,
    PENDIENTES_ANULAR: (id) => `/pendientes/${id}/anular`,

    // GastosFijos
    GASTOS_FIJOS: '/gastos-fijos',
    GASTOS_FIJOS_BY_ID: (id) => `/gastos-fijos/${id}`,
    GASTOS_FIJOS_DESACTIVAR: (id) => `/gastos-fijos/${id}/desactivar`,
    GASTOS_FIJOS_POR_MES: (mesId) => `/gastos-fijos/mes/${mesId}`,
    GASTOS_FIJOS_PAGAR: (id) => `/gastos-fijos/${id}/pagar`,
    GASTOS_FIJOS_PAGO: (id, mesId) => `/gastos-fijos/${id}/pago/${mesId}`,

    // SaldosDashboard
    DASHBOARD: '/dashboard',

    // CierreMensual
    MESES: '/meses',
    MESES_CERRAR: (id) => `/meses/${id}/cerrar`,
    MESES_REABRIR: (id) => `/meses/${id}/reabrir`,
};
