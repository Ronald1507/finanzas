/**
 * Dialog para crear o editar un gasto fijo del catálogo.
 *
 * @module features/GastosFijos/components/GastoFijoDialog
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
 * Dialog para crear/editar un gasto fijo (catálogo).
 *
 * @param {Object} props
 * @param {Object} props.dialogState - Estado del hook useDialogState
 * @param {Array} props.cuentas - Lista plana de cuentas activas
 * @returns {JSX.Element}
 */
export default function GastoFijoDialog({ dialogState, cuentas = [] }) {
    const { open, formData, errors, saving, close, setField, save } = dialogState;
    const esEdicion = !!formData.id;

    return (
        <Dialog
            open={open}
            onClose={() => { /* no cerrar con click afuera */ }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="gastos-fijos-dialog-titulo">
                {esEdicion ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}
            </DialogTitle>
            <DialogContent>
                {errors?.general && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                        {errors.general}
                    </Alert>
                )}

                <TextField
                    autoFocus
                    required
                    margin="dense"
                    label="Nombre"
                    fullWidth
                    variant="outlined"
                    value={formData.nombre || ''}
                    onChange={(e) => setField('nombre', e.target.value)}
                    error={!!errors?.nombre}
                    helperText={errors?.nombre ? errors.nombre[0] : 'Ej: Netflix, Luz, Internet'}
                    sx={{ mt: 2 }}
                    id="gastos-fijos-input-nombre"
                    inputProps={{ maxLength: 255, 'data-testid': 'gastos-fijos-input-nombre' }}
                />

                <TextField
                    margin="dense"
                    label="Monto estimado (opcional)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={formData.monto_estimado !== undefined ? formData.monto_estimado : ''}
                    onChange={(e) => setField('monto_estimado', e.target.value)}
                    error={!!errors?.monto_estimado}
                    helperText={errors?.monto_estimado ? errors.monto_estimado[0] : 'Monto de referencia, ej. luz ~$25.000'}
                    sx={{ mt: 2 }}
                    id="gastos-fijos-input-monto-estimado"
                    inputProps={{ min: 0, step: '0.01', 'data-testid': 'gastos-fijos-input-monto-estimado' }}
                />

                <ComboBox
                    label="Cuenta por defecto (opcional)"
                    sx={{ mt: 2 }}
                    placeholder="Sin cuenta por defecto"
                    options={cuentas.map((c) => ({ value: c.id, label: c.nombre }))}
                    value={formData.cuenta_id || ''}
                    onChange={(v) => setField('cuenta_id', v)}
                    error={errors?.cuenta_id?.[0]}
                    testId="gastos-fijos-select-cuenta"
                />

                <TextField
                    margin="dense"
                    label="Categoría (opcional)"
                    fullWidth
                    variant="outlined"
                    value={formData.categoria || ''}
                    onChange={(e) => setField('categoria', e.target.value)}
                    error={!!errors?.categoria}
                    helperText={errors?.categoria ? errors.categoria[0] : 'Por defecto: Gastos Fijos'}
                    sx={{ mt: 2 }}
                    id="gastos-fijos-input-categoria"
                    inputProps={{ 'data-testid': 'gastos-fijos-input-categoria' }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={close}
                    disabled={saving}
                    id="gastos-fijos-dialog-btn-cancelar"
                    data-testid="gastos-fijos-dialog-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={() => save((data) => ({
                        nombre: data.nombre,
                        categoria: data.categoria || null,
                        cuenta_id: data.cuenta_id ? parseInt(data.cuenta_id) : null,
                        monto_estimado: data.monto_estimado !== '' && data.monto_estimado !== undefined && data.monto_estimado !== null
                            ? parseFloat(data.monto_estimado)
                            : null,
                    }))}
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    id="gastos-fijos-dialog-btn-guardar"
                    data-testid="gastos-fijos-dialog-btn-guardar"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
