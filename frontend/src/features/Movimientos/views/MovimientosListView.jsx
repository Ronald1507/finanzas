/**
 * Vista de listado de movimientos financieros.
 * Solo recibe datos y callbacks por props.
 *
 * @module features/Movimientos/views/MovimientosListView
 */
import React from 'react';
import {
    Box,
    Button,
    Chip,
    Autocomplete,
    TextField,
    Tooltip,
    Typography,
    Paper,
    Stack,
    Skeleton,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ComboBox from '../../../shared/components/ComboBox';
import PageHeader from '../../../shared/components/PageHeader';
import FilterToolbar from '../../../shared/components/FilterToolbar';
import DataTable from '../../../shared/components/DataTable';
import MonthNavigator from '../../../shared/components/MonthNavigator';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';
import { formatearFecha } from '../../../shared/utils/formatearFecha';

/**
 * Vista de listado de movimientos.
 *
 * @param {Object} props
 * @param {Object} props.listHook - Estado de useCrudList
 * @param {Array} props.cuentas - Lista plana de cuentas activas
 * @param {string} props.cuentaFilter - Filtro de cuenta actual
 * @param {Function} props.onCuentaFilterChange
 * @param {string} props.tipoFilter - Filtro de tipo actual
 * @param {Function} props.onTipoFilterChange
 * @param {string} props.categoriaFilter - Filtro de categoría actual
 * @param {Function} props.onCategoriaFilterChange
 * @param {Function} props.onNew - Callback nuevo movimiento
 * @param {Function} props.onEdit - Callback editar
 * @param {Function} props.onDelete - Callback eliminar
 * @param {Function} props.onTransferencia - Callback nueva transferencia
 * @param {boolean} props.mesAbierto - Si el mes está abierto
 * @returns {JSX.Element}
 */
export default function MovimientosListView({
    listHook,
    cuentas = [],
    cuentaFilter,
    onCuentaFilterChange,
    tipoFilter,
    onTipoFilterChange,
    categoriaFilter,
    onCategoriaFilterChange,
    onNew,
    onEdit,
    onDelete,
    onTransferencia,
    mesAbierto,
    cuentasSaldos = [],
    loadingSaldos = false,
}) {
    const columns = [
        {
            label: 'Fecha',
            key: 'fecha',
            render: (row) => formatearFecha(row.fecha),
        },
        { label: 'Descripción', key: 'descripcion' },
        { label: 'Categoría', key: 'categoria', hideOnMobile: true },
        {
            label: 'Cuenta',
            key: 'cuenta',
            hideOnMobile: true,
            render: (row) => row.cuenta?.nombre || '-',
        },
        {
            label: 'Tipo',
            key: 'tipo',
            render: (row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                        label={row.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        color={row.tipo === 'ingreso' ? 'success' : 'error'}
                        size="small"
                    />
                    {row.movimiento_relacionado_id && (
                        <Tooltip title="Parte de una transferencia">
                            <SwapHorizIcon fontSize="small" color="action" />
                        </Tooltip>
                    )}
                </Box>
            ),
        },
        {
            label: 'Monto',
            key: 'monto',
            render: (row) => (
                <Typography
                    variant="body2"
                    fontWeight={600}
                    color={row.tipo === 'ingreso' ? 'success.main' : 'error.main'}
                >
                    {row.tipo === 'egreso' ? '-' : '+'}{formatearMoneda(row.monto)}
                </Typography>
            ),
        },
    ];

    const filtrosExtra = (
        <>
            <ComboBox
                label="Cuenta"
                size="small"
                placeholder="Todas"
                fullWidth={false}
                sx={{ width: { xs: '100%', sm: 190 } }}
                options={cuentas.map((c) => ({ value: c.id, label: c.nombre }))}
                value={cuentaFilter}
                onChange={onCuentaFilterChange}
                testId="movimientos-select-filtro-cuenta"
            />

            <ComboBox
                label="Tipo"
                size="small"
                placeholder="Todos"
                fullWidth={false}
                sx={{ width: { xs: '100%', sm: 150 } }}
                options={[{ value: 'ingreso', label: 'Ingreso' }, { value: 'egreso', label: 'Egreso' }]}
                value={tipoFilter}
                onChange={onTipoFilterChange}
                testId="movimientos-select-filtro-tipo"
            />

            <Autocomplete
                freeSolo
                size="small"
                options={[]}
                inputValue={categoriaFilter}
                onInputChange={(_, val) => onCategoriaFilterChange(val)}
                sx={{ width: { xs: '100%', sm: 190 } }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Categoría"
                        placeholder="Escribir para filtrar..."
                        inputProps={{ ...params.inputProps, 'data-testid': 'movimientos-select-filtro-categoria' }}
                    />
                )}
            />
        </>
    );

    const mesRazonDeBloqueo = !mesAbierto ? 'Mes cerrado — solo lectura' : '';

    return (
        <Box>
            <PageHeader
                title="Movimientos"
                subtitle="Ingresos y egresos por cuenta y mes"
                action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title={mesRazonDeBloqueo || 'Nueva transferencia'}>
                            <span>
                                <Button
                                    variant="outlined"
                                    onClick={onTransferencia}
                                    disabled={!mesAbierto}
                                    startIcon={<SwapHorizIcon />}
                                    id="movimientos-btn-transferencia"
                                    data-testid="movimientos-btn-transferencia"
                                >
                                    Transferencia
                                </Button>
                            </span>
                        </Tooltip>
                        <Tooltip title={mesRazonDeBloqueo || 'Nuevo movimiento'}>
                            <span>
                                <Button
                                    variant="contained"
                                    onClick={onNew}
                                    disabled={!mesAbierto}
                                    id="movimientos-btn-nuevo"
                                    data-testid="movimientos-btn-nuevo"
                                >
                                    + Nuevo
                                </Button>
                            </span>
                        </Tooltip>
                    </Box>
                }
            />
            <MonthNavigator />

            {/* Saldos por cuenta */}
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5, my: 1.5 }}>
                {loadingSaldos
                    ? [1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={180} height={60} />)
                    : cuentasSaldos.map((cc) => {
                        const saldo = cc.saldo_final != null ? cc.saldo_final : cc.saldo_temporal;
                        const esFinal = cc.saldo_final != null;
                        return (
                            <Paper
                                key={cc.cuenta_id}
                                variant="outlined"
                                sx={{ px: 2, py: 1, minWidth: 160 }}
                            >
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    {cc.cuenta_nombre}
                                </Typography>
                                <Typography variant="subtitle2" fontWeight={700} color="primary.main" noWrap>
                                    {formatearMoneda(saldo)}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    {esFinal ? 'Saldo final' : 'Saldo temporal'}
                                </Typography>
                            </Paper>
                        );
                    })
                }
            </Stack>

            {!mesAbierto && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="warning.dark">
                        Mes cerrado — los movimientos son de solo lectura.
                    </Typography>
                </Box>
            )}
            <FilterToolbar
                searchQuery={listHook.searchQuery}
                onSearchChange={listHook.setSearchQuery}
                placeholder="Buscar por descripción o categoría..."
                extraFilters={filtrosExtra}
            />
            <DataTable
                columns={columns}
                items={listHook.items}
                loading={listHook.loading}
                page={listHook.page}
                totalPages={listHook.totalPages}
                total={listHook.total}
                onPageChange={listHook.setPage}
                onEdit={mesAbierto ? onEdit : undefined}
                onDelete={mesAbierto ? onDelete : undefined}
                emptyMessage="No hay movimientos en este mes"
            />
        </Box>
    );
}
