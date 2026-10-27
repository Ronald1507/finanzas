/**
 * Vista principal de Gastos Fijos.
 * Solo recibe datos y callbacks por props; no contiene estado propio.
 *
 * @module features/GastosFijos/views/GastosFijosView
 */
import React from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Tooltip,
    Typography,
    Skeleton,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import PageHeader from '../../../shared/components/PageHeader';
import MonthNavigator from '../../../shared/components/MonthNavigator';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';

/**
 * Tarjeta de total del resumen mensual.
 *
 * @param {Object} props
 * @param {string} props.label - Etiqueta del total
 * @param {string} props.value - Valor formateado a mostrar
 * @param {string} props.color - Token de color del tema (ej: 'success.main')
 * @returns {JSX.Element}
 */
function ResumenCard({ label, value, color }) {
    return (
        <Card sx={{ flex: 1, minWidth: 140 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em' }}>
                    {label}
                </Typography>
                <Typography variant="h6" sx={{ color, mt: 0.3 }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );
}

/**
 * Vista de gastos fijos del mes con resumen y checklist de pagos.
 *
 * @param {Object} props
 * @param {Array} props.items - Items del mes
 * @param {Object} props.totales - Totales { estimado, pagado, pendientes }
 * @param {boolean} props.loading - Indicador de carga
 * @param {boolean} props.mesAbierto - Si el mes está abierto
 * @param {Function} props.onNew - Abrir dialog de creación
 * @param {Function} props.onEdit - Editar gasto fijo (catálogo)
 * @param {Function} props.onDesactivar - Desactivar/eliminar del catálogo
 * @param {Function} props.onPagar - Registrar pago del mes
 * @param {Function} props.onDeshacer - Deshacer pago del mes
 * @returns {JSX.Element}
 */
export default function GastosFijosView({
    items = [],
    totales = { estimado: 0, pagado: 0, pendientes: 0 },
    loading,
    mesAbierto,
    onNew,
    onEdit,
    onDesactivar,
    onPagar,
    onDeshacer,
}) {
    const botonNuevo = (
        <Button
            variant="contained"
            onClick={onNew}
            id="gastos-fijos-btn-nuevo"
            data-testid="gastos-fijos-btn-nuevo"
        >
            + Nuevo Gasto Fijo
        </Button>
    );

    return (
        <Box>
            <PageHeader
                title="Gastos Fijos"
                subtitle="Tus pagos recurrentes del mes"
                action={botonNuevo}
            />

            <MonthNavigator />

            {!mesAbierto && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="warning.dark">
                        Mes cerrado — solo lectura.
                    </Typography>
                </Box>
            )}

            {/* Resumen de totales del mes */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <ResumenCard
                    label="Estimado"
                    value={formatearMoneda(totales.estimado)}
                    color="primary.main"
                />
                <ResumenCard
                    label="Pagado"
                    value={formatearMoneda(totales.pagado)}
                    color="success.main"
                />
                <ResumenCard
                    label="Pendientes"
                    value={totales.pendientes}
                    color="warning.main"
                />
            </Box>

            {/* Lista de gastos fijos del mes */}
            {loading ? (
                <Grid container spacing={2}>
                    {[1, 2, 3].map((n) => (
                        <Grid item xs={12} sm={6} md={4} key={n}>
                            <Card>
                                <CardContent>
                                    <Skeleton variant="rounded" width={40} height={40} sx={{ mb: 1.5 }} />
                                    <Skeleton variant="text" width="70%" />
                                    <Skeleton variant="text" width="50%" />
                                    <Skeleton variant="rounded" width={90} height={28} sx={{ mt: 1.5 }} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : items.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <ReceiptLongIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                            Aún no tenés gastos fijos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Registrá tus pagos recurrentes (luz, internet, suscripciones) para hacerles seguimiento cada mes.
                        </Typography>
                        {botonNuevo}
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={2}>
                    {items.map((item) => {
                        const montoEstimado = Number(item.monto_estimado);
                        const tieneEstimado = !Number.isNaN(montoEstimado) && item.monto_estimado !== null && item.monto_estimado !== '';
                        const subtitulo = [
                            item.categoria || 'Gastos Fijos',
                            tieneEstimado ? `~${formatearMoneda(montoEstimado)}` : null,
                        ].filter(Boolean).join(' · ');

                        return (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                <Card
                                    id={`gastos-fijos-card-${item.id}`}
                                    data-testid={`gastos-fijos-card-${item.id}`}
                                    sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                >
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: 'primary.light',
                                                    color: 'primary.contrastText',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <ReceiptLongIcon fontSize="small" />
                                            </Box>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="subtitle1" fontWeight={700} noWrap>
                                                    {item.nombre}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {subtitulo}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {item.pagado ? (
                                            <Chip
                                                label={`Pagado · ${formatearMoneda(item.monto_pagado)}`}
                                                color="success"
                                                size="small"
                                            />
                                        ) : (
                                            <Chip
                                                label="Pendiente"
                                                color="warning"
                                                size="small"
                                            />
                                        )}
                                    </CardContent>

                                    {mesAbierto && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                px: 2,
                                                py: 1,
                                                borderTop: '1px solid',
                                                borderColor: 'divider',
                                            }}
                                        >
                                            {item.pagado ? (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="warning"
                                                    onClick={() => onDeshacer(item)}
                                                    data-testid={`gastos-fijos-btn-deshacer-${item.id}`}
                                                >
                                                    Deshacer
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() => onPagar(item)}
                                                    data-testid={`gastos-fijos-btn-pagar-${item.id}`}
                                                >
                                                    Pagar
                                                </Button>
                                            )}

                                            <Box>
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onEdit(item)}
                                                        data-testid={`gastos-fijos-btn-editar-${item.id}`}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => onDesactivar(item)}
                                                        data-testid={`gastos-fijos-btn-eliminar-${item.id}`}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    )}
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
}
