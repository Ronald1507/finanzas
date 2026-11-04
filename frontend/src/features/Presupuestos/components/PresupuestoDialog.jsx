import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Alert, CircularProgress,
} from '@mui/material';
import ComboBox from '../../../shared/components/ComboBox';

export default function PresupuestoDialog({ dialogState, categorias = [] }) {
    const { open, formData, errors, saving, close, setField, save } = dialogState;
    const esEdicion = !!formData.id;

    return (
        <Dialog open={open} onClose={() => {}} maxWidth="xs" fullWidth>
            <DialogTitle id="presupuesto-dialog-titulo">
                {esEdicion ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </DialogTitle>
            <DialogContent>
                {errors?.general && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{errors.general}</Alert>
                )}

                <ComboBox
                    label="Categoría"
                    required
                    sx={{ mt: 2 }}
                    options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
                    value={formData.categoria_id || ''}
                    onChange={(v) => setField('categoria_id', v)}
                    error={errors?.categoria_id?.[0]}
                    testId="presupuesto-select-categoria"
                />

                <TextField
                    required
                    margin="dense"
                    label="Monto límite"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={formData.monto_limite || ''}
                    onChange={(e) => setField('monto_limite', e.target.value)}
                    error={!!errors?.monto_limite}
                    helperText={errors?.monto_limite ? errors.monto_limite[0] : 'Límite de gasto mensual'}
                    sx={{ mt: 2 }}
                    id="presupuesto-input-monto-limite"
                    inputProps={{ min: 0.01, step: '0.01', 'data-testid': 'presupuesto-input-monto-limite' }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={close} disabled={saving} id="presupuesto-btn-cancelar">
                    Cancelar
                </Button>
                <Button
                    onClick={() => save((data) => ({
                        categoria_id: data.categoria_id ? parseInt(data.categoria_id) : null,
                        monto_limite: parseFloat(data.monto_limite) || 0,
                    }))}
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    id="presupuesto-btn-guardar"
                    data-testid="presupuesto-btn-guardar"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
