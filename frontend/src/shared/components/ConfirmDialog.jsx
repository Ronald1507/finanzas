/**
 * Dialog de confirmación genérico para operaciones destructivas.
 *
 * @module shared/components/ConfirmDialog
 */
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    CircularProgress,
} from '@mui/material';

/**
 * Dialog de confirmación para acciones destructivas o irreversibles.
 *
 * @param {Object} props
 * @param {boolean} props.open - Si el dialog está abierto
 * @param {string} props.title - Título del dialog
 * @param {string} props.message - Mensaje de confirmación
 * @param {Function} props.onConfirm - Callback al confirmar
 * @param {Function} props.onCancel - Callback al cancelar
 * @param {string} [props.confirmLabel='Confirmar'] - Texto del botón confirmar
 * @param {string} [props.confirmColor='error'] - Color del botón confirmar
 * @param {boolean} [props.loading=false] - Indicador de carga al confirmar
 * @returns {JSX.Element}
 */
export default function ConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Confirmar',
    confirmColor = 'error',
    loading = false,
}) {
    return (
        <Dialog open={open} onClose={() => { /* no cerrar con click afuera */ }} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    color={confirmColor}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : null}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
