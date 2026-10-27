/**
 * Dialog para registrar el pago de un gasto fijo en el mes.
 * Dialog controlado: todo el estado y la llamada al service viven en el orquestador
 * (GastosFijosModule). No importa hooks ni llama al service directamente.
 *
 * @module features/GastosFijos/components/RegistrarPagoDialog
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
 * Dialog para registrar el pago de un gasto fijo.
 *
 * @param {Object} props
 * @param {boolean} props.open - Si el dialog está abierto
 * @param {Object|null} props.gastoFijo - Item del gasto fijo a pagar
 * @param {Array} props.cuentas - Lista plana de cuentas activas
 * @param {string} props.monto - Valor actual del campo monto
 * @param {Function} props.onMontoChange - Callback al cambiar el monto
 * @param {*} props.cuentaId - Valor actual de la cuenta seleccionada
 * @param {Function} props.onCuentaChange - Callback al cambiar la cuenta
 * @param {string} props.fecha - Valor actual del campo fecha
 * @param {Function} props.onFechaChange - Callback al cambiar la fecha
 * @param {Object|null} props.errors - Errores de validación
 * @param {boolean} props.saving - Indicador de guardado en progreso
 * @param {Function} props.onSave - Callback para confirmar el pago
 * @param {Function} props.onClose - Callback para cerrar el dialog
 * @returns {JSX.Element}
 */
export default function RegistrarPagoDialog({
    open,
    gastoFijo,
    cuentas = [],
    monto,
    onMontoChange,
    cuentaId,
    onCuentaChange,
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
            <DialogTitle id="gastos-fijos-pago-dialog-titulo">
                {gastoFijo ? `Pagar: ${gastoFijo.nombre}` : 'Registrar Pago'}
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
                    label="Monto"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={monto}
                    onChange={(e) => onMontoChange(e.target.value)}
                    error={!!errors?.monto}
                    helperText={errors?.monto ? errors.monto[0] : 'Monto realmente pagado'}
                    sx={{ mt: 1 }}
                    id="gastos-fijos-pago-input-monto"
                    inputProps={{ min: 0.01, step: '0.01', 'data-testid': 'gastos-fijos-pago-input-monto' }}
                />

                <ComboBox
                    label="Cuenta"
                    required
                    sx={{ mt: 2 }}
                    options={cuentas.map((c) => ({ value: c.id, label: c.nombre }))}
                    value={cuentaId || ''}
                    onChange={onCuentaChange}
                    error={errors?.cuenta_id?.[0]}
                    testId="gastos-fijos-pago-select-cuenta"
                />

                <TextField
                    required
                    margin="dense"
                    label="Fecha de pago"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={fecha}
                    onChange={(e) => onFechaChange(e.target.value)}
                    error={!!errors?.fecha}
                    helperText={errors?.fecha ? errors.fecha[0] : 'Fecha en que se realizó el pago'}
                    sx={{ mt: 2 }}
                    id="gastos-fijos-pago-input-fecha"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 'data-testid': 'gastos-fijos-pago-input-fecha' }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    disabled={saving}
                    id="gastos-fijos-pago-btn-cancelar"
                    data-testid="gastos-fijos-pago-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={onSave}
                    variant="contained"
                    color="success"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    id="gastos-fijos-pago-btn-confirmar"
                    data-testid="gastos-fijos-pago-btn-confirmar"
                >
                    {saving ? 'Pagando...' : 'Confirmar Pago'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
