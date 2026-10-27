/**
 * Definición de rutas de la SPA con lazy loading.
 * Todas las rutas se cargan bajo demanda (React.lazy + Suspense).
 *
 * @module app/routes
 */
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AppLayout from '../shared/components/AppLayout';
import { APP_CONFIG } from '../config/app.config';

// Lazy load de los módulos de cada feature
const DashboardModule = React.lazy(() =>
    import('../features/SaldosDashboard/DashboardModule')
);
const CuentasModule = React.lazy(() =>
    import('../features/GestionCuentas/CuentasModule')
);
const MovimientosModule = React.lazy(() =>
    import('../features/Movimientos/MovimientosModule')
);
const PendientesModule = React.lazy(() =>
    import('../features/Pendientes/PendientesModule')
);
const GastosFijosModule = React.lazy(() =>
    import('../features/GastosFijos/GastosFijosModule')
);
const MesesModule = React.lazy(() =>
    import('../features/CierreMensual/MesesModule')
);

/**
 * Fallback de carga mientras se resuelve el lazy load.
 *
 * @returns {JSX.Element}
 */
function LoadingFallback() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
        </Box>
    );
}

/**
 * Componente de rutas principal de la aplicación.
 *
 * @returns {JSX.Element}
 */
export default function AppRoutes() {
    return (
        <AppLayout>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path="/" element={<Navigate to={APP_CONFIG.ROUTES.DASHBOARD} replace />} />
                    <Route path={APP_CONFIG.ROUTES.DASHBOARD} element={<DashboardModule />} />
                    <Route path={APP_CONFIG.ROUTES.CUENTAS} element={<CuentasModule />} />
                    <Route path={APP_CONFIG.ROUTES.MOVIMIENTOS} element={<MovimientosModule />} />
                    <Route path={APP_CONFIG.ROUTES.PENDIENTES} element={<PendientesModule />} />
                    <Route path={APP_CONFIG.ROUTES.GASTOS_FIJOS} element={<GastosFijosModule />} />
                    <Route path={APP_CONFIG.ROUTES.MESES} element={<MesesModule />} />
                    <Route path="*" element={<Navigate to={APP_CONFIG.ROUTES.DASHBOARD} replace />} />
                </Routes>
            </Suspense>
        </AppLayout>
    );
}
