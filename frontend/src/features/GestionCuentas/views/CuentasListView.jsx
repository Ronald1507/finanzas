/**
 * Vista de listado de cuentas bancarias.
 * Solo recibe datos y callbacks por props; no contiene estado propio.
 *
 * @module features/GestionCuentas/views/CuentasListView
 */
import React from 'react';
import {
    Box,
    Button,
    Chip,
    Tooltip,
    IconButton,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EditOffIcon from '@mui/icons-material/EditOff';
import PageHeader from '../../../shared/components/PageHeader';
import FilterToolbar from '../../../shared/components/FilterToolbar';
import DataTable from '../../../shared/components/DataTable';
import ComboBox from '../../../shared/components/ComboBox';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';

const TIPOS_CUENTA_LABEL = {
    corriente: 'Corriente',
    vista: 'Vista',
    ahorro: 'Ahorro',
    credito: 'Crédito',
    efectivo: 'Efectivo',
};

/**
 * Vista de listado de cuentas con filtros y acciones.
 *
 * @param {Object} props
 * @param {Object} props.listHook - Estado de useCrudList
 * @param {string} props.activaFilter - Filtro activa/inactiva actual
 * @param {Function} props.onActivaFilterChange - Callback al cambiar filtro
 * @param {Function} props.onNew - Callback para abrir dialog de creación
 * @param {Function} props.onEdit - Callback para abrir dialog de edición
 * @param {Function} props.onSaldoInicial - Callback para corregir saldo inicial
 * @param {Function} props.onDesactivar - Callback para desactivar cuenta
 * @param {boolean} props.mesAbierto - Si el mes actual está abierto
 * @returns {JSX.Element}
 */
export default function CuentasListView({
    listHook,
    activaFilter,
    onActivaFilterChange,
    onNew,
    onEdit,
    onSaldoInicial,
    onDesactivar,
    mesAbierto,
}) {
    const columns = [
        { label: 'Nombre', key: 'nombre' },
        { label: 'Banco', key: 'banco', render: (row) => row.banco || '-', hideOnMobile: true },
        {
            label: 'Tipo', key: 'tipo',
            render: (row) => (
                <Chip
                    label={TIPOS_CUENTA_LABEL[row.tipo] || row.tipo}
                    size="small"
                    variant="outlined"
                />
            ),
        },
        {
            label: 'Estado', key: 'activa',
            render: (row) => (
                <Chip
                    label={row.activa ? 'Activa' : 'Inactiva'}
                    color={row.activa ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
    ];

    const filtroActiva = (
        <ComboBox
            label="Estado"
            size="small"
            placeholder="Todas"
            fullWidth={false}
            sx={{ width: { xs: '100%', sm: 180 } }}
            options={[{ value: '1', label: 'Activas' }, { value: '0', label: 'Inactivas' }]}
            value={activaFilter}
            onChange={onActivaFilterChange}
            testId="cuentas-select-filtro-activa"
        />
    );

    const extraAcciones = [
        {
            label: mesAbierto ? 'Corregir saldo inicial' : 'Mes cerrado',
            icon: <AccountBalanceWalletIcon fontSize="small" />,
            color: 'secondary',
            onClick: onSaldoInicial,
            disabled: (item) => !item.activa || !mesAbierto,
        },
        {
            label: 'Desactivar',
            icon: <EditOffIcon fontSize="small" />,
            color: 'warning',
            onClick: (item) => onDesactivar(item),
            disabled: (item) => !item.activa,
        },
    ];

    return (
        <Box>
            <PageHeader
                title="Gestión de Cuentas"
                subtitle="Administra tus cuentas bancarias y saldos iniciales"
                action={
                    <Button
                        variant="contained"
                        onClick={onNew}
                        id="cuentas-btn-nueva"
                        data-testid="cuentas-btn-nueva"
                    >
                        + Nueva Cuenta
                    </Button>
                }
            />
            <FilterToolbar
                searchQuery={listHook.searchQuery}
                onSearchChange={listHook.setSearchQuery}
                placeholder="Buscar por nombre..."
                extraFilters={filtroActiva}
            />
            <DataTable
                columns={columns}
                items={listHook.items}
                loading={listHook.loading}
                page={listHook.page}
                totalPages={listHook.totalPages}
                total={listHook.total}
                onPageChange={listHook.setPage}
                onEdit={onEdit}
                extraActions={extraAcciones}
                emptyMessage="No se encontraron cuentas"
            />
        </Box>
    );
}
