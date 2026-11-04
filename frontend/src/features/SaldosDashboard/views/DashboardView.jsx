/**
 * Vista del dashboard de saldos mensuales.
 * Recibe datos de useDashboard por props y compone los subcomponentes.
 *
 * @module features/SaldosDashboard/views/DashboardView
 */
import React from 'react';
import { Box, Alert } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader';
import MonthNavigator from '../../../shared/components/MonthNavigator';
import ConsolidadoCards from '../components/ConsolidadoCards';
import CuentasSaldosTable from '../components/CuentasSaldosTable';
import MesSinDatos from '../components/MesSinDatos';
import PresupuestosWidget from '../components/PresupuestosWidget';

export default function DashboardView({
    mes,
    consolidado,
    cuentas,
    presupuestos = [],
    loading,
    error,
    mesSinDatos,
    mesSeleccionado,
}) {
    const mesCerrado = mes?.estado === 'cerrado';

    return (
        <Box>
            <PageHeader
                title="Dashboard de Saldos"
                subtitle="Resumen financiero mensual por cuenta"
            />
            <MonthNavigator />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {mesSinDatos ? (
                <MesSinDatos anio={mesSeleccionado?.anio} mes={mesSeleccionado?.mes} />
            ) : (
                <>
                    <ConsolidadoCards
                        consolidado={consolidado}
                        loading={loading}
                        mesCerrado={mesCerrado}
                    />
                    <CuentasSaldosTable
                        cuentas={cuentas}
                        loading={loading}
                        mesCerrado={mesCerrado}
                    />
                    <PresupuestosWidget presupuestos={presupuestos} />
                </>
            )}
        </Box>
    );
}
