import { Box, Typography, LinearProgress, Chip, Paper } from '@mui/material';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';

const ESTADO_COLOR = {
    ok: 'success',
    alerta: 'warning',
    excedido: 'error',
};

const BARRA_COLOR = {
    ok: 'success',
    alerta: 'warning',
    excedido: 'error',
};

export default function PresupuestosWidget({ presupuestos = [] }) {
    if (!presupuestos.length) return null;

    return (
        <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Presupuesto del mes
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {presupuestos.map((p) => (
                    <Box key={p.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box sx={{
                                    width: 10, height: 10, borderRadius: '50%',
                                    bgcolor: p.categoria?.color || '#9E9E9E', flexShrink: 0,
                                }} />
                                <Typography variant="body2" fontWeight={500}>
                                    {p.categoria?.nombre || '-'}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {formatearMoneda(p.ejecutado)} / {formatearMoneda(p.monto_limite)}
                                </Typography>
                                <Chip
                                    label={`${p.porcentaje}%`}
                                    size="small"
                                    color={ESTADO_COLOR[p.estado] || 'default'}
                                />
                            </Box>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(p.porcentaje, 100)}
                            color={BARRA_COLOR[p.estado] || 'primary'}
                            sx={{ height: 8, borderRadius: 1 }}
                        />
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}
