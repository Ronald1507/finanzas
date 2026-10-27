/**
 * Utilidades para formatear fechas en la aplicación.
 *
 * @module shared/utils/formatearFecha
 */

/**
 * Nombres de los meses en español.
 */
const MESES_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Formatea una fecha en formato legible para Chile.
 *
 * @param {string|Date} fecha - Fecha en formato ISO o Date
 * @returns {string} Fecha formateada (ej: "15/06/2025")
 */
export const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    const solo = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;
    const d = typeof solo === 'string' ? new Date(solo + 'T00:00:00') : solo;
    if (isNaN(d.getTime())) return '-';
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
};

/**
 * Formatea un mes como texto legible (ej: "Junio 2025").
 *
 * @param {number} anio - Año (ej: 2025)
 * @param {number} mes - Mes numérico 1-12
 * @returns {string} Texto del mes
 */
export const formatearMes = (anio, mes) => {
    if (!anio || !mes) return '-';
    return `${MESES_ES[mes - 1]} ${anio}`;
};

/**
 * Formatea una fecha ISO a string de input date (YYYY-MM-DD).
 *
 * @param {string|Date} fecha
 * @returns {string}
 */
export const fechaParaInput = (fecha) => {
    if (!fecha) return '';
    const solo = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;
    const d = typeof solo === 'string' ? new Date(solo + 'T00:00:00') : solo;
    if (isNaN(d.getTime())) return '';
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

/**
 * Retorna la fecha actual en formato YYYY-MM-DD para inputs.
 *
 * @returns {string}
 */
export const hoyParaInput = () => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};
