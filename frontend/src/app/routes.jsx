import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AppLayout from '../shared/components/AppLayout';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import LoginPage from '../features/Auth/LoginPage';
import RegisterPage from '../features/Auth/RegisterPage';
import { APP_CONFIG } from '../config/app.config';

const DashboardModule    = React.lazy(() => import('../features/SaldosDashboard/DashboardModule'));
const CuentasModule      = React.lazy(() => import('../features/GestionCuentas/CuentasModule'));
const MovimientosModule  = React.lazy(() => import('../features/Movimientos/MovimientosModule'));
const PendientesModule   = React.lazy(() => import('../features/Pendientes/PendientesModule'));
const MesesModule        = React.lazy(() => import('../features/CierreMensual/MesesModule'));
const CategoriasModule   = React.lazy(() => import('../features/GestionCategorias/CategoriasModule'));
const PresupuestosModule = React.lazy(() => import('../features/Presupuestos/PresupuestosModule'));
const ReportesModule     = React.lazy(() => import('../features/Reportes/ReportesModule'));

function LoadingFallback() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
        </Box>
    );
}

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path={APP_CONFIG.ROUTES.LOGIN}    element={<LoginPage />} />
            <Route path={APP_CONFIG.ROUTES.REGISTER} element={<RegisterPage />} />

            {/* Protected */}
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <AppLayout>
                            <Suspense fallback={<LoadingFallback />}>
                                <Routes>
                                    <Route path="/"  element={<Navigate to={APP_CONFIG.ROUTES.DASHBOARD} replace />} />
                                    <Route path={APP_CONFIG.ROUTES.DASHBOARD}    element={<DashboardModule />} />
                                    <Route path={APP_CONFIG.ROUTES.CUENTAS}      element={<CuentasModule />} />
                                    <Route path={APP_CONFIG.ROUTES.MOVIMIENTOS}  element={<MovimientosModule />} />
                                    <Route path={APP_CONFIG.ROUTES.PENDIENTES}   element={<PendientesModule />} />
                                    <Route path={APP_CONFIG.ROUTES.MESES}        element={<MesesModule />} />
                                    <Route path={APP_CONFIG.ROUTES.CATEGORIAS}   element={<CategoriasModule />} />
                                    <Route path={APP_CONFIG.ROUTES.PRESUPUESTOS} element={<PresupuestosModule />} />
                                    <Route path={APP_CONFIG.ROUTES.REPORTES}     element={<ReportesModule />} />
                                    <Route path="*" element={<Navigate to={APP_CONFIG.ROUTES.DASHBOARD} replace />} />
                                </Routes>
                            </Suspense>
                        </AppLayout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}
