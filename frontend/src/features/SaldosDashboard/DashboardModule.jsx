/**
 * Orquestador del módulo SaldosDashboard.
 *
 * @module features/SaldosDashboard/DashboardModule
 */
import React from 'react';
import { Box } from '@mui/material';
import useDashboard from './hooks/useDashboard';
import useMesStore from '../../shared/hooks/useMesStore';
import DashboardView from './views/DashboardView';

/**
 * Orquestador del dashboard de saldos mensuales.
 *
 * @returns {JSX.Element}
 */
export default function DashboardModule() {
    const mesSeleccionado = useMesStore((s) => s.mesSeleccionado);
    const { mes, consolidado, cuentas, presupuestos, loading, error, mesSinDatos } = useDashboard();

    return (
        <Box>
            <DashboardView
                mes={mes}
                consolidado={consolidado}
                cuentas={cuentas}
                presupuestos={presupuestos}
                loading={loading}
                error={error}
                mesSinDatos={mesSinDatos}
                mesSeleccionado={mesSeleccionado}
            />
        </Box>
    );
}
