/**
 * Dialog para crear o editar un movimiento financiero.
 *
 * @module features/Movimientos/components/MovimientoDialog
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
    Box,
} from '@mui/material';
import ComboBox from '../../../shared/components/ComboBox';
import { hoyParaInput, fechaParaInput } from '../../../shared/utils/formatearFecha';

/**
 * Dialog para crear/editar movimiento.
 *
 * @param {Object} props
 * @param {Object} props.dialogState - Estado de useDialogState
 * @param {Array} props.cuentas - Lista plana de cuentas activas
 * @param {boolean} props.mesAbierto - Si el mes está abierto
 * @returns {JSX.Element}
 */
export default function MovimientoDialog({ dialogState, cuentas = [], categorias = [], mesAbierto }) {
    const { open, formData, errors, saving, close, setField, save } = dialogState;
    const esEdicion = !!formData.id;
    const esTransferencia = !!formData.movimiento_relacionado_id;

    return (
        <Dialog
            open={open}
            onClose={() => { /* no cerrar con click afuera */ }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="movimientos-dialog-titulo">
                {esEdicion ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            </DialogTitle>
            <DialogContent>
                {!mesAbierto && (
                    <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>
                        El mes seleccionado está cerrado. No se pueden editar movimientos.
                    </Alert>
                )}
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
                    testId="movimientos-select-cuenta"
                />

                <ComboBox
                    label="Tipo"
                    required
                    sx={{ mt: 2 }}
                    options={[{ value: 'ingreso', label: 'Ingreso' }, { value: 'egreso', label: 'Egreso' }]}
                    value={formData.tipo || ''}
                    onChange={(v) => setField('tipo', v)}
                    error={errors?.tipo?.[0]}
                    testId="movimientos-select-tipo"
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
                    helperText={
                        esTransferencia
                            ? 'Monto de transferencia. Para corregirlo, elimine el par y recree la transferencia.'
                            : (errors?.monto ? errors.monto[0] : 'Monto mayor a 0')
                    }
                    disabled={esTransferencia}
                    sx={{ mt: 2 }}
                    id="movimientos-input-monto"
                    inputProps={{ min: 0.01, step: '0.01', 'data-testid': 'movimientos-input-monto' }}
                />

                {esTransferencia && (
                    <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                        Este movimiento forma parte de una transferencia. El monto no puede editarse.
                    </Typography>
                )}

                <TextField
                    required
                    margin="dense"
                    label="Fecha"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={formData.fecha || hoyParaInput()}
                    onChange={(e) => setField('fecha', e.target.value)}
                    error={!!errors?.fecha}
                    helperText={errors?.fecha ? errors.fecha[0] : ''}
                    sx={{ mt: 2 }}
                    id="movimientos-input-fecha"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 'data-testid': 'movimientos-input-fecha' }}
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
                    helperText={errors?.descripcion ? errors.descripcion[0] : 'Ej: Pago arriendo'}
                    sx={{ mt: 2 }}
                    id="movimientos-input-descripcion"
                    inputProps={{ 'data-testid': 'movimientos-input-descripcion' }}
                />

                <TextField
                    margin="dense"
                    label="Observación"
                    fullWidth
                    multiline
                    minRows={2}
                    variant="outlined"
                    value={formData.observacion || ''}
                    onChange={(e) => setField('observacion', e.target.value)}
                    error={!!errors?.observacion}
                    helperText={errors?.observacion ? errors.observacion[0] : 'Notas adicionales...'}
                    sx={{ mt: 2 }}
                    inputProps={{ 'data-testid': 'movimientos-input-observacion' }}
                />

                <ComboBox
                    label="Categoría"
                    sx={{ mt: 2 }}
                    options={categorias.map((c) => ({ value: c.id, label: c.nombre, color: c.color }))}
                    value={formData.categoria_id || ''}
                    onChange={(v) => setField('categoria_id', v)}
                    error={errors?.categoria_id?.[0]}
                    testId="movimientos-select-categoria"
                    renderOption={(props, option) => (
                        <Box component="li" {...props}>
                            <Box
                                sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    backgroundColor: option.color || '#9E9E9E',
                                    flexShrink: 0,
                                    mr: 1,
                                }}
                            />
                            {option.label}
                        </Box>
                    )}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={close}
                    disabled={saving}
                    id="movimientos-dialog-btn-cancelar"
                    data-testid="movimientos-dialog-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={() => save((data) => ({
                        cuenta_id: data.cuenta_id ? parseInt(data.cuenta_id) : null,
                        tipo: data.tipo,
                        monto: parseFloat(data.monto) || 0,
                        fecha: data.fecha,
                        descripcion: data.descripcion,
                        observacion: data.observacion || null,
                        categoria_id: data.categoria_id ? parseInt(data.categoria_id) : null,
                    }))}
                    variant="contained"
                    disabled={saving || !mesAbierto}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    id="movimientos-dialog-btn-guardar"
                    data-testid="movimientos-dialog-btn-guardar"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
