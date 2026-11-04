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
    Box,
    FormControlLabel,
    Switch,
    Typography,
} from '@mui/material';

export default function CategoriaDialog({ dialogState }) {
    const { open, formData, errors, saving, close, setField, save } = dialogState;
    const esEdicion = !!formData.id;

    const handleColorPickerChange = (e) => {
        setField('color', e.target.value);
    };

    const handleColorTextChange = (e) => {
        const val = e.target.value;
        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setField('color', val);
    };

    return (
        <Dialog open={open} onClose={() => {}} maxWidth="xs" fullWidth>
            <DialogTitle>
                {esEdicion ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogContent>
                {errors?.general && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{errors.general}</Alert>
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
                    helperText={errors?.nombre ? errors.nombre[0] : 'Ej: Alimentación, Salud'}
                    sx={{ mt: 2 }}
                    inputProps={{ 'data-testid': 'categorias-input-nombre' }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Color
                        </Typography>
                        <input
                            type="color"
                            value={formData.color || '#9E9E9E'}
                            onChange={handleColorPickerChange}
                            style={{ width: 48, height: 48, border: '1px solid rgba(0,0,0,0.23)', borderRadius: 4, cursor: 'pointer', padding: 2 }}
                            data-testid="categorias-input-color-picker"
                        />
                    </Box>
                    <TextField
                        label="Hex"
                        value={formData.color || ''}
                        onChange={handleColorTextChange}
                        error={!!errors?.color}
                        helperText={errors?.color ? errors.color[0] : '#RRGGBB'}
                        sx={{ flex: 1 }}
                        inputProps={{ 'data-testid': 'categorias-input-color-hex' }}
                    />
                </Box>

                {esEdicion && (
                    <FormControlLabel
                        sx={{ mt: 1 }}
                        control={
                            <Switch
                                checked={!!formData.activa}
                                onChange={(e) => setField('activa', e.target.checked)}
                                data-testid="categorias-switch-activa"
                            />
                        }
                        label={formData.activa ? 'Activa' : 'Inactiva'}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={close}
                    disabled={saving}
                    data-testid="categorias-dialog-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={() => save((data) => ({
                        nombre: data.nombre,
                        color: /^#[0-9A-Fa-f]{6}$/.test(data.color) ? data.color : null,
                        ...(esEdicion && { activa: !!data.activa }),
                    }))}
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    data-testid="categorias-dialog-btn-guardar"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
