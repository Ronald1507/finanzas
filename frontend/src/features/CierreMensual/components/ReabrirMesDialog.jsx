/**
 * Dialog de confirmación explícita para reabrir el último mes cerrado.
 *
 * @module features/CierreMensual/components/ReabrirMesDialog
 */
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { formatearMes } from '../../../shared/utils/formatearFecha';

/**
 * Dialog de confirmación de reapertura mensual.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Object|null} props.mes - Mes a reabrir
 * @param {Function} props.onConfirm
 * @param {Function} props.onCancel
 * @param {boolean} props.loading
 * @param {string|null} props.error
 * @returns {JSX.Element}
 */
export default function ReabrirMesDialog({ open, mes, onConfirm, onCancel, loading, error }) {
    const nombreMes = mes ? formatearMes(mes.anio, mes.mes) : '';

    return (
        <Dialog
            open={open}
            onClose={() => { /* no cerrar con click afuera */ }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="meses-reabrir-dialog-titulo">
                Reabrir mes: {nombreMes}
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Typography variant="body2" gutterBottom>
                    Al reabrir este mes se revertirá el cierre:
                </Typography>
                <List dense>
                    {[
                        'Se eliminará el mes siguiente (solo si no tiene movimientos ni pendientes nuevos).',
                        'Se eliminarán los pendientes arrastrados al mes siguiente.',
                        'El saldo final de este mes quedará en blanco.',
                        'El mes volverá a estado abierto y será editable.',
                    ].map((texto, i) => (
                        <ListItem key={i} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 28 }}>
                                <FiberManualRecordIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={texto}
                                primaryTypographyProps={{ variant: 'body2' }}
                            />
                        </ListItem>
                    ))}
                </List>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Esta operación solo está permitida si el mes siguiente no tiene actividad propia.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onCancel}
                    disabled={loading}
                    id="meses-reabrir-btn-cancelar"
                    data-testid="meses-reabrir-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : null}
                    id="meses-reabrir-btn-confirmar"
                    data-testid="meses-reabrir-btn-confirmar"
                >
                    {loading ? 'Reabriendo...' : `Reabrir ${nombreMes}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
