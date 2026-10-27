/**
 * Hook para cargar los gastos fijos del mes con su estado de pago y totales.
 * Re-fetch automático al cambiar el mesId.
 *
 * @module features/GastosFijos/hooks/useGastosFijosMes
 */
import { useState, useEffect, useCallback } from 'react';
import { gastosFijosService } from '../services/gastosFijosService';
import { mapErrorResponse } from '../../../services/apiResponseMapper';

const TOTALES_VACIO = { estimado: 0, pagado: 0, pendientes: 0 };

/**
 * Hook que expone la lista mensual de gastos fijos y sus totales.
 *
 * @param {number|null} mesId - ID del mes seleccionado
 * @returns {Object}
 * @returns {Array} returns.items - Items del mes (gasto fijo + estado de pago)
 * @returns {Object} returns.totales - Totales del mes { estimado, pagado, pendientes }
 * @returns {boolean} returns.loading - Indicador de carga
 * @returns {string} returns.error - Mensaje de error
 * @returns {Function} returns.refresh - Recarga la lista del mes
 */
export default function useGastosFijosMes(mesId) {
    const [items, setItems] = useState([]);
    const [totales, setTotales] = useState(TOTALES_VACIO);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchItems = useCallback(async () => {
        if (!mesId) {
            setItems([]);
            setTotales(TOTALES_VACIO);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError('');
            const res = await gastosFijosService.getPorMes(mesId);
            if (res.success && res.data) {
                setItems(res.data.items || []);
                setTotales(res.data.totales || TOTALES_VACIO);
            } else if (!res.success) {
                setError(res.message || 'No se pudieron cargar los gastos fijos del mes.');
            }
        } catch (err) {
            setError(mapErrorResponse(err).message);
        } finally {
            setLoading(false);
        }
    }, [mesId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const refresh = useCallback(() => {
        fetchItems();
    }, [fetchItems]);

    const clearError = useCallback(() => setError(''), []);

    return { items, totales, loading, error, clearError, refresh };
}
