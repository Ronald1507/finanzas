/**
 * Snackbar de éxito para confirmar acciones completadas.
 *
 * @module shared/components/SuccessSnackbar
 */
import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * Snackbar de éxito que muestra una alerta verde al completar una acción.
 *
 * @param {Object} props
 * @param {string} props.message - Mensaje a mostrar (vacío = no se muestra)
 * @param {Function} props.onClose - Callback para cerrar
 * @param {number} [props.duration=4000] - Duración en milisegundos
 * @returns {JSX.Element}
 */
export default function SuccessSnackbar({ message, onClose, duration = 4000 }) {
    return (
        <Snackbar
            open={!!message}
            autoHideDuration={duration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert
                onClose={onClose}
                severity="success"
                variant="filled"
                elevation={6}
                sx={{ width: '100%', alignItems: 'center' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}
