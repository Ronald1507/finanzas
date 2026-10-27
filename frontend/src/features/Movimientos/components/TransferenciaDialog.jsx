/**
 * Dialog para registrar una transferencia entre dos cuentas propias.
 * Dialog controlado: todo el estado y la llamada al service viven en el orquestador (MovimientosModule).
 * No importa hooks ni llama al service directamente.
 *
 * @module features/Movimientos/components/TransferenciaDialog
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
} from '@mui/material';
import ComboBox from '../../../shared/components/ComboBox';

/**
 * Dialog de transferencia entre cuentas.
 *
 * @param {Object} props
 * @param {boolean} props.open - Si el dialog está abierto
 * @param {Array} props.cuentas - Lista plana de cuentas activas
 * @param {Object} props.formData - Valores del formulario {cuenta_origen_id, cuenta_destino_id, monto, fecha, descripcion}
 * @param {Function} props.setField - Callback para actualizar un campo individual (field, value)
 * @param {Object|null} props.errors - Errores de validación del servidor
 * @param {boolean} props.saving - Indicador de guardado en progreso
 * @param {Function} props.onSave - Callback para confirmar la transferencia
 * @param {Function} props.onClose - Callback para cerrar el dialog
 * @returns {JSX.Element}
 */
export default function TransferenciaDialog({
    open,
    cuentas = [],
    formData,
    setField,
    errors,
    saving,
    onSave,
    onClose,
}) {
    return (
        <Dialog
            open={open}
            onClose={() => { /* no cerrar con click afuera */ }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="movimientos-transferencia-dialog-titulo">
                Nueva Transferencia
            </DialogTitle>
            <DialogContent>
                {errors?.general && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                        {errors.general}
                    </Alert>
                )}

                <ComboBox
                    label="Cuenta Origen"
                    required
                    sx={{ mt: 2 }}
                    options={cuentas.map((c) => ({ value: c.id, label: c.nombre }))}
                    value={formData.cuenta_origen_id || ''}
                    onChange={(v) => setField('cuenta_origen_id', v)}
                    error={errors?.cuenta_origen_id?.[0]}
                    testId="movimientos-transferencia-select-origen"
                    getOptionDisabled={(o) => String(o.value) === String(formData.cuenta_destino_id)}
                />

                <ComboBox
                    label="Cuenta Destino"
                    required
                    sx={{ mt: 2 }}
                    options={cuentas.map((c) => ({ value: c.id, label: c.nombre }))}
                    value={formData.cuenta_destino_id || ''}
                    onChange={(v) => setField('cuenta_destino_id', v)}
                    error={errors?.cuenta_destino_id?.[0]}
                    testId="movimientos-transferencia-select-destino"
                    getOptionDisabled={(o) => String(o.value) === String(formData.cuenta_origen_id)}
                />

                <TextField
                    required
                    margin="dense"
                    label="Monto"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={formData.monto}
                    onChange={(e) => setField('monto', e.target.value)}
                    error={!!errors?.monto}
                    helperText={errors?.monto ? errors.monto[0] : 'Monto a transferir'}
                    sx={{ mt: 2 }}
                    id="movimientos-transferencia-input-monto"
                    inputProps={{ min: 0.01, step: '0.01', 'data-testid': 'movimientos-transferencia-input-monto' }}
                />

                <TextField
                    required
                    margin="dense"
                    label="Fecha"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={formData.fecha}
                    onChange={(e) => setField('fecha', e.target.value)}
                    error={!!errors?.fecha}
                    helperText={errors?.fecha ? errors.fecha[0] : ''}
                    sx={{ mt: 2 }}
                    id="movimientos-transferencia-input-fecha"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 'data-testid': 'movimientos-transferencia-input-fecha' }}
                />

                <TextField
                    margin="dense"
                    label="Descripción"
                    fullWidth
                    variant="outlined"
                    value={formData.descripcion}
                    onChange={(e) => setField('descripcion', e.target.value)}
                    error={!!errors?.descripcion}
                    helperText={errors?.descripcion ? errors.descripcion[0] : 'Ej: Pago entre cuentas'}
                    sx={{ mt: 2 }}
                    id="movimientos-transferencia-input-descripcion"
                    inputProps={{ 'data-testid': 'movimientos-transferencia-input-descripcion' }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    disabled={saving}
                    id="movimientos-transferencia-btn-cancelar"
                    data-testid="movimientos-transferencia-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={onSave}
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    id="movimientos-transferencia-btn-guardar"
                    data-testid="movimientos-transferencia-btn-guardar"
                >
                    {saving ? 'Guardando...' : 'Registrar Transferencia'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
