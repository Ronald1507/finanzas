/**
 * Dialog para crear o editar una cuenta bancaria.
 *
 * @module features/GestionCuentas/components/CuentaDialog
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

const TIPOS_CUENTA = [
    { value: 'corriente', label: 'Cuenta Corriente' },
    { value: 'vista', label: 'Cuenta Vista' },
    { value: 'ahorro', label: 'Cuenta de Ahorro' },
    { value: 'credito', label: 'Tarjeta de Crédito' },
    { value: 'efectivo', label: 'Efectivo' },
];

/**
 * Dialog para crear/editar cuenta bancaria.
 *
 * @param {Object} props
 * @param {Object} props.dialogState - Estado del hook useDialogState
 * @returns {JSX.Element}
 */
export default function CuentaDialog({ dialogState }) {
    const { open, formData, errors, saving, close, setField, save } = dialogState;
    const esEdicion = !!formData.id;

    return (
        <Dialog
            open={open}
            onClose={() => { /* no cerrar con click afuera */ }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="cuentas-dialog-titulo">
                {esEdicion ? 'Editar Cuenta' : 'Nueva Cuenta'}
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
                    label="Nombre de la cuenta"
                    fullWidth
                    variant="outlined"
                    value={formData.nombre || ''}
                    onChange={(e) => setField('nombre', e.target.value)}
                    error={!!errors?.nombre}
                    helperText={errors?.nombre ? errors.nombre[0] : 'Ej: Cuenta BCI Principal'}
                    sx={{ mt: 2 }}
                    id="cuentas-input-nombre"
                    inputProps={{ 'data-testid': 'cuentas-input-nombre' }}
                />

                <TextField
                    margin="dense"
                    label="Banco (opcional)"
                    fullWidth
                    variant="outlined"
                    value={formData.banco || ''}
                    onChange={(e) => setField('banco', e.target.value)}
                    error={!!errors?.banco}
                    helperText={errors?.banco ? errors.banco[0] : 'Ej: BCI, Banco de Chile, BICE'}
                    sx={{ mt: 2 }}
                    id="cuentas-input-banco"
                    inputProps={{ 'data-testid': 'cuentas-input-banco' }}
                />

                <ComboBox
                    label="Tipo de cuenta"
                    required
                    sx={{ mt: 2 }}
                    options={TIPOS_CUENTA}
                    value={formData.tipo || ''}
                    onChange={(v) => setField('tipo', v)}
                    error={errors?.tipo?.[0]}
                    testId="cuentas-select-tipo"
                />

                {!esEdicion && (
                    <TextField
                        margin="dense"
                        label="Saldo inicial"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={formData.saldo_inicial !== undefined ? formData.saldo_inicial : ''}
                        onChange={(e) => setField('saldo_inicial', e.target.value)}
                        error={!!errors?.saldo_inicial}
                        helperText={errors?.saldo_inicial ? errors.saldo_inicial[0] : 'Saldo al inicio del mes actual'}
                        sx={{ mt: 2 }}
                        id="cuentas-input-saldo-inicial"
                        inputProps={{ min: 0, 'data-testid': 'cuentas-input-saldo-inicial' }}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={close}
                    disabled={saving}
                    id="cuentas-dialog-btn-cancelar"
                    data-testid="cuentas-dialog-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={() => save((data) => ({
                        nombre: data.nombre,
                        banco: data.banco || null,
                        tipo: data.tipo,
                        ...(!esEdicion && { saldo_inicial: parseFloat(data.saldo_inicial) || 0 }),
                    }))}
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    id="cuentas-dialog-btn-guardar"
                    data-testid="cuentas-dialog-btn-guardar"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
