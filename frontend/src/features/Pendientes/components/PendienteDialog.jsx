/**
 * Dialog para crear o editar un pendiente (por pagar o por recibir).
 *
 * @module features/Pendientes/components/PendienteDialog
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
 * Dialog para crear/editar pendiente.
 *
 * @param {Object} props
 * @param {Object} props.dialogState - Estado de useDialogState
 * @param {Array} props.cuentas - Lista plana de cuentas activas
 * @returns {JSX.Element}
 */
export default function PendienteDialog({ dialogState, cuentas = [] }) {
    const { open, formData, errors, saving, close, setField, save } = dialogState;
    const esEdicion = !!formData.id;

    return (
        <Dialog
            open={open}
            onClose={() => { /* no cerrar con click afuera */ }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="pendientes-dialog-titulo">
                {esEdicion ? 'Editar Pendiente' : 'Nuevo Pendiente'}
            </DialogTitle>
            <DialogContent>
                {errors?.general && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                        {errors.general}
                    </Alert>
                )}

                <ComboBox
                    label="Cuenta"
                    required
                    sx={{ mt: 2 }}
                    options={cuentas.map((c) => ({ value: c.id, label: c.nombre }))}
                    value={formData.cuenta_id || ''}
                    onChange={(v) => setField('cuenta_id', v)}
                    error={errors?.cuenta_id?.[0]}
                    testId="pendientes-select-cuenta"
                />

                <ComboBox
                    label="Tipo"
                    required
                    sx={{ mt: 2 }}
                    options={[{ value: 'por_pagar', label: 'Por Pagar' }, { value: 'por_recibir', label: 'Por Recibir' }]}
                    value={formData.tipo || ''}
                    onChange={(v) => setField('tipo', v)}
                    error={errors?.tipo?.[0]}
                    testId="pendientes-select-tipo"
                />

                <TextField
                    required
                    margin="dense"
                    label="Monto"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={formData.monto || ''}
                    onChange={(e) => setField('monto', e.target.value)}
                    error={!!errors?.monto}
                    helperText={errors?.monto ? errors.monto[0] : 'Monto mayor a 0'}
                    sx={{ mt: 2 }}
                    id="pendientes-input-monto"
                    inputProps={{ min: 0.01, step: '0.01', 'data-testid': 'pendientes-input-monto' }}
                />

                <TextField
                    required
                    margin="dense"
                    label="Descripción"
                    fullWidth
                    variant="outlined"
                    value={formData.descripcion || ''}
                    onChange={(e) => setField('descripcion', e.target.value)}
                    error={!!errors?.descripcion}
                    helperText={errors?.descripcion ? errors.descripcion[0] : 'Ej: Pago de servicios pendiente'}
                    sx={{ mt: 2 }}
                    id="pendientes-input-descripcion"
                    inputProps={{ 'data-testid': 'pendientes-input-descripcion' }}
                />

                <TextField
                    margin="dense"
                    label="Fecha estimada"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={formData.fecha_estimada || ''}
                    onChange={(e) => setField('fecha_estimada', e.target.value)}
                    error={!!errors?.fecha_estimada}
                    helperText={errors?.fecha_estimada ? errors.fecha_estimada[0] : 'Fecha estimada de pago/cobro'}
                    sx={{ mt: 2 }}
                    id="pendientes-input-fecha-estimada"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 'data-testid': 'pendientes-input-fecha-estimada' }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={close}
                    disabled={saving}
                    id="pendientes-dialog-btn-cancelar"
                    data-testid="pendientes-dialog-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={() => save((data) => ({
                        cuenta_id: data.cuenta_id ? parseInt(data.cuenta_id) : null,
                        tipo: data.tipo,
                        monto: parseFloat(data.monto) || 0,
                        descripcion: data.descripcion,
                        fecha_estimada: data.fecha_estimada,
                    }))}
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    id="pendientes-dialog-btn-guardar"
                    data-testid="pendientes-dialog-btn-guardar"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
