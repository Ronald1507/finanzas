/**
 * Snackbar de error para mostrar mensajes de fallo fuera de dialogs.
 *
 * @module shared/components/ErrorSnackbar
 */
import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * Snackbar de error que muestra una alerta roja ante fallos de API.
 *
 * @param {Object} props
 * @param {string} props.message - Mensaje a mostrar (vacío = no se muestra)
 * @param {Function} props.onClose - Callback para cerrar
 * @param {number} [props.duration=6000] - Duración en milisegundos
 * @returns {JSX.Element}
 */
export default function ErrorSnackbar({ message, onClose, duration = 6000 }) {
    return (
        <Snackbar
            open={!!message}
            autoHideDuration={duration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert
                onClose={onClose}
                severity="error"
                variant="filled"
                elevation={6}
                sx={{ width: '100%', alignItems: 'center' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}
