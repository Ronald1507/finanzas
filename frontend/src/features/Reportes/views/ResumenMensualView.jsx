import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import useMesStore from '../../../shared/hooks/useMesStore';
import { reportesService } from '../services/reportesService';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function SummaryCard({ label, value, color }) {
    return (
        <Card>
            <CardContent>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h5" fontWeight={700} color={color}>{formatearMoneda(value)}</Typography>
            </CardContent>
        </Card>
    );
}

export default function ResumenMensualView() {
    const mesSeleccionado = useMesStore((s) => s.mesSeleccionado);
    const mesId = mesSeleccionado?.id;
    const anio = mesSeleccionado?.anio;

    const [resumen, setResumen] = useState(null);
    const [barData, setBarData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!mesId) return;
        setLoading(true);
        setError('');
        Promise.all([
            reportesService.resumenMensual(mesId),
            reportesService.evolucionAnual(anio),
        ])
            .then(([resRes, evoRes]) => {
                if (resRes.success) setResumen(resRes.data);
                if (evoRes.success) {
                    const mesNum = mesSeleccionado.mes;
                    const evo = (evoRes.data || [])
                        .filter((item, idx) => item !== null && idx + 1 <= mesNum)
                        .slice(-6)
                        .map((item) => ({
                            name: MESES_CORTO[item.mes - 1],
                            ingresos: item.ingresos,
                            egresos: item.egresos,
                        }));
                    setBarData(evo);
                }
            })
            .catch(() => setError('Error al cargar el resumen.'))
            .finally(() => setLoading(false));
    }, [mesId]);

    if (!mesId) return <Alert severity="info">Seleccioná un mes para ver el resumen.</Alert>;
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!resumen) return null;

    const pieData = (resumen.por_categoria || []).map((pc) => ({
        name: pc.categoria.nombre,
        value: pc.monto,
        fill: pc.categoria.color || '#6366F1',
    }));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <SummaryCard label="Ingresos" value={resumen.ingresos_total} color="success.main" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <SummaryCard label="Egresos" value={resumen.egresos_total} color="error.main" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <SummaryCard
                        label="Balance"
                        value={resumen.balance_neto}
                        color={resumen.balance_neto >= 0 ? 'success.main' : 'error.main'}
                    />
                </Grid>
            </Grid>

            {barData.length > 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} mb={2}>
                            Ingresos vs Egresos — últimos meses
                        </Typography>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={barData} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={60} />
                                <Tooltip formatter={(v) => formatearMoneda(v)} />
                                <Legend />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#10B981" />
                                <Bar dataKey="egresos" name="Egresos" fill="#EF4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {pieData.length > 0 ? (
                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} mb={2}>
                            Distribución de egresos por categoría
                        </Typography>
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={120}
                                    dataKey="value"
                                >
                                    {pieData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => formatearMoneda(v)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            ) : (
                <Alert severity="info">No hay egresos registrados para este mes.</Alert>
            )}
        </Box>
    );
}
