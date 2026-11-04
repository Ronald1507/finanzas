/**
 * URLs de los endpoints del API backend.
 * Centraliza las 14 rutas para evitar strings dispersos en services.
 *
 * @module config/apisUrl
 */
export const API_URLS = {
    // GestionCategorias
    CATEGORIAS: '/categorias',
    CATEGORIAS_BY_ID: (id) => `/categorias/${id}`,

    // GestionCuentas
    CUENTAS: '/cuentas',
    CUENTAS_BY_ID: (id) => `/cuentas/${id}`,
    CUENTAS_SALDO_INICIAL: (id) => `/cuentas/${id}/saldo-inicial`,
    CUENTAS_DESACTIVAR: (id) => `/cuentas/${id}/desactivar`,

    // Movimientos
    MOVIMIENTOS: '/movimientos',
    MOVIMIENTOS_BY_ID: (id) => `/movimientos/${id}`,
    MOVIMIENTOS_TRANSFERENCIA: '/movimientos/transferencia',
    MOVIMIENTOS_BUSCAR: '/movimientos/buscar',

    // Pendientes
    PENDIENTES: '/pendientes',
    PENDIENTES_BY_ID: (id) => `/pendientes/${id}`,
    PENDIENTES_CONCRETAR: (id) => `/pendientes/${id}/concretar`,
    PENDIENTES_ANULAR: (id) => `/pendientes/${id}/anular`,

    // Presupuestos
    PRESUPUESTOS: '/presupuestos',
    PRESUPUESTOS_BY_ID: (id) => `/presupuestos/${id}`,

    // Reportes
    REPORTES_RESUMEN_MENSUAL: '/reportes/resumen-mensual',
    REPORTES_EVOLUCION_ANUAL: '/reportes/evolucion-anual',
    REPORTES_GASTOS_CATEGORIA: '/reportes/gastos-categoria',

    // SaldosDashboard
    DASHBOARD: '/dashboard',

    // CierreMensual
    MESES: '/meses',
    MESES_CERRAR: (id) => `/meses/${id}/cerrar`,
    MESES_REABRIR: (id) => `/meses/${id}/reabrir`,
};
