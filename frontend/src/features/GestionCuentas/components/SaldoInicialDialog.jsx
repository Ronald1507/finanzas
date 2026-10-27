/**
 * Dialog para corregir el saldo inicial de una cuenta en el mes abierto.
 * Dialog controlado: todo el estado y la llamada al service viven en el orquestador (CuentasModule).
 * No importa hooks ni llama al service directamente.
 *
 * @module features/GestionCuentas/components/SaldoInicialDialog
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
 * Dialog para actualizar el saldo inicial de una cuenta.
 *
 * @param {Object} props
 * @param {boolean} props.open - Si el dialog está abierto
 * @param {Object|null} props.cuenta - Cuenta a actualizar
 * @param {string|number} props.saldoInicial - Valor actual del campo
 * @param {Function} props.onSaldoChange - Callback al cambiar el campo
 * @param {Object|null} props.errors - Errores de validación del servidor
 * @param {boolean} props.saving - Indicador de guardado en progreso
 * @param {Function} props.onSave - Callback para confirmar el guardado
 * @param {Function} props.onClose - Callback para cerrar el dialog
 * @returns {JSX.Element}
 */
export default function SaldoInicialDialog({
    open,
    cuenta,
    saldoInicial,
    onSaldoChange,
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
            <DialogTitle id="cuentas-dialog-saldo-titulo">
                Corregir Saldo Inicial
            </DialogTitle>
            <DialogContent>
                {cuenta && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Cuenta: <strong>{cuenta.nombre}</strong>
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
                    label="Saldo inicial"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={saldoInicial}
                    onChange={(e) => onSaldoChange(e.target.value)}
                    error={!!errors?.saldo_inicial}
                    helperText={errors?.saldo_inicial ? errors.saldo_inicial[0] : 'Nuevo saldo inicial para el mes abierto'}
                    sx={{ mt: 1 }}
                    id="cuentas-input-saldo-inicial-correccion"
                    inputProps={{ min: 0, 'data-testid': 'cuentas-input-saldo-inicial-correccion' }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    disabled={saving}
                    id="cuentas-saldo-dialog-btn-cancelar"
                    data-testid="cuentas-saldo-dialog-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={onSave}
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    id="cuentas-saldo-dialog-btn-guardar"
                    data-testid="cuentas-saldo-dialog-btn-guardar"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
