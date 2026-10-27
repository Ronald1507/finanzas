/**
 * Cards de saldos consolidados del mes.
 * Muestra saldo inicial, ingresos, egresos, temporal, por pagar, por recibir, potencial
 * y saldo final (solo en mes cerrado).
 *
 * @module features/SaldosDashboard/components/ConsolidadoCards
 */
import React from 'react';
import { Grid, Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import InsightsIcon from '@mui/icons-material/Insights';
import LockIcon from '@mui/icons-material/Lock';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';

/**
 * @param {Object} props
 * @param {Object|null} props.consolidado - Datos consolidados del mes
 * @param {boolean} props.loading - Indicador de carga
 * @param {boolean} props.mesCerrado - Si el mes está cerrado
 * @returns {JSX.Element}
 */
export default function ConsolidadoCards({ consolidado, loading, mesCerrado }) {
    const cards = [
        { label: 'Saldo Inicial', key: 'saldo_inicial', color: '#64748B', icon: <AccountBalanceIcon /> },
        { label: 'Ingresos', key: 'ingresos', color: '#059669', icon: <TrendingUpIcon /> },
        { label: 'Egresos', key: 'egresos', color: '#DC2626', icon: <TrendingDownIcon /> },
        { label: 'Saldo Temporal', key: 'saldo_temporal', color: '#2563EB', icon: <AccountBalanceWalletIcon />, highlight: true },
        { label: 'Por Pagar', key: 'por_pagar', color: '#F87171', icon: <CallMadeIcon /> },
        { label: 'Por Recibir', key: 'por_recibir', color: '#34D399', icon: <CallReceivedIcon /> },
        { label: 'Saldo Potencial', key: 'saldo_potencial', color: '#0D9488', icon: <InsightsIcon />, highlight: true },
        ...(mesCerrado
            ? [{ label: 'Saldo Final', key: 'saldo_final', color: '#1E40AF', icon: <LockIcon />, highlight: true }]
            : []),
    ];

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            {cards.map((card) => (
                <Grid item xs={6} sm={4} md={3} key={card.key}>
                    <Card
                        sx={{
                            height: '100%',
                            borderColor: card.highlight ? card.color : 'divider',
                            boxShadow: card.highlight
                                ? `0 2px 10px ${card.color}22`
                                : '0 1px 3px rgba(15, 23, 42, 0.06)',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 16px ${card.color}26` },
                        }}
                    >
                        <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                <Box
                                    sx={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: `${card.color}1A`,
                                        color: card.color,
                                        '& svg': { fontSize: 20 },
                                    }}
                                >
                                    {card.icon}
                                </Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {card.label}
                                </Typography>
                            </Box>
                            {loading ? (
                                <Skeleton width="80%" height={34} />
                            ) : (
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    sx={{ color: card.color, fontVariantNumeric: 'tabular-nums' }}
                                >
                                    {consolidado ? formatearMoneda(consolidado[card.key] || 0) : '$0'}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
}
