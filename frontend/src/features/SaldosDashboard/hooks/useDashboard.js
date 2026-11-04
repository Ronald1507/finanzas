/**
 * Hook para cargar y exponer los datos del dashboard de saldos.
 * Consume el mes seleccionado del store global useMesStore.
 *
 * @module features/SaldosDashboard/hooks/useDashboard
 */
import { useState, useEffect, useCallback } from 'react';
import useMesStore from '../../../shared/hooks/useMesStore';
import { dashboardService } from '../services/dashboardService';

/**
 * Hook del dashboard de saldos mensuales.
 *
 * @returns {Object}
 * @returns {Object|null} returns.mes - Datos del mes actual (null si no existe)
 * @returns {Object|null} returns.consolidado - Saldos consolidados de todas las cuentas
 * @returns {Array} returns.cuentas - Saldos por cuenta individual
 * @returns {boolean} returns.loading - Indicador de carga
 * @returns {string|null} returns.error - Mensaje de error
 * @returns {Function} returns.refresh - Recarga los datos
 * @returns {boolean} returns.mesSinDatos - Si el mes no tiene datos (futuro/sin inicializar)
 */
export default function useDashboard() {
    const mesSeleccionado = useMesStore((s) => s.mesSeleccionado);

    const [mes, setMes] = useState(null);
    const [consolidado, setConsolidado] = useState(null);
    const [cuentas, setCuentas] = useState([]);
    const [presupuestos, setPresupuestos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mesSinDatos, setMesSinDatos] = useState(false);

    const cargar = useCallback(async () => {
        if (!mesSeleccionado?.anio || !mesSeleccionado?.mes) return;

        // Mes virtual futuro (sin id en store)
        if (!mesSeleccionado.id && mesSeleccionado.estado === 'futuro') {
            setMesSinDatos(true);
            setMes(null);
            setConsolidado(null);
            setCuentas([]);
            setPresupuestos([]);
            return;
        }

        setLoading(true);
        setError(null);
        setMesSinDatos(false);
        try {
            const res = await dashboardService.getDashboard(mesSeleccionado.anio, mesSeleccionado.mes);
            if (res.success) {
                const data = res.data;
                if (!data.mes) {
                    // El backend indica que el mes no existe aún
                    setMesSinDatos(true);
                    setMes(null);
                    setConsolidado(null);
                    setCuentas([]);
                    setPresupuestos([]);
                } else {
                    setMesSinDatos(false);
                    setMes(data.mes);
                    setConsolidado(data.consolidado || null);
                    setCuentas(data.cuentas || []);
                    setPresupuestos(data.presupuestos || []);
                }
            }
        } catch (err) {
            setError('Error al cargar el dashboard.');
            console.error('useDashboard error:', err);
        } finally {
            setLoading(false);
        }
    }, [mesSeleccionado?.anio, mesSeleccionado?.mes, mesSeleccionado?.id]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    return {
        mes,
        consolidado,
        cuentas,
        presupuestos,
        loading,
        error,
        refresh: cargar,
        mesSinDatos,
    };
}
