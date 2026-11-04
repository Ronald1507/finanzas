import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, MenuItem, CircularProgress, Alert } from '@mui/material';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import useMesStore from '../../../shared/hooks/useMesStore';
import { reportesService } from '../services/reportesService';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

export default function EvolucionAnualView() {
    const mesSeleccionado = useMesStore((s) => s.mesSeleccionado);
    const [anio, setAnio] = useState(mesSeleccionado?.anio || CURRENT_YEAR);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        reportesService
            .evolucionAnual(anio)
            .then((res) => {
                if (res.success) {
                    const rows = (res.data || [])
                        .map((item, idx) =>
                            item
                                ? {
                                      name: MESES_CORTO[idx],
                                      ingresos: item.ingresos,
                                      egresos: item.egresos,
                                      saldo_final: item.saldo_final,
                                  }
                                : null
                        )
                        .filter(Boolean);
                    setData(rows);
                }
            })
            .catch(() => setError('Error al cargar la evolución anual.'))
            .finally(() => setLoading(false));
    }, [anio]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <TextField
                    select
                    label="Año"
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                    size="small"
                    sx={{ width: 100 }}
                >
                    {YEAR_OPTIONS.map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && data.length === 0 && (
                <Alert severity="info">No hay datos para el año {anio}.</Alert>
            )}

            {data.length > 0 && (
                <>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={600} mb={2}>
                                Saldo final por mes
                            </Typography>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={data} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={60} />
                                    <Tooltip formatter={(v) => (v != null ? formatearMoneda(v) : 'Sin cierre')} />
                                    <Line
                                        type="monotone"
                                        dataKey="saldo_final"
                                        name="Saldo final"
                                        stroke="#2563EB"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        connectNulls={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={600} mb={2}>
                                Ingresos y Egresos por mes (apilados)
                            </Typography>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={data} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={60} />
                                    <Tooltip formatter={(v) => formatearMoneda(v)} />
                                    <Legend />
                                    <Bar dataKey="ingresos" name="Ingresos" stackId="a" fill="#10B981" />
                                    <Bar dataKey="egresos" name="Egresos" stackId="a" fill="#EF4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </>
            )}
        </Box>
    );
}
