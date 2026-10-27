/**
 * Vista de listado de pendientes (por pagar y por recibir).
 * Solo recibe datos y callbacks por props.
 *
 * @module features/Pendientes/views/PendientesListView
 */
import React from 'react';
import {
    Box,
    Button,
    Chip,
    Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PageHeader from '../../../shared/components/PageHeader';
import FilterToolbar from '../../../shared/components/FilterToolbar';
import DataTable from '../../../shared/components/DataTable';
import MonthNavigator from '../../../shared/components/MonthNavigator';
import ComboBox from '../../../shared/components/ComboBox';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';
import { formatearFecha } from '../../../shared/utils/formatearFecha';

const ESTADO_CHIP = {
    pendiente: { label: 'Pendiente', color: 'warning' },
    realizado: { label: 'Realizado', color: 'success' },
    anulado: { label: 'Anulado', color: 'default' },
};

const TIPO_LABEL = {
    por_pagar: 'Por Pagar',
    por_recibir: 'Por Recibir',
};

/**
 * Vista de listado de pendientes.
 *
 * @param {Object} props
 * @param {Object} props.listHook - Estado de useCrudList
 * @param {string} props.tipoFilter
 * @param {Function} props.onTipoFilterChange
 * @param {string} props.estadoFilter
 * @param {Function} props.onEstadoFilterChange
 * @param {Function} props.onNew
 * @param {Function} props.onEdit
 * @param {Function} props.onConcretar
 * @param {Function} props.onAnular
 * @param {boolean} props.mesAbierto
 * @returns {JSX.Element}
 */
export default function PendientesListView({
    listHook,
    tipoFilter,
    onTipoFilterChange,
    estadoFilter,
    onEstadoFilterChange,
    onNew,
    onEdit,
    onConcretar,
    onAnular,
    mesAbierto,
}) {
    const columns = [
        { label: 'Descripción', key: 'descripcion' },
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
                <Chip
                    label={TIPO_LABEL[row.tipo] || row.tipo}
                    color={row.tipo === 'por_recibir' ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                />
            ),
        },
        {
            label: 'Monto',
            key: 'monto',
            render: (row) => formatearMoneda(row.monto),
        },
        {
            label: 'Fecha Estimada',
            key: 'fecha_estimada',
            hideOnMobile: true,
            render: (row) => formatearFecha(row.fecha_estimada),
        },
        {
            label: 'Estado',
            key: 'estado',
            render: (row) => {
                const chip = ESTADO_CHIP[row.estado] || { label: row.estado, color: 'default' };
                return <Chip label={chip.label} color={chip.color} size="small" />;
            },
        },
    ];

    const puedeAccionar = (item) => item.estado === 'pendiente' && mesAbierto;

    const extraAcciones = [
        {
            label: 'Editar',
            icon: <EditIcon fontSize="small" />,
            color: 'primary',
            onClick: onEdit,
            disabled: (item) => !puedeAccionar(item),
        },
        {
            label: 'Concretar',
            icon: <CheckCircleIcon fontSize="small" />,
            color: 'success',
            onClick: onConcretar,
            disabled: (item) => !puedeAccionar(item),
        },
        {
            label: 'Anular',
            icon: <CancelIcon fontSize="small" />,
            color: 'warning',
            onClick: (item) => onAnular(item),
            disabled: (item) => !puedeAccionar(item),
        },
    ];

    const filtrosExtra = (
        <>
            <ComboBox
                label="Tipo"
                size="small"
                placeholder="Todos"
                fullWidth={false}
                sx={{ width: { xs: '100%', sm: 180 } }}
                options={[{ value: 'por_pagar', label: 'Por Pagar' }, { value: 'por_recibir', label: 'Por Recibir' }]}
                value={tipoFilter}
                onChange={onTipoFilterChange}
                testId="pendientes-select-filtro-tipo"
            />

            <ComboBox
                label="Estado"
                size="small"
                placeholder="Todos"
                fullWidth={false}
                sx={{ width: { xs: '100%', sm: 180 } }}
                options={[{ value: 'pendiente', label: 'Pendiente' }, { value: 'realizado', label: 'Realizado' }, { value: 'anulado', label: 'Anulado' }]}
                value={estadoFilter}
                onChange={onEstadoFilterChange}
                testId="pendientes-select-filtro-estado"
            />
        </>
    );

    return (
        <Box>
            <PageHeader
                title="Pendientes"
                subtitle="Cuentas por pagar y por recibir"
                action={
                    <Tooltip title={!mesAbierto ? 'Mes cerrado' : 'Nuevo pendiente'}>
                        <span>
                            <Button
                                variant="contained"
                                onClick={onNew}
                                disabled={!mesAbierto}
                                id="pendientes-btn-nuevo"
                                data-testid="pendientes-btn-nuevo"
                            >
                                + Nuevo Pendiente
                            </Button>
                        </span>
                    </Tooltip>
                }
            />
            <MonthNavigator />
            <FilterToolbar
                showSearch={false}
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
                extraActions={extraAcciones}
                emptyMessage="No hay pendientes en este mes"
            />
        </Box>
    );
}
