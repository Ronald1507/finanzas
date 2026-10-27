/**
 * Utilidades para formatear montos en pesos chilenos (CLP).
 *
 * @module shared/utils/formatearMoneda
 */

/**
 * Formatea un número como moneda CLP.
 *
 * @param {number|string} monto - Monto a formatear
 * @returns {string} Monto formateado (ej: "$1.250.000")
 */
export const formatearMoneda = (monto) => {
    const valor = typeof monto === 'string' ? parseFloat(monto) : monto;
    if (isNaN(valor)) return '$0';
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(valor);
};

/**
 * Formatea un número como monto sin símbolo de moneda.
 *
 * @param {number|string} monto - Monto a formatear
 * @returns {string} Monto formateado sin símbolo (ej: "1.250.000")
 */
export const formatearNumero = (monto) => {
    const valor = typeof monto === 'string' ? parseFloat(monto) : monto;
    if (isNaN(valor)) return '0';
    return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(valor);
};
