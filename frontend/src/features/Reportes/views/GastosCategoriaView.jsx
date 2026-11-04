import { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, TextField, MenuItem,
    ToggleButton, ToggleButtonGroup, CircularProgress, Alert,
    Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import useMesStore from '../../../shared/hooks/useMesStore';
import { reportesService } from '../services/reportesService';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

export default function GastosCategoriaView() {
    const mesSeleccionado = useMesStore((s) => s.mesSeleccionado);
    const [anio, setAnio] = useState(mesSeleccionado?.anio || CURRENT_YEAR);
    const [scope, setScope] = useState('mes');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const mesId = scope === 'mes' ? mesSeleccionado?.id : null;

    useEffect(() => {
        if (scope === 'mes' && !mesSeleccionado?.id) return;
        setLoading(true);
        setError('');
        reportesService
            .gastosPorCategoria(anio, mesId)
            .then((res) => {
                if (res.success) setData(res.data || []);
            })
            .catch(() => setError('Error al cargar los gastos por categoría.'))
            .finally(() => setLoading(false));
    }, [anio, scope, mesId]);

    const barData = data.map((d) => ({
        name: d.categoria.nombre,
        monto: d.monto,
        fill: d.categoria.color || '#6366F1',
    }));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <ToggleButtonGroup
                    value={scope}
                    exclusive
                    onChange={(_, v) => v && setScope(v)}
                    size="small"
                >
                    <ToggleButton value="mes">Mes actual</ToggleButton>
                    <ToggleButton value="anio">Año completo</ToggleButton>
                </ToggleButtonGroup>
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

            {scope === 'mes' && !mesSeleccionado?.id && (
                <Alert severity="info">Seleccioná un mes para ver el desglose.</Alert>
            )}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && data.length === 0 && (scope === 'anio' || mesSeleccionado?.id) && (
                <Alert severity="info">No hay egresos registrados para el período seleccionado.</Alert>
            )}

            {barData.length > 0 && (
                <>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={600} mb={2}>
                                Gastos por categoría
                            </Typography>
                            <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 36)}>
                                <BarChart
                                    layout="vertical"
                                    data={barData}
                                    margin={{ top: 0, right: 60, bottom: 0, left: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                    <YAxis type="category" dataKey="name" width={110} />
                                    <Tooltip formatter={(v) => formatearMoneda(v)} />
                                    <Bar dataKey="monto" name="Monto">
                                        {barData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Categoría</TableCell>
                                        <TableCell align="right">Monto</TableCell>
                                        <TableCell align="right">%</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.map((d) => (
                                        <TableRow key={d.categoria.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: '50%',
                                                            bgcolor: d.categoria.color || '#6366F1',
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    {d.categoria.nombre}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">{formatearMoneda(d.monto)}</TableCell>
                                            <TableCell align="right">{d.porcentaje}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </Box>
    );
}
