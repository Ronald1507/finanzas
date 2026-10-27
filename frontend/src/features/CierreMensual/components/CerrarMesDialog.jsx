/**
 * Dialog de confirmación explícita para cerrar un mes.
 * Explica las consecuencias del cierre al usuario.
 *
 * @module features/CierreMensual/components/CerrarMesDialog
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
 * Dialog de confirmación de cierre mensual.
 *
 * @param {Object} props
 * @param {boolean} props.open - Si el dialog está abierto
 * @param {Object|null} props.mes - Mes a cerrar
 * @param {Function} props.onConfirm - Callback al confirmar
 * @param {Function} props.onCancel - Callback al cancelar
 * @param {boolean} props.loading - Indicador de carga
 * @param {string|null} props.error - Mensaje de error
 * @returns {JSX.Element}
 */
export default function CerrarMesDialog({ open, mes, onConfirm, onCancel, loading, error }) {
    const nombreMes = mes ? formatearMes(mes.anio, mes.mes) : '';

    return (
        <Dialog
            open={open}
            onClose={() => { /* no cerrar con click afuera */ }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="meses-cerrar-dialog-titulo">
                Cerrar mes: {nombreMes}
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Typography variant="body2" gutterBottom>
                    Al cerrar el mes se realizarán las siguientes acciones de forma automática e irreversible:
                </Typography>
                <List dense>
                    {[
                        'Se congelarán los saldos finales de cada cuenta (saldo temporal al momento del cierre).',
                        'Se creará el mes siguiente con los saldos finales como saldos iniciales.',
                        'Los pendientes no resueltos se arrastrarán al mes siguiente.',
                        'El mes quedará inmutable: no se podrán agregar ni editar movimientos ni pendientes.',
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
                    Esta acción puede revertirse mediante la reapertura, siempre que el mes siguiente
                    no tenga movimientos ni pendientes nuevos.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onCancel}
                    disabled={loading}
                    id="meses-cerrar-btn-cancelar"
                    data-testid="meses-cerrar-btn-cancelar"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="warning"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : null}
                    id="meses-cerrar-btn-confirmar"
                    data-testid="meses-cerrar-btn-confirmar"
                >
                    {loading ? 'Cerrando...' : `Cerrar ${nombreMes}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
