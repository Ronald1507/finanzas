/**
 * Providers globales de la aplicación: Theme MUI y BrowserRouter.
 *
 * @module app/providers
 */
import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { BrowserRouter } from 'react-router-dom';
import 'dayjs/locale/es';
import { theme } from '../styles/theme';

/**
 * Envuelve la aplicación con los providers globales necesarios.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export default function Providers({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                <BrowserRouter>
                    {children}
                </BrowserRouter>
            </LocalizationProvider>
        </ThemeProvider>
    );
}
