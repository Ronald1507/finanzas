/**
 * Estado vacío del dashboard cuando el mes solicitado no tiene datos.
 * Muestra aviso y CTA para ir a la sección de cierre mensual.
 *
 * @module features/SaldosDashboard/components/MesSinDatos
 */
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../../config/app.config';

/**
 * Componente de estado vacío del dashboard para meses sin inicializar.
 * Ocurre cuando se navega a un mes futuro que aún no ha sido creado por el backend.
 *
 * @param {Object} props
 * @param {number} props.anio - Año del mes sin datos
 * @param {number} props.mes - Número del mes sin datos
 * @returns {JSX.Element}
 */
export default function MesSinDatos({ anio, mes }) {
    const navigate = useNavigate();

    const MESES_ES = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const nombreMes = anio && mes ? `${MESES_ES[mes - 1]} ${anio}` : 'este mes';

    return (
        <Paper
            sx={{
                p: 6,
                textAlign: 'center',
                mt: 4,
                mx: 'auto',
                maxWidth: 480,
            }}
        >
            <CalendarMonthIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
                {nombreMes} no tiene datos aún
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Este mes no ha sido inicializado. Para crear este mes, primero debes cerrar el mes anterior
                desde la sección de Cierre Mensual.
            </Typography>
            <Button
                variant="contained"
                onClick={() => navigate(APP_CONFIG.ROUTES.MESES)}
                id="dashboard-btn-ir-cierre"
                data-testid="dashboard-btn-ir-cierre"
            >
                Ir a Cierre Mensual
            </Button>
        </Paper>
    );
}
