/**
 * Hook para gestionar la lista de meses y acciones de cierre/reapertura.
 * Al éxito refresca el store global de meses.
 *
 * @module features/CierreMensual/hooks/useMeses
 */
import { useState, useCallback, useEffect } from 'react';
import useMesStore from '../../../shared/hooks/useMesStore';
import { mesesService } from '../services/mesesService';

/**
 * Hook del módulo CierreMensual.
 *
 * @returns {Object}
 * @returns {Array} returns.meses - Lista de meses
 * @returns {boolean} returns.loading - Indicador de carga de la lista
 * @returns {boolean} returns.cerrando - Indicador de cierre en progreso
 * @returns {boolean} returns.reabriendo - Indicador de reapertura en progreso
 * @returns {string|null} returns.error - Error de la última operación
 * @returns {Function} returns.cerrar - Cierra un mes por ID
 * @returns {Function} returns.reabrir - Reabre un mes por ID
 * @returns {Function} returns.refresh - Recarga la lista
 */
export default function useMeses() {
    const [meses, setMeses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cerrando, setCerrando] = useState(false);
    const [reabriendo, setReabriendo] = useState(false);
    const [error, setError] = useState(null);

    const cargarMesesStore = useMesStore((s) => s.cargarMeses);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await mesesService.getList();
            if (res.success && Array.isArray(res.data)) {
                setMeses(res.data);
            }
        } catch (err) {
            setError('Error al cargar los meses.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const cerrar = useCallback(async (id) => {
        setCerrando(true);
        setError(null);
        try {
            await mesesService.cerrar(id);
            // Resincronizar store global y lista local
            await cargarMesesStore(mesesService.getList);
            await cargar();
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al cerrar el mes.';
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setCerrando(false);
        }
    }, [cargar, cargarMesesStore]);

    const reabrir = useCallback(async (id) => {
        setReabriendo(true);
        setError(null);
        try {
            await mesesService.reabrir(id);
            await cargarMesesStore(mesesService.getList);
            await cargar();
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al reabrir el mes.';
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setReabriendo(false);
        }
    }, [cargar, cargarMesesStore]);

    return {
        meses,
        loading,
        cerrando,
        reabriendo,
        error,
        cerrar,
        reabrir,
        refresh: cargar,
    };
}
