/**
 * Tabla de saldos por cuenta para el dashboard.
 *
 * @module features/SaldosDashboard/components/CuentasSaldosTable
 */
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Skeleton,
    Box,
} from '@mui/material';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';

/**
 * Tabla responsive con saldos detallados por cuenta.
 *
 * @param {Object} props
 * @param {Array} props.cuentas - Lista de saldos por cuenta
 * @param {boolean} props.loading - Indicador de carga
 * @param {boolean} props.mesCerrado - Si el mes está cerrado
 * @returns {JSX.Element}
 */
export default function CuentasSaldosTable({ cuentas = [], loading, mesCerrado }) {
    if (loading) {
        return (
            <Box>
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={48} sx={{ mb: 1 }} />
                ))}
            </Box>
        );
    }

    if (cuentas.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No hay cuentas registradas en este mes.</Typography>
            </Paper>
        );
    }

    return (
        <Paper>
            <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Cuenta</TableCell>
                            <TableCell align="right">Saldo Inicial</TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                Ingresos
                            </TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                Egresos
                            </TableCell>
                            <TableCell align="right">Saldo Temporal</TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                Por Pagar
                            </TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                Por Recibir
                            </TableCell>
                            <TableCell align="right">Saldo Potencial</TableCell>
                            {mesCerrado && (
                                <TableCell align="right">Saldo Final</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cuentas.map((cuenta) => (
                            <TableRow key={cuenta.cuenta_id || cuenta.id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                        {cuenta.cuenta_nombre}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    {formatearMoneda(cuenta.saldo_inicial)}
                                </TableCell>
                                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                    <Typography color="success.main" variant="body2">
                                        {formatearMoneda(cuenta.ingresos)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                    <Typography color="error.main" variant="body2">
                                        {formatearMoneda(cuenta.egresos)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography fontWeight={600} color="primary.main" variant="body2">
                                        {formatearMoneda(cuenta.saldo_temporal)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                    <Typography color="error.light" variant="body2">
                                        {formatearMoneda(cuenta.por_pagar)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                    <Typography color="success.light" variant="body2">
                                        {formatearMoneda(cuenta.por_recibir)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography fontWeight={600} color="secondary.main" variant="body2">
                                        {formatearMoneda(cuenta.saldo_potencial)}
                                    </Typography>
                                </TableCell>
                                {mesCerrado && (
                                    <TableCell align="right">
                                        <Typography fontWeight={700} color="primary.dark" variant="body2">
                                            {formatearMoneda(cuenta.saldo_final)}
                                        </Typography>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
