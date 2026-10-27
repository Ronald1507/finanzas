/**
 * Dialog para concretar un pendiente, solicitando la fecha de concreción.
 * Dialog controlado: todo el estado y la llamada al service viven en el orquestador (PendientesModule).
 * No importa hooks ni llama al service directamente.
 *
 * @module features/Pendientes/components/ConcretarPendienteDialog
 */
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Typography,
} from '@mui/material';

/**
 * Dialog para concretar un pendiente.
 *
 * @param {Object} props
 * @param {boolean} props.open - Si el dialog está abierto
 * @param {Object|null} props.pendiente - Pendiente a concretar
 * @param {string} props.fecha - Valor actual del campo fecha
 * @param {Function} props.onFechaChange - Callback al cambiar la fecha
 * @param {Object|null} props.errors - Errores de validación del servidor
 * @param {boolean} props.saving - Indicador de guardado en progreso
 * @param {Function} props.onSave - Callback para confirmar la concreción
 * @param {Function} props.onClose - Callback para cerrar el dialog
 * @returns {JSX.Element}
 */
export default function ConcretarPendienteDialog({
    open,
    pendiente,
    fecha,
    onFechaChange,
    errors,
    saving,
    onSave,
    onClose,
}) {
    return (
        <Dialog
            open={open}
            onClose={() => { /* no cerrar con click afuera */ }}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle id="pendientes-concretar-dialog-titulo">
                Concretar Pendiente
            </DialogTitle>
            <DialogContent>
                {pendiente && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        <strong>{pendiente.descripcion}</strong> —
                        {pendiente.tipo === 'por_pagar' ? ' Por Pagar' : ' Por Recibir'}
                    </Typography>
                )}
                {errors?.general && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.general}
                    </Alert>
                )}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Fecha de concreción"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={fecha}
                    onChange={(e) => onFechaChange(e.target.value)}
                    error={!!errors?.fecha}
                    helperText={errors?.fecha ? errors.fecha[0] : 'Fecha en que se realizó el pago/cobro real'}
                    sx={{ mt: 1 }}
                    id="pendientes-concretar-input-fecha"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 'data-testid': 'pendientes-concretar-input-fecha' }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    disabled={saving}
                    id="pendientes-concretar-btn-cancelar"
                    data-testid="pendientes-concretar-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={onSave}
                    variant="contained"
                    color="success"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    id="pendientes-concretar-btn-confirmar"
                    data-testid="pendientes-concretar-btn-confirmar"
                >
                    {saving ? 'Concretando...' : 'Concretar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
